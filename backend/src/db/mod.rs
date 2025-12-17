use anyhow::Result;
use sqlx::{PgPool, postgres::PgPoolOptions};

pub async fn init(database_url: &str) -> Result<PgPool> {
    tracing::info!("Connecting to database");
    
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(database_url)
        .await?;
    
    tracing::info!("Running migrations");
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await?;
    
    Ok(pool)
}
