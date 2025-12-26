pub mod jwt;
mod password;

pub use jwt::{generate_refresh_token, generate_token, validate_refresh_token, validate_token};
pub use password::{hash_password, verify_password};

use crate::models::{AuthResponse, LoginRequest, RegisterRequest, User};
use anyhow::{Context, Result};
use sqlx::PgPool;

pub async fn register(
    pool: &PgPool,
    req: RegisterRequest,
    jwt_secret: &str,
) -> Result<AuthResponse> {
    // Validate username if provided
    if let Some(ref username) = req.username {
        validate_username(username)?;
    }

    // Hash password
    let password_hash = hash_password(&req.password).map_err(|e| anyhow::anyhow!(e))?;

    // Insert user
    let user = sqlx::query_as::<_, User>(
        "INSERT INTO users (email, password_hash, username, display_name) VALUES ($1, $2, $3, $4) RETURNING id, email, password_hash, created_at, username, display_name, avatar_url",
    )
    .bind(&req.email)
    .bind(&password_hash)
    .bind(&req.username)
    .bind(&req.display_name)
    .fetch_one(pool)
    .await
    .context("Failed to create user")?;

    // Generate JWT token and refresh token
    let token = generate_token(&user.id, jwt_secret)?;
    let refresh_token = generate_refresh_token(&user.id, jwt_secret)?;

    Ok(AuthResponse {
        token,
        refresh_token,
        user,
    })
}

fn validate_username(username: &str) -> Result<()> {
    if username.len() < 3 || username.len() > 30 {
        return Err(anyhow::anyhow!("Username must be 3-30 characters"));
    }

    if !username
        .chars()
        .all(|c| c.is_alphanumeric() || c == '-' || c == '_')
    {
        return Err(anyhow::anyhow!(
            "Username can only contain letters, numbers, hyphens, and underscores"
        ));
    }

    let reserved = [
        "admin", "system", "api", "root", "guest", "user", "test", "app", "server",
    ];

    if reserved.contains(&username.to_lowercase().as_str()) {
        return Err(anyhow::anyhow!("Username is reserved"));
    }

    Ok(())
}

pub async fn login(pool: &PgPool, req: LoginRequest, jwt_secret: &str) -> Result<AuthResponse> {
    // Find user
    let user = sqlx::query_as::<_, User>("SELECT id, email, password_hash, created_at, username, display_name, avatar_url FROM users WHERE email = $1")
        .bind(&req.email)
        .fetch_optional(pool)
        .await?
        .context("Invalid credentials")?;

    // Verify password
    verify_password(&req.password, &user.password_hash)
        .map_err(|_| anyhow::anyhow!("Invalid credentials"))?;

    // Generate JWT token and refresh token
    let token = generate_token(&user.id, jwt_secret)?;
    let refresh_token = generate_refresh_token(&user.id, jwt_secret)?;

    Ok(AuthResponse {
        token,
        refresh_token,
        user,
    })
}
