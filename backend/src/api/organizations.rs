use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post, put},
};
use serde::Deserialize;
use uuid::Uuid;

use crate::api::auth::AppState;
use crate::auth::jwt::Claims;
use crate::models::{Organization, OrganizationMember, OrganizationMemberWithProfile};

pub fn organization_routes() -> Router<AppState> {
    Router::new()
        .route("/", post(create_organization).get(list_organizations))
        .route(
            "/{org_id}",
            get(get_organization)
                .put(update_organization)
                .delete(delete_organization),
        )
        .route("/{org_id}/members", get(list_members).post(add_member))
        .route(
            "/{org_id}/members/{member_id}",
            put(update_member_role).delete(remove_member),
        )
}

#[derive(Debug, Deserialize)]
pub struct CreateOrgRequest {
    pub name: String,
    pub slug: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateOrgRequest {
    pub name: Option<String>,
    pub slug: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AddMemberRequest {
    pub user_id: Uuid,
    pub role: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateMemberRoleRequest {
    pub role: String,
}

pub async fn create_organization(
    claims: Claims,
    State(state): State<AppState>,
    Json(req): Json<CreateOrgRequest>,
) -> Result<impl IntoResponse, StatusCode> {
    let pool = &state.pool;
    let org = sqlx::query_as::<_, Organization>(
        r#"
        INSERT INTO organizations (name, slug)
        VALUES ($1, $2)
        RETURNING id, name, slug, created_at, deleted_at, deleted_by
        "#,
    )
    .bind(&req.name)
    .bind(&req.slug)
    .fetch_one(pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to create organization: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    sqlx::query(
        r#"
        INSERT INTO organization_members (org_id, user_id, role, invited_by)
        VALUES ($1, $2, 'admin', $2)
        "#,
    )
    .bind(org.id)
    .bind(claims.sub)
    .execute(pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to add creator as admin: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok((StatusCode::CREATED, Json(org)))
}

pub async fn list_organizations(
    claims: Claims,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, StatusCode> {
    let pool = &state.pool;
    let orgs = sqlx::query_as::<_, Organization>(
        r#"
        SELECT o.id, o.name, o.slug, o.created_at, o.deleted_at, o.deleted_by
        FROM organizations o
        INNER JOIN organization_members om ON om.org_id = o.id
        WHERE om.user_id = $1 AND o.deleted_at IS NULL
        ORDER BY o.created_at DESC
        "#,
    )
    .bind(claims.sub)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to list organizations: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(orgs))
}

pub async fn get_organization(
    claims: Claims,
    State(state): State<AppState>,
    Path(org_id): Path<Uuid>,
) -> Result<impl IntoResponse, StatusCode> {
    let pool = &state.pool;
    let membership = sqlx::query_scalar::<_, String>(
        "SELECT role FROM organization_members WHERE org_id = $1 AND user_id = $2",
    )
    .bind(org_id)
    .bind(claims.sub)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to check org membership: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    if membership.is_none() {
        return Err(StatusCode::FORBIDDEN);
    }

    let org = sqlx::query_as::<_, Organization>(
        "SELECT id, name, slug, created_at, deleted_at, deleted_by FROM organizations WHERE id = $1 AND deleted_at IS NULL",
    )
    .bind(org_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to get organization: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?
    .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(org))
}

pub async fn update_organization(
    claims: Claims,
    State(state): State<AppState>,
    Path(org_id): Path<Uuid>,
    Json(req): Json<UpdateOrgRequest>,
) -> Result<impl IntoResponse, StatusCode> {
    let pool = &state.pool;
    let role = sqlx::query_scalar::<_, String>(
        "SELECT role FROM organization_members WHERE org_id = $1 AND user_id = $2",
    )
    .bind(org_id)
    .bind(claims.sub)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to check org membership: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?
    .ok_or(StatusCode::FORBIDDEN)?;

    if role != "admin" {
        return Err(StatusCode::FORBIDDEN);
    }

    let mut query = String::from("UPDATE organizations SET ");
    let mut updates = Vec::new();
    let mut param_count = 1;

    if req.name.is_some() {
        updates.push(format!("name = ${}", param_count));
        param_count += 1;
    }

    if req.slug.is_some() {
        updates.push(format!("slug = ${}", param_count));
        param_count += 1;
    }

    if updates.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    query.push_str(&updates.join(", "));
    query.push_str(&format!(" WHERE id = ${} AND deleted_at IS NULL RETURNING id, name, slug, created_at, deleted_at, deleted_by", param_count));

    let mut q = sqlx::query_as::<_, Organization>(&query);

    if let Some(name) = req.name {
        q = q.bind(name);
    }

    if let Some(slug) = req.slug {
        q = q.bind(slug);
    }

    let org = q
        .bind(org_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to update organization: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(org))
}

pub async fn delete_organization(
    claims: Claims,
    State(state): State<AppState>,
    Path(org_id): Path<Uuid>,
) -> Result<impl IntoResponse, StatusCode> {
    let pool = &state.pool;
    let role = sqlx::query_scalar::<_, String>(
        "SELECT role FROM organization_members WHERE org_id = $1 AND user_id = $2",
    )
    .bind(org_id)
    .bind(claims.sub)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to check org membership: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?
    .ok_or(StatusCode::FORBIDDEN)?;

    if role != "admin" {
        return Err(StatusCode::FORBIDDEN);
    }

    sqlx::query("UPDATE organizations SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2")
        .bind(claims.sub)
        .bind(org_id)
        .execute(pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to delete organization: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn list_members(
    claims: Claims,
    State(state): State<AppState>,
    Path(org_id): Path<Uuid>,
) -> Result<impl IntoResponse, StatusCode> {
    let pool = &state.pool;
    let membership = sqlx::query_scalar::<_, String>(
        "SELECT role FROM organization_members WHERE org_id = $1 AND user_id = $2",
    )
    .bind(org_id)
    .bind(claims.sub)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to check org membership: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    if membership.is_none() {
        return Err(StatusCode::FORBIDDEN);
    }

    let members = sqlx::query_as::<_, OrganizationMemberWithProfile>(
        r#"
        SELECT
            om.id, om.org_id, om.user_id, om.role, om.joined_at,
            u.username, u.display_name, u.avatar_url
        FROM organization_members om
        INNER JOIN users u ON u.id = om.user_id
        WHERE om.org_id = $1
        ORDER BY om.joined_at ASC
        "#,
    )
    .bind(org_id)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to list org members: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(members))
}

pub async fn add_member(
    claims: Claims,
    State(state): State<AppState>,
    Path(org_id): Path<Uuid>,
    Json(req): Json<AddMemberRequest>,
) -> Result<impl IntoResponse, StatusCode> {
    let pool = &state.pool;
    let role = sqlx::query_scalar::<_, String>(
        "SELECT role FROM organization_members WHERE org_id = $1 AND user_id = $2",
    )
    .bind(org_id)
    .bind(claims.sub)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to check org membership: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?
    .ok_or(StatusCode::FORBIDDEN)?;

    if role != "admin" {
        return Err(StatusCode::FORBIDDEN);
    }

    if !["admin", "member", "guest"].contains(&req.role.as_str()) {
        return Err(StatusCode::BAD_REQUEST);
    }

    let member = sqlx::query_as::<_, OrganizationMember>(
        r#"
        INSERT INTO organization_members (org_id, user_id, role, invited_by)
        VALUES ($1, $2, $3, $4)
        RETURNING id, org_id, user_id, role, invited_by, joined_at, created_at
        "#,
    )
    .bind(org_id)
    .bind(req.user_id)
    .bind(&req.role)
    .bind(claims.sub)
    .fetch_one(pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to add org member: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok((StatusCode::CREATED, Json(member)))
}

pub async fn update_member_role(
    claims: Claims,
    State(state): State<AppState>,
    Path((org_id, member_id)): Path<(Uuid, Uuid)>,
    Json(req): Json<UpdateMemberRoleRequest>,
) -> Result<impl IntoResponse, StatusCode> {
    let pool = &state.pool;
    let role = sqlx::query_scalar::<_, String>(
        "SELECT role FROM organization_members WHERE org_id = $1 AND user_id = $2",
    )
    .bind(org_id)
    .bind(claims.sub)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to check org membership: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?
    .ok_or(StatusCode::FORBIDDEN)?;

    if role != "admin" {
        return Err(StatusCode::FORBIDDEN);
    }

    if !["admin", "member", "guest"].contains(&req.role.as_str()) {
        return Err(StatusCode::BAD_REQUEST);
    }

    let member = sqlx::query_as::<_, OrganizationMember>(
        r#"
        UPDATE organization_members
        SET role = $1
        WHERE id = $2 AND org_id = $3
        RETURNING id, org_id, user_id, role, invited_by, joined_at, created_at
        "#,
    )
    .bind(&req.role)
    .bind(member_id)
    .bind(org_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to update member role: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?
    .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(member))
}

pub async fn remove_member(
    claims: Claims,
    State(state): State<AppState>,
    Path((org_id, member_id)): Path<(Uuid, Uuid)>,
) -> Result<impl IntoResponse, StatusCode> {
    let pool = &state.pool;
    let role = sqlx::query_scalar::<_, String>(
        "SELECT role FROM organization_members WHERE org_id = $1 AND user_id = $2",
    )
    .bind(org_id)
    .bind(claims.sub)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to check org membership: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?
    .ok_or(StatusCode::FORBIDDEN)?;

    if role != "admin" {
        return Err(StatusCode::FORBIDDEN);
    }

    sqlx::query("DELETE FROM organization_members WHERE id = $1 AND org_id = $2")
        .bind(member_id)
        .bind(org_id)
        .execute(pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to remove org member: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(StatusCode::NO_CONTENT)
}
