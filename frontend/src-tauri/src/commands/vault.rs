use crate::models::document::VaultStructure;
use crate::models::{Document, DocumentMetadata, VaultConfig};
use std::fs;
use std::path::Path;

#[tauri::command]
pub async fn choose_vault_location() -> Result<String, String> {
    // Dialog will be handled in frontend with @tauri-apps/plugin-dialog
    Err("Use frontend dialog".to_string())
}

#[tauri::command]
pub async fn initialize_vault(path: String) -> Result<(), String> {
    let vault_path = Path::new(&path);

    // Create vault directory if it doesn't exist
    if !vault_path.exists() {
        fs::create_dir_all(vault_path).map_err(|e| e.to_string())?;
    }

    // Create .vault.json config
    let vault_config = VaultConfig {
        path: path.clone(),
        created: chrono::Utc::now().timestamp_millis(),
    };

    let config_path = vault_path.join(".vault.json");
    let config_json = serde_json::to_string_pretty(&vault_config).map_err(|e| e.to_string())?;
    fs::write(config_path, config_json).map_err(|e| e.to_string())?;

    // Create .index.json for search
    let index_path = vault_path.join(".index.json");
    fs::write(index_path, "{}").map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn list_documents(vault_path: String) -> Result<Vec<String>, String> {
    let path = Path::new(&vault_path);

    if !path.exists() {
        return Err("Vault path does not exist".to_string());
    }

    let mut documents = Vec::new();

    for entry in fs::read_dir(path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.extension().and_then(|s| s.to_str()) == Some("jt") {
            if let Some(file_name) = path.file_stem() {
                documents.push(file_name.to_string_lossy().to_string());
            }
        }
    }

    Ok(documents)
}

#[tauri::command]
pub async fn read_all_documents(vault_path: String) -> Result<Vec<Document>, String> {
    let path = Path::new(&vault_path);
    if !path.exists() {
        return Err("Vault path does not exist".to_string());
    }

    let mut documents = Vec::new();
    for entry in fs::read_dir(path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("jt") {
            let contents = fs::read_to_string(&path).map_err(|e| e.to_string())?;
            let document: Document = serde_json::from_str(&contents).map_err(|e| e.to_string())?;
            documents.push(document);
        }
    }
    Ok(documents)
}

#[tauri::command]
pub async fn read_document(vault_path: String, id: String) -> Result<Document, String> {
    let doc_path = Path::new(&vault_path).join(format!("{}.jt", id));

    if !doc_path.exists() {
        return Err(format!("Document {} not found", id));
    }

    let contents = fs::read_to_string(doc_path).map_err(|e| e.to_string())?;
    let document: Document = serde_json::from_str(&contents).map_err(|e| e.to_string())?;

    Ok(document)
}

#[tauri::command]
pub async fn write_document(
    vault_path: String,
    id: String,
    metadata: DocumentMetadata,
    state: String,
) -> Result<(), String> {
    let doc_path = Path::new(&vault_path).join(format!("{}.jt", id));

    let document = Document {
        version: 1,
        id: id.clone(),
        metadata,
        state,
    };

    let json = serde_json::to_string_pretty(&document).map_err(|e| e.to_string())?;
    fs::write(doc_path, json).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn delete_document(vault_path: String, id: String) -> Result<(), String> {
    let doc_path = Path::new(&vault_path).join(format!("{}.jt", id));

    if doc_path.exists() {
        fs::remove_file(doc_path).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub async fn create_document(vault_path: String, title: String) -> Result<Document, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let document = Document::new(id.clone(), title);

    let doc_path = Path::new(&vault_path).join(format!("{}.jt", id));
    let json = serde_json::to_string_pretty(&document).map_err(|e| e.to_string())?;
    fs::write(doc_path, json).map_err(|e| e.to_string())?;

    Ok(document)
}

#[tauri::command]
pub async fn read_vault_structure(vault_path: String) -> Result<VaultStructure, String> {
    let structure_path = Path::new(&vault_path).join(".structure.json");

    // if structure file doesn't exist, return empty structure
    if !structure_path.exists() {
        return Ok(VaultStructure {
            documents: Vec::new(),
            version: 1,
        });
    }

    let contents = fs::read_to_string(structure_path).map_err(|e| e.to_string())?;
    let structure: VaultStructure = serde_json::from_str(&contents).map_err(|e| e.to_string())?;

    Ok(structure)
}

#[tauri::command]
pub async fn write_vault_structure(
    vault_path: String,
    structure: VaultStructure,
) -> Result<(), String> {
    let structure_path = Path::new(&vault_path).join(".structure.json");

    let json = serde_json::to_string_pretty(&structure).map_err(|e| e.to_string())?;
    fs::write(structure_path, json).map_err(|e| e.to_string())?;

    Ok(())
}
