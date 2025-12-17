mod api;
mod auth;
mod config;
mod db;
mod models;
mod sync;

use anyhow::Result;
use api::auth::AppState;
use axum::{Router, routing::get};
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::fmt::layer()
                .with_target(false)
                .compact(),
        )
        .init();

    tracing::info!("Starting just-type-server");

    // Load configuration
    let config = config::Config::load()?;

    // Initialize database
    let pool = db::init(&config.database_url).await?;

    // Build app state
    let state = AppState {
        pool,
        config: config.clone(),
    };

    // Build application router
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/ws", get(api::ws_handler))
        .nest("/api/auth", api::auth_routes())
        .nest("/api/vaults", api::vault_routes())
        .layer(CorsLayer::new().allow_origin(Any))
        .with_state(state);

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!("Listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_check() -> &'static str {
    "OK"
}
