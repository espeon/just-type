use axum::{
    Json, Router,
    extract::{Multipart, Path, State},
    http::{StatusCode, header},
    response::IntoResponse,
    routing::{get, post},
};
use serde::Serialize;
use uuid::Uuid;

use crate::{api::auth::AppState, auth::jwt::Claims};

const MAX_FILE_SIZE: usize = 10 * 1024 * 1024; // 10MB

#[derive(Debug, sqlx::FromRow)]
pub struct Upload {
    pub id: Uuid,
    pub user_id: Uuid,
    pub filename: String,
    pub original_filename: String,
    pub mime_type: String,
    pub size_bytes: i64,
    pub storage_key: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub deleted_at: Option<chrono::DateTime<chrono::Utc>>,
    pub deleted_by: Option<Uuid>,
}

#[derive(Debug, Serialize)]
pub struct UploadResponse {
    pub id: Uuid,
    pub filename: String,
    pub url: String,
    pub mime_type: String,
    pub size_bytes: i64,
}

pub fn upload_routes() -> Router<AppState> {
    Router::new()
        .route("/", post(upload_file))
        .route("/{storage_key}", get(serve_file))
}

async fn upload_file(
    State(state): State<AppState>,
    claims: Claims,
    mut multipart: Multipart,
) -> Result<Json<UploadResponse>, StatusCode> {
    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|_| StatusCode::BAD_REQUEST)?
    {
        let name = field.name().unwrap_or("").to_string();
        if name != "file" {
            continue;
        }

        let filename = field.file_name().unwrap_or("upload").to_string();

        let content_type = field
            .content_type()
            .unwrap_or("application/octet-stream")
            .to_string();

        let data = field.bytes().await.map_err(|_| StatusCode::BAD_REQUEST)?;

        if data.len() > MAX_FILE_SIZE {
            return Err(StatusCode::PAYLOAD_TOO_LARGE);
        }

        // Store file using BlobStorage trait
        let uploaded = state
            .storage
            .store(&data, &filename)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        // Save metadata to database
        let upload = sqlx::query_as::<_, Upload>(
            "INSERT INTO uploads (id, user_id, filename, original_filename, mime_type, size_bytes, storage_key)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, user_id, filename, original_filename, mime_type, size_bytes, storage_key, created_at, deleted_at, deleted_by"
        )
        .bind(uploaded.id)
        .bind(claims.sub)
        .bind(&uploaded.storage_key)
        .bind(&filename)
        .bind(&content_type)
        .bind(uploaded.size_bytes as i64)
        .bind(&uploaded.storage_key)
        .fetch_one(&state.pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        let url = state.storage.get_url(&uploaded.storage_key);

        return Ok(Json(UploadResponse {
            id: upload.id,
            filename: upload.original_filename,
            url,
            mime_type: upload.mime_type,
            size_bytes: upload.size_bytes,
        }));
    }

    Err(StatusCode::BAD_REQUEST)
}

async fn serve_file(
    State(state): State<AppState>,
    Path(storage_key): Path<String>,
) -> Result<impl IntoResponse, StatusCode> {
    // Get metadata from database
    let upload = sqlx::query_as::<_, Upload>(
        "SELECT id, user_id, filename, original_filename, mime_type, size_bytes, storage_key, created_at, deleted_at, deleted_by
         FROM uploads
         WHERE storage_key = $1 AND deleted_at IS NULL"
    )
    .bind(&storage_key)
    .fetch_optional(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    // Retrieve file from storage
    let data = state
        .storage
        .retrieve(&storage_key)
        .await
        .map_err(|_| StatusCode::NOT_FOUND)?;

    Ok(([(header::CONTENT_TYPE, upload.mime_type)], data))
}
