pub mod jwt;
mod password;

pub use jwt::{Claims, generate_token, validate_token};
pub use password::{hash_password, verify_password};

use crate::models::{AuthResponse, LoginRequest, RegisterRequest, User};
use anyhow::{Context, Result};
use sqlx::PgPool;

pub async fn register(
    pool: &PgPool,
    req: RegisterRequest,
    jwt_secret: &str,
) -> Result<AuthResponse> {
    // Hash password
    let password_hash = hash_password(&req.password).map_err(|e| anyhow::anyhow!(e))?;

    // Insert user
    let user = sqlx::query_as::<_, User>(
        "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *",
    )
    .bind(&req.email)
    .bind(&password_hash)
    .fetch_one(pool)
    .await
    .context("Failed to create user")?;

    // Generate JWT token
    let token = generate_token(&user.id, jwt_secret)?;

    Ok(AuthResponse { token, user })
}

pub async fn login(pool: &PgPool, req: LoginRequest, jwt_secret: &str) -> Result<AuthResponse> {
    // Find user
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = $1")
        .bind(&req.email)
        .fetch_optional(pool)
        .await?
        .context("Invalid credentials")?;

    // Verify password
    verify_password(&req.password, &user.password_hash)
        .map_err(|_| anyhow::anyhow!("Invalid credentials"))?;

    // Generate JWT token
    let token = generate_token(&user.id, jwt_secret)?;

    Ok(AuthResponse { token, user })
}
