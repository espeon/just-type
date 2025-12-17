use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentMetadata {
    pub title: String,
    pub created: i64,
    pub modified: i64,
    pub tags: Vec<String>,
    pub backlinks: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub icon: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "parentId")]
    pub parent_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "type")]
    pub doc_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Document {
    pub version: u32,
    pub id: String,
    pub metadata: DocumentMetadata,
    pub state: String, // base64-encoded yjs binary
}

impl Document {
    pub fn new(id: String, title: String) -> Self {
        let now = chrono::Utc::now().timestamp_millis();
        Self {
            version: 1,
            id: id.clone(),
            metadata: DocumentMetadata {
                title,
                created: now,
                modified: now,
                tags: Vec::new(),
                backlinks: Vec::new(),
                icon: None,
                description: None,
                parent_id: None,
                doc_type: None,
            },
            state: String::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultConfig {
    pub path: String,
    pub created: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentStructure {
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "parentId")]
    pub parent_id: Option<String>,
    pub order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultStructure {
    pub documents: Vec<DocumentStructure>,
    pub version: u32,
}
