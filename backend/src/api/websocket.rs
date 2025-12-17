use crate::auth::AppState;
use axum::{
    extract::{
        State,
        ws::{Message, WebSocket, WebSocketUpgrade},
    },
    response::Response,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
enum SyncMessage {
    #[serde(rename = "sync-step-1")]
    SyncStep1 {
        #[serde(rename = "documentId")]
        document_id: String,
        #[serde(rename = "stateVector")]
        state_vector: Vec<u8>,
    },
    #[serde(rename = "sync-step-2")]
    SyncStep2 {
        #[serde(rename = "documentId")]
        document_id: String,
        update: Vec<u8>,
    },
    #[serde(rename = "update")]
    Update {
        #[serde(rename = "documentId")]
        document_id: String,
        update: Vec<u8>,
    },
    #[serde(rename = "awareness")]
    Awareness { update: Vec<u8> },
}

pub async fn ws_handler(ws: WebSocketUpgrade, State(state): State<AppState>) -> Response {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(mut socket: WebSocket, state: AppState) {
    tracing::info!("WebSocket connection established");

    // TODO: Authenticate user from initial message or query param

    while let Some(msg) = socket.recv().await {
        match msg {
            Ok(Message::Text(text)) => {
                if let Err(e) = handle_text_message(&mut socket, &state, &text).await {
                    tracing::error!("Error handling message: {}", e);
                }
            }
            Ok(Message::Binary(data)) => {
                if let Err(e) = handle_binary_message(&mut socket, &state, &data).await {
                    tracing::error!("Error handling binary message: {}", e);
                }
            }
            Ok(Message::Close(_)) => {
                tracing::info!("Client closed connection");
                break;
            }
            Err(e) => {
                tracing::error!("WebSocket error: {}", e);
                break;
            }
            _ => {}
        }
    }

    tracing::info!("WebSocket connection closed");
}

async fn handle_text_message(
    socket: &mut WebSocket,
    state: &AppState,
    text: &str,
) -> anyhow::Result<()> {
    let msg: SyncMessage = serde_json::from_str(text)?;

    match msg {
        SyncMessage::SyncStep1 {
            document_id,
            state_vector,
        } => {
            tracing::debug!("Sync step 1 for document: {}", document_id);
            // TODO: Load document from DB, compute diff, send back
        }
        SyncMessage::SyncStep2 {
            document_id,
            update,
        } => {
            tracing::debug!("Sync step 2 for document: {}", document_id);
            // TODO: Apply update to document, save to DB, broadcast to others
        }
        SyncMessage::Update {
            document_id,
            update,
        } => {
            tracing::debug!("Update for document: {}", document_id);
            // TODO: Apply update, save to DB, broadcast to others
        }
        SyncMessage::Awareness { update } => {
            tracing::debug!("Awareness update");
            // TODO: Broadcast awareness update to other clients
        }
    }

    Ok(())
}

async fn handle_binary_message(
    socket: &mut WebSocket,
    state: &AppState,
    data: &[u8],
) -> anyhow::Result<()> {
    // Binary messages are typically Yjs updates
    // For now, we'll expect JSON in text messages
    tracing::debug!("Received binary message of {} bytes", data.len());
    Ok(())
}
