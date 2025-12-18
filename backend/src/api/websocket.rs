use crate::api::auth::AppState;
use crate::models::DocumentMetadata;
use axum::{
    body::Bytes,
    extract::{
        Path, Query, State,
        ws::{Message, WebSocket, WebSocketUpgrade},
    },
    http::StatusCode,
    response::Response,
};
use chrono::Utc;
use futures_util::{SinkExt, StreamExt};
use std::collections::HashMap;
use tokio::sync::broadcast;
use uuid::Uuid;
use yrs::updates::decoder::Decode;
use yrs::updates::encoder::Encode;
use yrs::{Doc, ReadTxn, StateVector, Transact, Update};

fn read_var_from_slice(data: &[u8]) -> anyhow::Result<(u32, &[u8])> {
    let mut value: u32 = 0;
    let mut shift = 0;
    let mut pos = 0;

    loop {
        if pos >= data.len() {
            return Err(anyhow::anyhow!("varint decoding ran out of bytes"));
        }

        let byte = data[pos] as u32;
        pos += 1;

        value |= (byte & 0x7F) << shift;

        if byte & 0x80 == 0 {
            break;
        }

        shift += 7;
    }

    Ok((value, &data[pos..]))
}

fn encode_var_uint(buf: &mut Vec<u8>, mut value: u32) -> anyhow::Result<()> {
    loop {
        let mut byte = (value & 0x7F) as u8;
        value >>= 7;
        if value > 0 {
            byte |= 0x80;
        }
        buf.push(byte);
        if value == 0 {
            break;
        }
    }
    Ok(())
}

// /ws/:doc WebSocket handler
#[axum::debug_handler]
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    Query(query): Query<HashMap<String, String>>,
    Path(doc): Path<String>,
) -> Result<Response, StatusCode> {
    // Log the raw path doc and query params received at upgrade so we can confirm what the router provided
    tracing::info!("ws upgrade for doc path param: {:?}", doc);
    tracing::debug!("ws upgrade query params: {:?}", query);

    // Extract and validate JWT token from query parameters
    let token = query.get("token").ok_or_else(|| {
        tracing::warn!("WebSocket connection attempt without token");
        StatusCode::UNAUTHORIZED
    })?;

    let claims = crate::auth::validate_token(token, &state.config.jwt_secret).map_err(|e| {
        tracing::warn!("Invalid token: {:?}", e);
        StatusCode::UNAUTHORIZED
    })?;

    let user_id = claims.sub;

    // Extract vault_id from query parameters
    let vault_id_str = query.get("vaultId").ok_or_else(|| {
        tracing::warn!("WebSocket connection attempt without vaultId");
        StatusCode::BAD_REQUEST
    })?;

    let vault_id = Uuid::parse_str(vault_id_str).map_err(|_| {
        tracing::warn!("Invalid vault_id format: {}", vault_id_str);
        StatusCode::BAD_REQUEST
    })?;

    // Verify vault access: user must own the vault OR be a member
    let vault_access = sqlx::query!(
        "SELECT v.id FROM vaults v
         WHERE v.id = $1 AND (v.user_id = $2 OR EXISTS (
            SELECT 1 FROM vault_members vm WHERE vm.vault_id = v.id AND vm.user_id = $2
         ))",
        vault_id,
        user_id
    )
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| {
        tracing::error!("Database error checking vault access: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let has_vault_access = vault_access.is_some();

    if !has_vault_access {
        tracing::warn!(
            "User {} attempted to access vault {} they don't own",
            user_id,
            vault_id
        );
    }

    tracing::info!(
        "WebSocket authenticated: user_id={}, vault_id={}, has_access={}",
        user_id,
        vault_id,
        has_vault_access
    );

    // Prefer path param when present, otherwise fallback to ?doc=<id> query parameter
    let path_doc = if !doc.is_empty() {
        Some(doc)
    } else {
        query.get("doc").cloned()
    };

    Ok(ws.on_upgrade(move |socket| {
        handle_socket(socket, state, path_doc, vault_id, user_id, has_vault_access)
    }))
}

async fn handle_socket(
    socket: WebSocket,
    state: AppState,
    doc: Option<String>,
    vault_id: Uuid,
    user_id: Uuid,
    has_vault_access: bool,
) {
    tracing::info!(
        "WebSocket connection established, doc: {:?}, vault_id={}, user_id={}, has_vault_access={}",
        doc,
        vault_id,
        user_id,
        has_vault_access
    );

    let (mut sender, mut receiver) = socket.split();
    tracing::info!("WebSocket split into sender/receiver");

    // If user doesn't have vault access, close connection immediately
    if !has_vault_access {
        let _ = sender.send(Message::Close(None)).await;
        tracing::warn!(
            "Closed WebSocket connection for user {} - vault access denied",
            user_id
        );
        return;
    }

    // Track which documents this client is subscribed to
    let mut subscriptions: HashMap<String, broadcast::Receiver<Vec<u8>>> = HashMap::new();

    // Keep-alive: send ping every 5 seconds to prevent client timeout
    let mut keep_alive_interval = tokio::time::interval(tokio::time::Duration::from_secs(5));

    loop {
        tokio::select! {
            // Keep-alive ping
            _ = keep_alive_interval.tick() => {
                tracing::debug!("Sending keep-alive ping");
                if let Err(e) = sender.send(Message::Ping(Bytes::new())).await {
                    tracing::info!("Failed to send keep-alive ping: {}", e);
                    break;
                }
            }

            // Handle incoming messages from client
            msg = receiver.next() => {
                tracing::info!("Received something from socket: {:?}", msg.is_some());
                match msg {
                    Some(Ok(Message::Binary(data))) => {
                        // Diagnostic logging for incoming binary frames
                        tracing::info!("Received WebSocket Binary message ({} bytes)", data.len());
                        if !data.is_empty() {
                            let hex_preview = data[..std::cmp::min(16, data.len())]
                                .iter()
                                .map(|b| format!("{:02x}", b))
                                .collect::<Vec<_>>()
                                .join(" ");
                            tracing::debug!("Message hex (first 16 bytes): {}", hex_preview);
                        } else {
                            tracing::warn!("Received Binary message with zero length");
                        }

                        match handle_binary_message(&mut sender, &state, &data, &mut subscriptions, &doc, vault_id, user_id).await {
                            Ok(_) => tracing::debug!("Message handled successfully"),
                            Err(e) => {
                                tracing::error!("Error handling binary message: {:?}", e);
                                // Don't close the connection on error, just log and continue
                            }
                        }
                    }
                    Some(Ok(Message::Close(frame))) => {
                        tracing::info!("Client closed connection (close frame = {:?})", frame);
                        break;
                    }
                    Some(Ok(Message::Text(t))) => {
                        tracing::debug!("Received Text WebSocket message ({} chars)", t.len());
                    }
                    Some(Ok(Message::Ping(p))) => {
                        tracing::debug!("Received Ping ({} bytes)", p.len());
                    }
                    Some(Ok(Message::Pong(p))) => {
                        tracing::debug!("Received Pong ({} bytes)", p.len());
                    }
                    Some(Err(e)) => {
                        tracing::error!("WebSocket error: {}", e);
                        break;
                    }
                    None => {
                        tracing::info!("WebSocket closed");
                        break;
                    }
                }
            }

            // Handle broadcast updates from other clients
            // Only select on broadcast if we have subscriptions
            update = async {
                if subscriptions.is_empty() {
                    std::future::pending().await
                } else {
                    for (_guid, receiver) in subscriptions.iter_mut() {
                        match receiver.try_recv() {
                            Ok(update_data) => {
                                tracing::info!("Got broadcast update: {} bytes", update_data.len());
                                return Some(update_data);
                            }
                            Err(broadcast::error::TryRecvError::Empty) => continue,
                            Err(broadcast::error::TryRecvError::Lagged(_)) => {
                                tracing::warn!("Client lagged behind on updates");
                            }
                            Err(broadcast::error::TryRecvError::Closed) => {}
                        }
                    }
                    // If no updates available, sleep briefly to avoid busy loop
                    tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
                    None::<Vec<u8>>
                }
            }, if !subscriptions.is_empty() => {
                if let Some(update_data) = update {
                    // Trace-level hex dump of the outgoing broadcast to this client (first 256 bytes)
                    {
                        let dump_len = std::cmp::min(256, update_data.len());
                        if dump_len > 0 {
                            let dump = update_data[..dump_len]
                                .iter()
                                .map(|b| format!("{:02x}", b))
                                .collect::<Vec<_>>()
                                .join(" ");
                            tracing::trace!(
                                "Outgoing per-client broadcast payload hex (first {} bytes): {}",
                                dump_len,
                                dump
                            );
                        } else {
                            tracing::trace!("Outgoing per-client broadcast payload is empty");
                        }
                    }

                    if let Err(e) = sender.send(Message::Binary(Bytes::from(update_data))).await {
                        tracing::error!("Failed to send broadcast: {}", e);
                        break;
                    }
                }
            }
        }
    }

    tracing::info!("WebSocket connection closed");
}

async fn handle_binary_message(
    sender: &mut futures_util::stream::SplitSink<WebSocket, Message>,
    state: &AppState,
    data: &[u8],
    subscriptions: &mut HashMap<String, broadcast::Receiver<Vec<u8>>>,
    doc: &Option<String>,
    vault_id: Uuid,
    user_id: Uuid,
) -> anyhow::Result<()> {
    // Yjs y-protocols message format:
    // varUint(syncProtocolMessageType) • varUint(messageType) • varByteArray(payload)
    // where syncProtocolMessageType := 0 for sync protocol
    // messageType := 0 (Sync Step 1), 1 (Sync Step 2), 2 (Update)
    // Message types:
    // 0 = Sync Step 1 (client sends state vector)
    // 1 = Sync Step 2 (server sends missing updates)
    // 2 = Update (incremental update)
    // 3 = Awareness (cursor position, etc)

    if data.is_empty() {
        tracing::warn!("handle_binary_message called with empty data");
        return Ok(());
    }

    tracing::debug!(
        "Raw message bytes (first 10): {:?}",
        &data[..std::cmp::min(10, data.len())]
    );

    let (protocol_type, rest1) = read_var_from_slice(data)?;
    tracing::info!(
        "Decoded protocol_type: {}, remaining bytes: {}",
        protocol_type,
        rest1.len()
    );

    if protocol_type == 0 {
        // Sync protocol message
        let (msg_type, rest2) = read_var_from_slice(rest1)?;
        tracing::debug!(
            "Decoded msg_type: {}, remaining bytes: {}",
            msg_type,
            rest2.len()
        );

        // Now read the payload as varByteArray (length prefixed)
        let (payload_len, payload_start) = read_var_from_slice(rest2)?;
        tracing::debug!(
            "Decoded payload_len: {}, remaining bytes: {}",
            payload_len,
            payload_start.len()
        );
        let payload_len = payload_len as usize;

        if payload_start.len() < payload_len {
            tracing::warn!(
                "Message payload length mismatch: declared={}, available={}",
                payload_len,
                payload_start.len()
            );
            return Ok(());
        }

        let payload = &payload_start[..payload_len];

        tracing::debug!(
            "handle_binary_message: protocol_type={} msg_type={} total_len={} payload_len={}",
            protocol_type,
            msg_type,
            data.len(),
            payload.len()
        );

        match msg_type {
            0 => {
                // Sync Step 1: Client sends state vector
                handle_sync_step1(sender, state, payload, subscriptions, doc, vault_id).await?;
            }
            1 => {
                // Sync Step 2 is normally server -> client only. If we receive a msg_type=1 from a client,
                // it's likely a misrouted message. Log and ignore.
                tracing::warn!(
                    "Received msg_type=1 from client (Sync Step 2); payload_len={}",
                    payload.len()
                );
            }
            2 => {
                // Update: Client sends incremental update
                handle_update(sender, state, payload, doc, vault_id, user_id).await?;
            }
            _ => {
                tracing::warn!("Unknown sync message type: {}", msg_type);
            }
        }
    } else if protocol_type == 1 {
        // Awareness protocol message
        tracing::debug!("Received awareness message, rest1 len: {}", rest1.len());
        tracing::debug!(
            "Awareness raw bytes (first 20): {:?}",
            &rest1[..std::cmp::min(20, rest1.len())]
        );

        let (payload_len, payload_start) = read_var_from_slice(rest1)?;
        let payload_len = payload_len as usize;

        tracing::debug!(
            "Awareness payload_len: {}, remaining: {}",
            payload_len,
            payload_start.len()
        );

        if payload_start.len() < payload_len {
            tracing::warn!(
                "Awareness payload length mismatch: declared={}, available={}",
                payload_len,
                payload_start.len()
            );
            return Ok(());
        }

        let payload = &payload_start[..payload_len];
        tracing::debug!(
            "Awareness payload (first 32 bytes): {:?}",
            &payload[..std::cmp::min(32, payload.len())]
        );
        handle_awareness(sender, state, payload).await?;
    } else {
        tracing::warn!("Unknown protocol type: {}", protocol_type);
    }

    Ok(())
}

async fn handle_sync_step1(
    sender: &mut futures_util::stream::SplitSink<WebSocket, Message>,
    state: &AppState,
    payload: &[u8],
    subscriptions: &mut HashMap<String, broadcast::Receiver<Vec<u8>>>,
    doc: &Option<String>,
    vault_id: Uuid,
) -> anyhow::Result<()> {
    // Payload is the state vector (already decoded as varByteArray by caller)
    let state_vector_bytes = payload;

    // When using path-based doc id, use it directly
    let guid = match doc.as_ref() {
        Some(path_guid) => path_guid.clone(),
        None => {
            tracing::warn!("Sync step 1 received without document guid in path");
            return Ok(());
        }
    };

    tracing::info!(
        "Sync step 1 for document: {} in vault {} (state_vector {} bytes)",
        guid,
        vault_id,
        state_vector_bytes.len()
    );

    // Decode state vector
    let state_vector = StateVector::decode_v1(state_vector_bytes)?;

    // Load document from database (verifies it belongs to this vault)
    let (doc_obj, metadata) = load_or_create_document(state, &guid, vault_id).await?;

    // Send diff to client
    let update = {
        let txn = doc_obj.transact();
        let diff = txn.encode_diff_v1(&state_vector);
        tracing::debug!(
            "Sending diff: {} bytes (client state_vector: {:?})",
            diff.len(),
            &state_vector
        );
        diff
    };

    // Send metadata to client (protocol type 2)
    let metadata_json = serde_json::to_string(&metadata)?;
    let mut metadata_msg = Vec::new();
    encode_var_uint(&mut metadata_msg, 2)?; // Metadata protocol marker
    encode_var_uint(&mut metadata_msg, 1)?; // Message type (Server -> Client metadata)
    encode_var_uint(&mut metadata_msg, metadata_json.len() as u32)?; // Payload length
    metadata_msg.extend_from_slice(metadata_json.as_bytes());

    // Send Sync Step 2 back to client
    // Format: varUint(0) • varUint(1) • varByteArray(update)
    let mut response = Vec::new();
    encode_var_uint(&mut response, 0)?; // Sync protocol marker
    encode_var_uint(&mut response, 1)?; // Message type (Sync Step 2)
    encode_var_uint(&mut response, update.len() as u32)?; // Payload length
    response.extend_from_slice(&update);

    // Log the response we're sending
    let hex_dump = response[..std::cmp::min(64, response.len())]
        .iter()
        .map(|b| format!("{:02x}", b))
        .collect::<Vec<_>>()
        .join(" ");
    tracing::info!(
        "Sending SyncStep2: {} bytes total, first 64 bytes hex: {}",
        response.len(),
        hex_dump
    );

    sender.send(Message::Binary(Bytes::from(response))).await?;

    // Send metadata to client
    sender
        .send(Message::Binary(Bytes::from(metadata_msg)))
        .await?;

    // Subscribe this client to document updates
    if !subscriptions.contains_key(&guid) {
        let receiver = state.sync_manager.subscribe(&guid).await;
        subscriptions.insert(guid.clone(), receiver);
        tracing::debug!("Client subscribed to document: {}", guid);
    }

    Ok(())
}

async fn handle_update(
    _sender: &mut futures_util::stream::SplitSink<WebSocket, Message>,
    state: &AppState,
    payload: &[u8],
    doc: &Option<String>,
    vault_id: Uuid,
    user_id: Uuid,
) -> anyhow::Result<()> {
    tracing::debug!("handle_update called with payload {} bytes", payload.len());

    // Payload is the update (already decoded as varByteArray by caller)
    let update_bytes = payload;

    // When using path-based doc id, use it directly
    let guid = match doc.as_ref() {
        Some(path_guid) => path_guid.clone(),
        None => {
            tracing::warn!("Update received without document guid in path");
            return Ok(());
        }
    };

    tracing::info!(
        "Incoming update for document: {} ({} bytes) from user {}",
        guid,
        update_bytes.len(),
        user_id
    );

    // Load document from database
    let (doc_obj, _metadata) = load_or_create_document(state, &guid, vault_id).await?;

    // Apply update to document
    let update = Update::decode_v1(update_bytes)?;
    {
        let mut txn = doc_obj.transact_mut();
        txn.apply_update(update)?;
    }

    // Save updated document to database
    save_document(state, &guid, &doc_obj, vault_id, user_id).await?;

    // Broadcast update to other clients
    // Format: varUint(0) • varUint(2) • varByteArray(update)
    let mut broadcast_msg = Vec::new();
    encode_var_uint(&mut broadcast_msg, 0)?; // Sync protocol marker
    encode_var_uint(&mut broadcast_msg, 2)?; // Message type 2 = Update
    encode_var_uint(&mut broadcast_msg, update_bytes.len() as u32)?; // Payload length
    broadcast_msg.extend_from_slice(update_bytes);

    if let Err(e) = state
        .sync_manager
        .broadcast_update(&guid, broadcast_msg)
        .await
    {
        tracing::error!("Failed to broadcast update: {}", e);
    }

    Ok(())
}

async fn handle_awareness(
    _sender: &mut futures_util::stream::SplitSink<WebSocket, Message>,
    _state: &AppState,
    payload: &[u8],
) -> anyhow::Result<()> {
    // TODO: Broadcast awareness to other connected clients
    tracing::debug!("Awareness update ({} bytes)", payload.len());
    Ok(())
}

// Load document from database, or create new one if doesn't exist
// Verifies document belongs to the specified vault
async fn load_or_create_document(
    state: &AppState,
    guid: &str,
    vault_id: Uuid,
) -> anyhow::Result<(Doc, DocumentMetadata)> {
    // Try to load from database, verifying it belongs to this vault
    let result = sqlx::query!(
        r#"
        SELECT
            s.yjs_state,
            s.created_at,
            s.modified_at,
            s.parent_guid,
            s.doc_type,
            m.title,
            m.icon,
            m.description,
            COALESCE(m.tags, '{}') as tags
        FROM subdocs s
        LEFT JOIN subdoc_metadata m ON s.guid = m.subdoc_guid
        WHERE s.guid = $1 AND s.vault_id = $2 AND s.deleted_at IS NULL
        "#,
        guid,
        vault_id
    )
    .fetch_optional(&state.pool)
    .await?;

    if let Some(record) = result {
        // Document exists and belongs to this vault, load it
        let doc = Doc::new();
        let update = Update::decode_v1(&record.yjs_state)?;
        {
            let mut txn = doc.transact_mut();
            txn.apply_update(update)?;
        }

        let tags = record.tags.unwrap_or_default();

        let metadata = DocumentMetadata {
            guid: guid.to_string(),
            vault_id,
            title: record.title,
            doc_type: record.doc_type,
            icon: record.icon,
            description: record.description,
            tags,
            parent_guid: record.parent_guid,
            created_at: record.created_at,
            modified_at: record.modified_at,
        };

        tracing::debug!("Loaded document {} from vault {}", guid, vault_id);
        Ok((doc, metadata))
    } else {
        // Document doesn't exist, create new one with default metadata
        let doc = Doc::new();
        let now = Utc::now();

        let metadata = DocumentMetadata {
            guid: guid.to_string(),
            vault_id,
            title: "Untitled".to_string(),
            doc_type: "document".to_string(),
            icon: None,
            description: None,
            tags: vec![],
            parent_guid: None,
            created_at: now,
            modified_at: now,
        };

        tracing::debug!("Created new document {} for vault {}", guid, vault_id);
        Ok((doc, metadata))
    }
}

// Save document to database
async fn save_document(
    state: &AppState,
    guid: &str,
    doc: &Doc,
    vault_id: Uuid,
    user_id: Uuid,
) -> anyhow::Result<()> {
    tracing::debug!(
        "save_document called for guid: {}, vault_id: {}, user_id: {}",
        guid,
        vault_id,
        user_id
    );

    let (state_bytes, state_vector_bytes) = {
        let txn = doc.transact();
        let state_bytes = txn.encode_state_as_update_v1(&StateVector::default());
        let state_vector_bytes = txn.state_vector().encode_v1();
        tracing::debug!(
            "Encoded state: {} bytes, state_vector: {} bytes",
            state_bytes.len(),
            state_vector_bytes.len()
        );
        (state_bytes, state_vector_bytes)
    };

    // Insert or update document
    tracing::debug!(
        "Executing INSERT OR UPDATE query for guid: {} with vault_id: {}",
        guid,
        vault_id
    );
    let result = sqlx::query!(
        r#"
        INSERT INTO subdocs (guid, vault_id, doc_type, yjs_state, state_vector, modified_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (guid) DO UPDATE
        SET yjs_state = $4, state_vector = $5, modified_at = NOW()
        "#,
        guid,
        vault_id,
        "document",
        state_bytes,
        state_vector_bytes,
    )
    .execute(&state.pool)
    .await?;

    // Ensure metadata record exists (insert default metadata if it doesn't)
    sqlx::query!(
        r#"
        INSERT INTO subdoc_metadata (subdoc_guid, title, modified_at)
        VALUES ($1, 'Untitled', NOW())
        ON CONFLICT (subdoc_guid) DO UPDATE
        SET modified_at = NOW()
        "#,
        guid
    )
    .execute(&state.pool)
    .await?;

    tracing::info!(
        "Saved document {} to vault {} by user {} (rows affected: {})",
        guid,
        vault_id,
        user_id,
        result.rows_affected()
    );
    Ok(())
}
