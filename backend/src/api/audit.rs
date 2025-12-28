use axum::{
    Json, Router,
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::get,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::api::auth::AppState;
use crate::api::vaults::get_user_vault_role;
use crate::auth::jwt::Claims;
use crate::models::{DocumentEdit, DocumentEditWithUser, DocumentSnapshot};

pub fn audit_routes() -> Router<AppState> {
    Router::new()
        .route("/documents/{doc_guid}/edits", get(get_document_edits))
        .route(
            "/documents/{doc_guid}/snapshots",
            get(get_document_snapshots),
        )
}

#[derive(Debug, Deserialize)]
pub struct EditQueryParams {
    #[serde(default = "default_limit")]
    limit: i64,
    #[serde(default)]
    offset: i64,
}

fn default_limit() -> i64 {
    50
}

/// Get edit history for a document
/// Requires user to have access to the vault containing the document
pub async fn get_document_edits(
    claims: Claims,
    State(state): State<AppState>,
    Path(doc_guid): Path<String>,
    Query(params): Query<EditQueryParams>,
) -> Result<impl IntoResponse, StatusCode> {
    let pool = &state.pool;

    // Get the vault_id for this document
    let vault_id = sqlx::query_scalar::<_, Uuid>(
        "SELECT vault_id FROM subdocs WHERE guid = $1 AND deleted_at IS NULL",
    )
    .bind(&doc_guid)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to fetch vault for document: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?
    .ok_or(StatusCode::NOT_FOUND)?;

    // Check user has access to this vault
    let role = get_user_vault_role(pool, vault_id, claims.sub)
        .await
        .map_err(|e| {
            tracing::error!("Failed to check vault access: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    if role == crate::api::vaults::VaultRole::None {
        return Err(StatusCode::FORBIDDEN);
    }

    // Fetch edit history with user profiles
    let edits = sqlx::query_as::<_, DocumentEditWithUser>(
        r#"
        SELECT
            e.id, e.subdoc_guid, e.user_id, e.session_id, e.yjs_update,
            e.edit_type, e.block_type, e.block_position, e.content_before, e.content_after,
            e.created_at,
            u.username, u.display_name, u.avatar_url
        FROM document_edits e
        INNER JOIN users u ON u.id = e.user_id
        WHERE e.subdoc_guid = $1
        ORDER BY e.created_at DESC
        LIMIT $2 OFFSET $3
        "#,
    )
    .bind(&doc_guid)
    .bind(params.limit)
    .bind(params.offset)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to fetch document edits: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(edits))
}

/// Get snapshots for a document
pub async fn get_document_snapshots(
    claims: Claims,
    State(state): State<AppState>,
    Path(doc_guid): Path<String>,
    Query(params): Query<EditQueryParams>,
) -> Result<impl IntoResponse, StatusCode> {
    let pool = &state.pool;

    // Get the vault_id for this document
    let vault_id = sqlx::query_scalar::<_, Uuid>(
        "SELECT vault_id FROM subdocs WHERE guid = $1 AND deleted_at IS NULL",
    )
    .bind(&doc_guid)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to fetch vault for document: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?
    .ok_or(StatusCode::NOT_FOUND)?;

    // Check user has access to this vault
    let role = get_user_vault_role(pool, vault_id, claims.sub)
        .await
        .map_err(|e| {
            tracing::error!("Failed to check vault access: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    if role == crate::api::vaults::VaultRole::None {
        return Err(StatusCode::FORBIDDEN);
    }

    // Fetch snapshots
    let snapshots = sqlx::query_as::<_, DocumentSnapshot>(
        r#"
        SELECT
            id, subdoc_guid, yjs_state, created_by, snapshot_type, description, created_at
        FROM document_snapshots
        WHERE subdoc_guid = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
        "#,
    )
    .bind(&doc_guid)
    .bind(params.limit)
    .bind(params.offset)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to fetch document snapshots: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(snapshots))
}
