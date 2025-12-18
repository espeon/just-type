use crate::api::auth::AppState;
use axum::{
    body::Bytes,
    extract::{
        Path, Query, State,
        ws::{Message, WebSocket, WebSocketUpgrade},
    },
    response::Response,
};
use futures_util::{SinkExt, StreamExt};
use std::collections::HashMap;
use tokio::sync::broadcast;
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
) -> Response {
    // Log the raw path doc and query params received at upgrade so we can confirm what the router provided
    tracing::info!("ws upgrade for doc path param: {:?}", doc);
    tracing::debug!("ws upgrade query params: {:?}", query);

    // Prefer path param when present, otherwise fallback to ?doc=<id> query parameter
    let path_doc = if !doc.is_empty() {
        Some(doc)
    } else {
        query.get("doc").cloned()
    };

    ws.on_upgrade(move |socket| handle_socket(socket, state, path_doc))
}

async fn handle_socket(socket: WebSocket, state: AppState, doc: Option<String>) {
    tracing::info!("WebSocket connection established, doc: {:?}", doc);

    let (mut sender, mut receiver) = socket.split();

    // Track which documents this client is subscribed to
    let mut subscriptions: HashMap<String, broadcast::Receiver<Vec<u8>>> = HashMap::new();

    loop {
        tokio::select! {
            // Handle incoming messages from client
            msg = receiver.next() => {
                match msg {
                    Some(Ok(Message::Binary(data))) => {
                        // Diagnostic logging for incoming binary frames
                        tracing::debug!("Received WebSocket Binary message ({} bytes)", data.len());
                        if !data.is_empty() {
                            tracing::debug!("Message type byte: {}", data[0]);
                            let payload_len = data.len().saturating_sub(1);
                            tracing::debug!("Payload length (after msg type): {}", payload_len);
                            let snippet_len = std::cmp::min(16, payload_len);
                            if snippet_len > 0 {
                                // Show a short debug trace of the payload bytes (use trace level to avoid clutter)
                                tracing::trace!("Payload snippet (first {} bytes): {:?}", snippet_len, &data[1..1 + snippet_len]);
                            }
                        } else {
                            tracing::warn!("Received Binary message with zero length");
                        }

                        if let Err(e) = handle_binary_message(&mut sender, &state, &data, &mut subscriptions, &doc).await {
                            tracing::error!("Error handling binary message: {:?}", e);
                            // Don't close the connection on error, just log and continue
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
                    _ => {
                        tracing::debug!("Received other WebSocket message variant");
                    }
                }
            }

            // Handle broadcast updates from other clients
            update = async {
                for (_guid, receiver) in subscriptions.iter_mut() {
                    match receiver.try_recv() {
                        Ok(update_data) => {
                            return Some(update_data);
                        }
                        Err(broadcast::error::TryRecvError::Empty) => continue,
                        Err(broadcast::error::TryRecvError::Lagged(_)) => {
                            tracing::warn!("Client lagged behind on updates");
                        }
                        Err(broadcast::error::TryRecvError::Closed) => {}
                    }
                }
                None::<Vec<u8>>
            } => {
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
    tracing::debug!(
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
                handle_sync_step1(sender, state, payload, subscriptions, doc).await?;
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
                handle_update(sender, state, payload, doc).await?;
            }
            _ => {
                tracing::warn!("Unknown sync message type: {}", msg_type);
            }
        }
    } else if protocol_type == 1 {
        // Awareness protocol message
        let (payload_len, payload_start) = read_var_from_slice(rest1)?;
        let payload_len = payload_len as usize;

        if payload_start.len() < payload_len {
            tracing::warn!(
                "Awareness payload length mismatch: declared={}, available={}",
                payload_len,
                payload_start.len()
            );
            return Ok(());
        }

        let payload = &payload_start[..payload_len];
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
        "Sync step 1 for document: {} (state_vector {} bytes)",
        guid,
        state_vector_bytes.len()
    );

    // Decode state vector
    let state_vector = StateVector::decode_v1(state_vector_bytes)?;

    // Load document from database
    let doc_obj = load_or_create_document(state, &guid).await?;

    // Compute diff (what client is missing)
    let update = {
        let txn = doc_obj.transact();
        txn.encode_diff_v1(&state_vector)
    };

    // Send Sync Step 2 back to client
    // Format: varUint(0) • varUint(1) • varByteArray(update)
    let mut response = Vec::new();
    encode_var_uint(&mut response, 0)?; // Sync protocol marker
    encode_var_uint(&mut response, 1)?; // Message type (Sync Step 2)
    encode_var_uint(&mut response, update.len() as u32)?; // Payload length
    response.extend_from_slice(&update);

    sender.send(Message::Binary(Bytes::from(response))).await?;

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
) -> anyhow::Result<()> {
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
        "Incoming update for document: {} ({} bytes)",
        guid,
        update_bytes.len()
    );

    // Load document from database
    let doc_obj = load_or_create_document(state, &guid).await?;

    // Apply update to document
    let update = Update::decode_v1(update_bytes)?;
    {
        let mut txn = doc_obj.transact_mut();
        txn.apply_update(update)?;
    }

    // Save updated document to database
    save_document(state, &guid, &doc_obj).await?;

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
async fn load_or_create_document(state: &AppState, guid: &str) -> anyhow::Result<Doc> {
    // Try to load from database
    let result = sqlx::query!("SELECT yjs_state FROM subdocs WHERE guid = $1", guid)
        .fetch_optional(&state.pool)
        .await?;

    if let Some(record) = result {
        // Document exists, load it
        let doc = Doc::new();
        let update = Update::decode_v1(&record.yjs_state)?;
        {
            let mut txn = doc.transact_mut();
            txn.apply_update(update)?;
        }

        tracing::debug!("Loaded document {} from database", guid);
        Ok(doc)
    } else {
        // Document doesn't exist, create new one
        let doc = Doc::new();
        tracing::debug!("Created new document {}", guid);
        Ok(doc)
    }
}

// Save document to database
async fn save_document(state: &AppState, guid: &str, doc: &Doc) -> anyhow::Result<()> {
    let (state_bytes, state_vector_bytes) = {
        let txn = doc.transact();
        let state_bytes = txn.encode_state_as_update_v1(&StateVector::default());
        let state_vector_bytes = txn.state_vector().encode_v1();
        (state_bytes, state_vector_bytes)
    };

    // Insert or update document
    sqlx::query!(
        r#"
        INSERT INTO subdocs (guid, vault_id, doc_type, yjs_state, state_vector, modified_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (guid) DO UPDATE
        SET yjs_state = $4, state_vector = $5, modified_at = NOW()
        "#,
        guid,
        uuid::Uuid::nil(), // TODO: Get actual vault_id from auth
        "document",
        state_bytes,
        state_vector_bytes,
    )
    .execute(&state.pool)
    .await?;

    tracing::debug!("Saved document {} to database", guid);
    Ok(())
}
