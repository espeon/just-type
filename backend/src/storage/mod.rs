pub mod local;

use async_trait::async_trait;
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct UploadedFile {
    pub id: Uuid,
    pub storage_key: String,
    pub size_bytes: usize,
}

#[derive(Debug)]
pub enum StorageError {
    IoError(String),
    NotFound,
    TooBig,
}

impl std::fmt::Display for StorageError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            StorageError::IoError(msg) => write!(f, "IO error: {}", msg),
            StorageError::NotFound => write!(f, "File not found"),
            StorageError::TooBig => write!(f, "File too large"),
        }
    }
}

impl std::error::Error for StorageError {}

#[async_trait]
pub trait BlobStorage: Send + Sync {
    /// Store a file and return its storage key
    async fn store(&self, data: &[u8], filename: &str) -> Result<UploadedFile, StorageError>;

    /// Retrieve a file by its storage key
    async fn retrieve(&self, storage_key: &str) -> Result<Vec<u8>, StorageError>;

    /// Delete a file by its storage key
    async fn delete(&self, storage_key: &str) -> Result<(), StorageError>;

    /// Get the public URL for a file (if applicable)
    fn get_url(&self, storage_key: &str) -> String;
}
