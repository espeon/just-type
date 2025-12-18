use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{RwLock, broadcast};
use yrs::updates::decoder::Decode;
use yrs::updates::encoder::Encode;
use yrs::{Doc, ReadTxn, StateVector, Transact, Update};

/// Manages active document sync sessions
pub struct SyncManager {
    /// Map of document GUID -> document broadcast channel
    documents: Arc<RwLock<HashMap<String, broadcast::Sender<Vec<u8>>>>>,
}

impl SyncManager {
    pub fn new() -> Self {
        Self {
            documents: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Get or create a broadcast channel for a document
    pub async fn get_document_channel(&self, guid: &str) -> broadcast::Sender<Vec<u8>> {
        let mut docs = self.documents.write().await;

        docs.entry(guid.to_string())
            .or_insert_with(|| {
                let (tx, _rx) = broadcast::channel(100);
                tracing::info!("Created broadcast channel for document: {}", guid);
                tx
            })
            .clone()
    }

    /// Broadcast an update to all clients subscribed to a document
    pub async fn broadcast_update(&self, guid: &str, update: Vec<u8>) -> Result<(), String> {
        let docs = self.documents.read().await;

        if let Some(tx) = docs.get(guid) {
            tx.send(update)
                .map_err(|e| format!("Failed to broadcast update: {}", e))?;
        }

        Ok(())
    }

    /// Subscribe to document updates
    pub async fn subscribe(&self, guid: &str) -> broadcast::Receiver<Vec<u8>> {
        self.get_document_channel(guid).await.subscribe()
    }
}

impl Default for SyncManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Encode state vector for Yjs sync protocol
pub fn encode_state_vector(doc: &Doc) -> Vec<u8> {
    let txn = doc.transact();
    let sv = txn.state_vector();
    sv.encode_v1()
}

/// Encode state as update for Yjs sync protocol
pub fn encode_state_as_update(doc: &Doc, sv: &StateVector) -> Vec<u8> {
    let txn = doc.transact();
    txn.encode_diff_v1(sv)
}

/// Apply update to document
pub fn apply_update(doc: &Doc, update: &[u8]) -> Result<(), yrs::error::Error> {
    let mut txn = doc.transact_mut();
    let update = Update::decode_v1(update)?;
    txn.apply_update(update)?;
    Ok(())
}
