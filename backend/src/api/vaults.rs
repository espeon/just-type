use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, post},
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    api::auth::AppState,
    auth::jwt::Claims,
    models::{DocumentMetadata, Vault},
};

#[derive(Debug, Deserialize)]
pub struct CreateVaultRequest {
    pub name: String,
}

#[derive(Debug, Serialize)]
pub struct VaultResponse {
    pub id: Uuid,
    pub name: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

impl From<Vault> for VaultResponse {
    fn from(vault: Vault) -> Self {
        Self {
            id: vault.id,
            name: vault.name,
            created_at: vault.created_at,
        }
    }
}

pub fn vault_routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_vaults).post(create_vault))
        .route("/{vault_id}", get(get_vault).delete(delete_vault))
        .route(
            "/{vault_id}/documents/metadata",
            get(get_vault_documents_metadata),
        )
}

async fn list_vaults(
    State(state): State<AppState>,
    claims: Claims,
) -> Result<Json<Vec<VaultResponse>>, StatusCode> {
    let vaults = sqlx::query_as::<_, Vault>(
        "SELECT id, user_id, name, created_at FROM vaults WHERE user_id = $1 ORDER BY created_at DESC",
    )
    .bind(claims.sub)
    .fetch_all(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(vaults.into_iter().map(VaultResponse::from).collect()))
}

async fn create_vault(
    State(state): State<AppState>,
    claims: Claims,
    Json(req): Json<CreateVaultRequest>,
) -> Result<Json<VaultResponse>, StatusCode> {
    let vault = sqlx::query_as::<_, Vault>(
        "INSERT INTO vaults (id, user_id, name) VALUES ($1, $2, $3) RETURNING id, user_id, name, created_at",
    )
    .bind(Uuid::new_v4())
    .bind(claims.sub)
    .bind(req.name)
    .fetch_one(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(VaultResponse::from(vault)))
}

async fn get_vault(
    State(state): State<AppState>,
    claims: Claims,
    Path(vault_id): Path<Uuid>,
) -> Result<Json<VaultResponse>, StatusCode> {
    let vault = sqlx::query_as::<_, Vault>(
        "SELECT id, user_id, name, created_at FROM vaults WHERE id = $1 AND user_id = $2",
    )
    .bind(vault_id)
    .bind(claims.sub)
    .fetch_optional(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(VaultResponse::from(vault)))
}

async fn delete_vault(
    State(state): State<AppState>,
    claims: Claims,
    Path(vault_id): Path<Uuid>,
) -> Result<StatusCode, StatusCode> {
    let result = sqlx::query("DELETE FROM vaults WHERE id = $1 AND user_id = $2")
        .bind(vault_id)
        .bind(claims.sub)
        .execute(&state.pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if result.rows_affected() == 0 {
        return Err(StatusCode::NOT_FOUND);
    }

    Ok(StatusCode::NO_CONTENT)
}

async fn get_vault_documents_metadata(
    State(state): State<AppState>,
    claims: Claims,
    Path(vault_id): Path<Uuid>,
) -> Result<Json<Vec<DocumentMetadata>>, StatusCode> {
    let vault = sqlx::query_as::<_, Vault>(
        "SELECT id, user_id, name, created_at FROM vaults WHERE id = $1 AND user_id = $2",
    )
    .bind(vault_id)
    .bind(claims.sub)
    .fetch_optional(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    let documents = sqlx::query!(
        "SELECT s.guid, s.vault_id, s.doc_type, s.parent_guid, s.created_at, s.modified_at,
                m.title, m.icon, m.description, m.tags
         FROM subdocs s
         LEFT JOIN subdoc_metadata m ON s.guid = m.subdoc_guid
         WHERE s.vault_id = $1
         ORDER BY s.created_at ASC",
        vault_id
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let metadata: Vec<DocumentMetadata> = documents
        .iter()
        .map(|doc| DocumentMetadata {
            guid: doc.guid.clone(),
            vault_id: doc.vault_id,
            title: doc.title.clone(),
            doc_type: doc.doc_type.clone(),
            icon: doc.icon.clone(),
            description: doc.description.clone(),
            tags: doc.tags.clone().unwrap_or_default(),
            parent_guid: doc.parent_guid.clone(),
            created_at: doc.created_at,
            modified_at: doc.modified_at,
        })
        .collect();

    Ok(Json(metadata))
}
