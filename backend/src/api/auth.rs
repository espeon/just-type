use crate::{
    auth,
    config::Config,
    models::{AuthResponse, LoginRequest, RegisterRequest, User},
};
use axum::{Json, Router, extract::State, http::StatusCode, routing::post};
use serde::Deserialize;
use sqlx::PgPool;

pub fn auth_routes() -> Router<AppState> {
    Router::new()
        .route("/register", post(register))
        .route("/login", post(login))
        .route("/refresh", post(refresh))
}

#[derive(Debug, Deserialize)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub config: Config,
    pub sync_manager: std::sync::Arc<crate::sync::SyncManager>,
}

async fn register(
    State(state): State<AppState>,
    Json(req): Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, (StatusCode, String)> {
    let result = auth::register(&state.pool, req, &state.config.jwt_secret)
        .await
        .map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;

    Ok(Json(result))
}

async fn login(
    State(state): State<AppState>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, (StatusCode, String)> {
    let result = auth::login(&state.pool, req, &state.config.jwt_secret)
        .await
        .map_err(|e| (StatusCode::UNAUTHORIZED, e.to_string()))?;

    Ok(Json(result))
}

async fn refresh(
    State(state): State<AppState>,
    Json(req): Json<RefreshRequest>,
) -> Result<Json<AuthResponse>, (StatusCode, String)> {
    // Validate refresh token
    let claims = auth::validate_refresh_token(&req.refresh_token, &state.config.jwt_secret)
        .map_err(|e| (StatusCode::UNAUTHORIZED, e.to_string()))?;

    // Get user from database
    let user = sqlx::query_as::<_, User>(
        "SELECT id, email, password_hash, created_at, username, display_name, avatar_url FROM users WHERE id = $1"
    )
    .bind(claims.sub)
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "User not found".to_string()))?;

    // Generate new tokens
    let token = auth::generate_token(&user.id, &state.config.jwt_secret)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    let refresh_token = auth::generate_refresh_token(&user.id, &state.config.jwt_secret)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(AuthResponse {
        token,
        refresh_token,
        user,
    }))
}
