use axum::{
    Json, Router,
    extract::{Path, Query, State},
    http::StatusCode,
    routing::get,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::AppState;
use crate::auth::jwt::Claims;
use crate::models::{PublicUserProfile, UpdateProfileRequest, User};

pub fn user_routes() -> Router<AppState> {
    Router::new()
        .route("/me", get(get_current_user).put(update_profile))
        .route("/search", get(search_users))
        .route("/{user_id}", get(get_user_profile))
}

#[derive(Debug, Deserialize)]
pub struct SearchParams {
    q: String,
}

pub async fn get_current_user(
    claims: Claims,
    State(state): State<AppState>,
) -> Result<Json<User>, StatusCode> {
    let user = sqlx::query_as::<_, User>(
        "SELECT id, email, password_hash, created_at, username, display_name, avatar_url
         FROM users WHERE id = $1",
    )
    .bind(claims.sub)
    .fetch_optional(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(user))
}

pub async fn update_profile(
    claims: Claims,
    State(state): State<AppState>,
    Json(req): Json<UpdateProfileRequest>,
) -> Result<Json<User>, StatusCode> {
    if let Some(ref username) = req.username {
        validate_username(username)?;
    }

    let user = sqlx::query_as::<_, User>(
        "UPDATE users SET username = COALESCE($1, username),
                         display_name = COALESCE($2, display_name),
                         avatar_url = COALESCE($3, avatar_url)
         WHERE id = $4
         RETURNING id, email, password_hash, created_at, username, display_name, avatar_url",
    )
    .bind(&req.username)
    .bind(&req.display_name)
    .bind(&req.avatar_url)
    .bind(claims.sub)
    .fetch_optional(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(user))
}

pub async fn search_users(
    Query(params): Query<SearchParams>,
    State(state): State<AppState>,
) -> Result<Json<Vec<PublicUserProfile>>, StatusCode> {
    let query = format!("%{}%", params.q.to_lowercase());

    let users = sqlx::query_as::<_, PublicUserProfile>(
        "SELECT id, username, display_name, avatar_url
         FROM users
         WHERE LOWER(username) LIKE $1 OR LOWER(display_name) LIKE $1
         LIMIT 20",
    )
    .bind(query)
    .fetch_all(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(users))
}

pub async fn get_user_profile(
    Path(user_id): Path<Uuid>,
    State(state): State<AppState>,
) -> Result<Json<PublicUserProfile>, StatusCode> {
    let user = sqlx::query_as::<_, PublicUserProfile>(
        "SELECT id, username, display_name, avatar_url FROM users WHERE id = $1",
    )
    .bind(user_id)
    .fetch_optional(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(user))
}

fn validate_username(username: &str) -> Result<(), StatusCode> {
    if username.len() < 3 || username.len() > 30 {
        return Err(StatusCode::BAD_REQUEST);
    }

    if !username
        .chars()
        .all(|c| c.is_alphanumeric() || c == '-' || c == '_')
    {
        return Err(StatusCode::BAD_REQUEST);
    }

    let reserved = [
        "admin", "system", "api", "root", "guest", "user", "test", "app", "server",
    ];

    if reserved.contains(&username.to_lowercase().as_str()) {
        return Err(StatusCode::BAD_REQUEST);
    }

    Ok(())
}
