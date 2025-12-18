use anyhow::{Context, Result};
use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct Config {
    pub database_url: String,
    pub port: u16,
    pub jwt_secret: String,
}

impl Config {
    pub fn load() -> Result<Self> {
        dotenvy::dotenv().ok();

        let database_url = std::env::var("DATABASE_URL").context("DATABASE_URL must be set")?;

        let port = std::env::var("PORT")
            .unwrap_or_else(|_| "4000".to_string())
            .parse()
            .context("PORT must be a valid number")?;

        let jwt_secret = std::env::var("JWT_SECRET").context("JWT_SECRET must be set")?;

        Ok(Self {
            database_url,
            port,
            jwt_secret,
        })
    }
}
