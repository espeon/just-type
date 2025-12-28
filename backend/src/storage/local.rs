use async_trait::async_trait;
use std::path::PathBuf;
use tokio::fs;
use tokio::io::AsyncWriteExt;
use uuid::Uuid;

use super::{BlobStorage, StorageError, UploadedFile};

pub struct LocalStorage {
    base_path: PathBuf,
    max_size: usize,
}

impl LocalStorage {
    pub fn new(base_path: impl Into<PathBuf>, max_size: usize) -> Self {
        Self {
            base_path: base_path.into(),
            max_size,
        }
    }

    pub async fn ensure_directory_exists(&self) -> Result<(), StorageError> {
        fs::create_dir_all(&self.base_path)
            .await
            .map_err(|e| StorageError::IoError(e.to_string()))
    }
}

#[async_trait]
impl BlobStorage for LocalStorage {
    async fn store(&self, data: &[u8], filename: &str) -> Result<UploadedFile, StorageError> {
        if data.len() > self.max_size {
            return Err(StorageError::TooBig);
        }

        self.ensure_directory_exists().await?;

        let upload_id = Uuid::new_v4();
        let path = PathBuf::from(filename);
        let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("bin");
        let storage_key = format!("{}.{}", upload_id, ext);
        let file_path = self.base_path.join(&storage_key);

        let mut file = fs::File::create(&file_path)
            .await
            .map_err(|e| StorageError::IoError(e.to_string()))?;

        file.write_all(data)
            .await
            .map_err(|e| StorageError::IoError(e.to_string()))?;

        Ok(UploadedFile {
            id: upload_id,
            storage_key,
            size_bytes: data.len(),
        })
    }

    async fn retrieve(&self, storage_key: &str) -> Result<Vec<u8>, StorageError> {
        let file_path = self.base_path.join(storage_key);
        fs::read(&file_path).await.map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                StorageError::NotFound
            } else {
                StorageError::IoError(e.to_string())
            }
        })
    }

    async fn delete(&self, storage_key: &str) -> Result<(), StorageError> {
        let file_path = self.base_path.join(storage_key);
        fs::remove_file(&file_path).await.map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                StorageError::NotFound
            } else {
                StorageError::IoError(e.to_string())
            }
        })
    }

    fn get_url(&self, storage_key: &str) -> String {
        format!("/api/uploads/{}", storage_key)
    }
}
