use crate::{
    auth,
    config::Config,
    models::{AuthResponse, LoginRequest, RegisterRequest},
};
use axum::{Json, Router, extract::State, http::StatusCode, routing::post};
use sqlx::PgPool;

pub fn auth_routes() -> Router<AppState> {
    Router::new()
        .route("/register", post(register))
        .route("/login", post(login))
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
