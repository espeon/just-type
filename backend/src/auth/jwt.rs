use anyhow::{Context, Result};
use axum::{
    extract::FromRequestParts,
    http::{StatusCode, request::Parts},
};
use chrono::{Duration, Utc};
use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation, decode, encode};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::api::auth::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: Uuid,  // user id
    pub exp: usize, // expiration time
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefreshClaims {
    pub sub: Uuid,
    pub exp: usize,
    pub refresh: bool,
}

pub fn generate_token(user_id: &Uuid, secret: &str) -> Result<String> {
    let expiration = Utc::now()
        .checked_add_signed(Duration::days(30))
        .context("Failed to calculate expiration")?
        .timestamp() as usize;

    let claims = Claims {
        sub: *user_id,
        exp: expiration,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_ref()),
    )?;

    Ok(token)
}

pub fn generate_refresh_token(user_id: &Uuid, secret: &str) -> Result<String> {
    let expiration = Utc::now()
        .checked_add_signed(Duration::days(365))
        .context("Failed to calculate expiration")?
        .timestamp() as usize;

    let claims = RefreshClaims {
        sub: *user_id,
        exp: expiration,
        refresh: true,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_ref()),
    )?;

    Ok(token)
}

pub fn validate_refresh_token(token: &str, secret: &str) -> Result<RefreshClaims> {
    let token_data = decode::<RefreshClaims>(
        token,
        &DecodingKey::from_secret(secret.as_ref()),
        &Validation::default(),
    )?;

    if !token_data.claims.refresh {
        anyhow::bail!("Not a refresh token");
    }

    Ok(token_data.claims)
}

pub fn validate_token(token: &str, secret: &str) -> Result<Claims> {
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_ref()),
        &Validation::default(),
    )?;

    Ok(token_data.claims)
}

impl FromRequestParts<AppState> for Claims {
    type Rejection = StatusCode;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get("Authorization")
            .and_then(|h| h.to_str().ok())
            .ok_or(StatusCode::UNAUTHORIZED)?;

        let token = auth_header
            .strip_prefix("Bearer ")
            .ok_or(StatusCode::UNAUTHORIZED)?;

        validate_token(token, &state.config.jwt_secret).map_err(|_| StatusCode::UNAUTHORIZED)
    }
}
