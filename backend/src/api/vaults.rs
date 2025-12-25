use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    routing::{delete, get, post},
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    api::auth::AppState,
    auth::jwt::Claims,
    models::{DocumentMetadata, Vault, VaultMember, VaultMemberWithProfile},
};

#[derive(Debug, Deserialize)]
pub struct CreateVaultRequest {
    pub name: String,
    pub org_id: Option<Uuid>,
    pub vault_type: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct VaultResponse {
    pub id: Uuid,
    pub name: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

impl From<Vault> for VaultResponse {
    fn from(vault: Vault) -> Self {
        Self {
            id: vault.id,
            name: vault.name,
            created_at: vault.created_at,
        }
    }
}

pub fn vault_routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_vaults).post(create_vault))
        .route("/deleted", get(list_deleted_vaults))
        .route("/{vault_id}", get(get_vault).delete(delete_vault))
        .route("/{vault_id}/restore", post(restore_vault))
        .route(
            "/{vault_id}/documents/metadata",
            get(get_vault_documents_metadata),
        )
        .route(
            "/{vault_id}/members",
            get(list_vault_members).post(add_vault_member),
        )
        .route(
            "/{vault_id}/members/{member_id}",
            delete(remove_vault_member),
        )
}

async fn list_vaults(
    State(state): State<AppState>,
    claims: Claims,
) -> Result<Json<Vec<VaultResponse>>, StatusCode> {
    let vaults = sqlx::query_as::<_, Vault>(
        r#"
        SELECT DISTINCT v.id, v.user_id, v.org_id, v.vault_type, v.name, v.created_at, v.deleted_at, v.deleted_by
        FROM vaults v
        LEFT JOIN organization_members om ON v.org_id = om.org_id AND om.user_id = $1
        WHERE v.deleted_at IS NULL AND (
            v.user_id = $1 OR
            (v.org_id IS NOT NULL AND om.user_id IS NOT NULL) OR
            EXISTS (SELECT 1 FROM vault_members vm WHERE vm.vault_id = v.id AND vm.user_id = $1)
        )
        ORDER BY v.created_at DESC
        "#,
    )
    .bind(claims.sub)
    .fetch_all(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(vaults.into_iter().map(VaultResponse::from).collect()))
}

async fn create_vault(
    State(state): State<AppState>,
    claims: Claims,
    Json(req): Json<CreateVaultRequest>,
) -> Result<Json<VaultResponse>, StatusCode> {
    let vault_type = req.vault_type.unwrap_or_else(|| "user".to_string());

    if !["user", "org", "shared"].contains(&vault_type.as_str()) {
        return Err(StatusCode::BAD_REQUEST);
    }

    if let Some(org_id) = req.org_id {
        let role = sqlx::query_scalar::<_, String>(
            "SELECT role FROM organization_members WHERE org_id = $1 AND user_id = $2",
        )
        .bind(org_id)
        .bind(claims.sub)
        .fetch_optional(&state.pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::FORBIDDEN)?;

        if role != "admin" {
            return Err(StatusCode::FORBIDDEN);
        }

        let vault = sqlx::query_as::<_, Vault>(
            "INSERT INTO vaults (id, org_id, vault_type, name) VALUES ($1, $2, $3, $4) RETURNING id, user_id, org_id, vault_type, name, created_at, deleted_at, deleted_by",
        )
        .bind(Uuid::new_v4())
        .bind(org_id)
        .bind(vault_type)
        .bind(req.name)
        .fetch_one(&state.pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        Ok(Json(VaultResponse::from(vault)))
    } else {
        let vault = sqlx::query_as::<_, Vault>(
            "INSERT INTO vaults (id, user_id, vault_type, name) VALUES ($1, $2, $3, $4) RETURNING id, user_id, org_id, vault_type, name, created_at, deleted_at, deleted_by",
        )
        .bind(Uuid::new_v4())
        .bind(claims.sub)
        .bind(vault_type)
        .bind(req.name)
        .fetch_one(&state.pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        Ok(Json(VaultResponse::from(vault)))
    }
}

async fn get_vault(
    State(state): State<AppState>,
    claims: Claims,
    Path(vault_id): Path<Uuid>,
) -> Result<Json<VaultResponse>, StatusCode> {
    let vault = sqlx::query_as::<_, Vault>(
        r#"
        SELECT v.id, v.user_id, v.org_id, v.vault_type, v.name, v.created_at, v.deleted_at, v.deleted_by
        FROM vaults v
        LEFT JOIN organization_members om ON v.org_id = om.org_id AND om.user_id = $2
        WHERE v.id = $1 AND v.deleted_at IS NULL AND (
            v.user_id = $2 OR
            (v.org_id IS NOT NULL AND om.user_id IS NOT NULL) OR
            EXISTS (SELECT 1 FROM vault_members vm WHERE vm.vault_id = v.id AND vm.user_id = $2)
        )
        "#,
    )
    .bind(vault_id)
    .bind(claims.sub)
    .fetch_optional(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(VaultResponse::from(vault)))
}

async fn delete_vault(
    State(state): State<AppState>,
    claims: Claims,
    Path(vault_id): Path<Uuid>,
) -> Result<StatusCode, StatusCode> {
    let vault = sqlx::query_as::<_, Vault>(
        "SELECT id, user_id, org_id, vault_type, name, created_at, deleted_at, deleted_by FROM vaults WHERE id = $1 AND deleted_at IS NULL",
    )
    .bind(vault_id)
    .fetch_optional(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    let can_delete = if let Some(user_id) = vault.user_id {
        user_id == claims.sub
    } else if let Some(org_id) = vault.org_id {
        let role = sqlx::query_scalar::<_, String>(
            "SELECT role FROM organization_members WHERE org_id = $1 AND user_id = $2",
        )
        .bind(org_id)
        .bind(claims.sub)
        .fetch_optional(&state.pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        role == Some("admin".to_string())
    } else {
        false
    };

    if !can_delete {
        return Err(StatusCode::FORBIDDEN);
    }

    sqlx::query(
        "UPDATE vaults SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2 AND deleted_at IS NULL",
    )
    .bind(claims.sub)
    .bind(vault_id)
    .execute(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    sqlx::query(
        "UPDATE subdocs SET deleted_at = NOW(), deleted_by = $1 WHERE vault_id = $2 AND deleted_at IS NULL",
    )
    .bind(claims.sub)
    .bind(vault_id)
    .execute(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::NO_CONTENT)
}

async fn get_vault_documents_metadata(
    State(state): State<AppState>,
    claims: Claims,
    Path(vault_id): Path<Uuid>,
) -> Result<Json<Vec<DocumentMetadata>>, StatusCode> {
    let _vault = sqlx::query_as::<_, Vault>(
        r#"
        SELECT v.id, v.user_id, v.org_id, v.vault_type, v.name, v.created_at, v.deleted_at, v.deleted_by
        FROM vaults v
        LEFT JOIN organization_members om ON v.org_id = om.org_id AND om.user_id = $2
        WHERE v.id = $1 AND v.deleted_at IS NULL AND (
            v.user_id = $2 OR
            (v.org_id IS NOT NULL AND om.user_id IS NOT NULL) OR
            EXISTS (SELECT 1 FROM vault_members vm WHERE vm.vault_id = v.id AND vm.user_id = $2)
        )
        "#,
    )
    .bind(vault_id)
    .bind(claims.sub)
    .fetch_optional(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    let documents = sqlx::query!(
        "SELECT s.guid, s.vault_id, s.doc_type, s.parent_guid, s.created_at, s.modified_at,
                m.title, m.icon, m.description, m.tags
         FROM subdocs s
         LEFT JOIN subdoc_metadata m ON s.guid = m.subdoc_guid
         WHERE s.vault_id = $1 AND s.deleted_at IS NULL
         ORDER BY s.created_at ASC",
        vault_id
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let metadata: Vec<DocumentMetadata> = documents
        .iter()
        .map(|doc| DocumentMetadata {
            guid: doc.guid.clone(),
            vault_id: doc.vault_id,
            title: doc.title.clone(),
            doc_type: doc.doc_type.clone(),
            icon: doc.icon.clone(),
            description: doc.description.clone(),
            tags: doc.tags.clone().unwrap_or_default(),
            parent_guid: doc.parent_guid.clone(),
            created_at: doc.created_at,
            modified_at: doc.modified_at,
        })
        .collect();

    Ok(Json(metadata))
}

#[derive(Debug, Deserialize)]
pub struct AddVaultMemberRequest {
    pub user_id: Option<Uuid>,
    pub username: Option<String>,
    pub role: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct VaultMemberResponse {
    pub id: Uuid,
    pub vault_id: Uuid,
    pub user_id: Uuid,
    pub role: String,
    pub joined_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
pub struct VaultMemberWithProfileResponse {
    pub id: Uuid,
    pub vault_id: Uuid,
    pub user_id: Uuid,
    pub role: String,
    pub joined_at: chrono::DateTime<chrono::Utc>,
    pub username: Option<String>,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
}

impl From<VaultMember> for VaultMemberResponse {
    fn from(member: VaultMember) -> Self {
        Self {
            id: member.id,
            vault_id: member.vault_id,
            user_id: member.user_id,
            role: member.role,
            joined_at: member.joined_at,
        }
    }
}

impl From<VaultMemberWithProfile> for VaultMemberWithProfileResponse {
    fn from(member: VaultMemberWithProfile) -> Self {
        Self {
            id: member.id,
            vault_id: member.vault_id,
            user_id: member.user_id,
            role: member.role,
            joined_at: member.joined_at,
            username: member.username,
            display_name: member.display_name,
            avatar_url: member.avatar_url,
        }
    }
}

async fn list_vault_members(
    State(state): State<AppState>,
    claims: Claims,
    Path(vault_id): Path<Uuid>,
) -> Result<Json<Vec<VaultMemberWithProfileResponse>>, StatusCode> {
    let _vault = sqlx::query_as::<_, Vault>(
        r#"
        SELECT v.id, v.user_id, v.org_id, v.vault_type, v.name, v.created_at, v.deleted_at, v.deleted_by
        FROM vaults v
        LEFT JOIN organization_members om ON v.org_id = om.org_id AND om.user_id = $2
        WHERE v.id = $1 AND v.deleted_at IS NULL AND (
            v.user_id = $2 OR
            (v.org_id IS NOT NULL AND om.user_id IS NOT NULL) OR
            EXISTS (SELECT 1 FROM vault_members vm WHERE vm.vault_id = v.id AND vm.user_id = $2)
        )
        "#,
    )
    .bind(vault_id)
    .bind(claims.sub)
    .fetch_optional(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    let members = sqlx::query_as::<_, VaultMemberWithProfile>(
        "SELECT vm.id, vm.vault_id, vm.user_id, vm.role, vm.joined_at,
                u.username, u.display_name, u.avatar_url
         FROM vault_members vm
         JOIN users u ON vm.user_id = u.id
         WHERE vm.vault_id = $1
         ORDER BY vm.joined_at ASC",
    )
    .bind(vault_id)
    .fetch_all(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(
        members
            .into_iter()
            .map(VaultMemberWithProfileResponse::from)
            .collect(),
    ))
}

async fn add_vault_member(
    State(state): State<AppState>,
    claims: Claims,
    Path(vault_id): Path<Uuid>,
    Json(req): Json<AddVaultMemberRequest>,
) -> Result<Json<VaultMemberWithProfileResponse>, StatusCode> {
    let vault = sqlx::query_as::<_, Vault>(
        "SELECT id, user_id, org_id, vault_type, name, created_at, deleted_at, deleted_by FROM vaults WHERE id = $1 AND deleted_at IS NULL",
    )
    .bind(vault_id)
    .fetch_optional(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    let can_add = if let Some(user_id) = vault.user_id {
        user_id == claims.sub
    } else if let Some(org_id) = vault.org_id {
        let role = sqlx::query_scalar::<_, String>(
            "SELECT role FROM organization_members WHERE org_id = $1 AND user_id = $2",
        )
        .bind(org_id)
        .bind(claims.sub)
        .fetch_optional(&state.pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        role == Some("admin".to_string())
    } else {
        false
    };

    if !can_add {
        return Err(StatusCode::FORBIDDEN);
    }

    // Resolve user_id from username if provided
    let target_user_id = if let Some(username) = req.username {
        sqlx::query!("SELECT id FROM users WHERE username = $1", username)
            .fetch_optional(&state.pool)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
            .ok_or(StatusCode::NOT_FOUND)?
            .id
    } else if let Some(user_id) = req.user_id {
        user_id
    } else {
        return Err(StatusCode::BAD_REQUEST);
    };

    let role = req.role.unwrap_or_else(|| "editor".to_string());

    sqlx::query(
        "INSERT INTO vault_members (vault_id, user_id, role, invited_by) VALUES ($1, $2, $3, $4)",
    )
    .bind(vault_id)
    .bind(target_user_id)
    .bind(&role)
    .bind(claims.sub)
    .execute(&state.pool)
    .await
    .map_err(|_| StatusCode::CONFLICT)?;

    let member = sqlx::query_as::<_, VaultMemberWithProfile>(
        "SELECT vm.id, vm.vault_id, vm.user_id, vm.role, vm.joined_at,
                u.username, u.display_name, u.avatar_url
         FROM vault_members vm
         JOIN users u ON vm.user_id = u.id
         WHERE vm.vault_id = $1 AND vm.user_id = $2",
    )
    .bind(vault_id)
    .bind(target_user_id)
    .fetch_one(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(VaultMemberWithProfileResponse::from(member)))
}

async fn remove_vault_member(
    State(state): State<AppState>,
    claims: Claims,
    Path((vault_id, member_id)): Path<(Uuid, Uuid)>,
) -> Result<StatusCode, StatusCode> {
    let vault = sqlx::query_as::<_, Vault>(
        "SELECT id, user_id, org_id, vault_type, name, created_at, deleted_at, deleted_by FROM vaults WHERE id = $1 AND deleted_at IS NULL",
    )
    .bind(vault_id)
    .fetch_optional(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    let can_remove = if let Some(user_id) = vault.user_id {
        user_id == claims.sub
    } else if let Some(org_id) = vault.org_id {
        let role = sqlx::query_scalar::<_, String>(
            "SELECT role FROM organization_members WHERE org_id = $1 AND user_id = $2",
        )
        .bind(org_id)
        .bind(claims.sub)
        .fetch_optional(&state.pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        role == Some("admin".to_string())
    } else {
        false
    };

    if !can_remove {
        return Err(StatusCode::FORBIDDEN);
    }

    let result = sqlx::query("DELETE FROM vault_members WHERE id = $1 AND vault_id = $2")
        .bind(member_id)
        .bind(vault_id)
        .execute(&state.pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if result.rows_affected() == 0 {
        return Err(StatusCode::NOT_FOUND);
    }

    Ok(StatusCode::NO_CONTENT)
}

async fn restore_vault(
    State(state): State<AppState>,
    claims: Claims,
    Path(vault_id): Path<Uuid>,
) -> Result<Json<VaultResponse>, StatusCode> {
    let vault = sqlx::query_as::<_, Vault>(
        "SELECT id, user_id, org_id, vault_type, name, created_at, deleted_at, deleted_by FROM vaults WHERE id = $1 AND deleted_at IS NOT NULL",
    )
    .bind(vault_id)
    .fetch_optional(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    let can_restore = if let Some(user_id) = vault.user_id {
        user_id == claims.sub
    } else if let Some(org_id) = vault.org_id {
        let role = sqlx::query_scalar::<_, String>(
            "SELECT role FROM organization_members WHERE org_id = $1 AND user_id = $2",
        )
        .bind(org_id)
        .bind(claims.sub)
        .fetch_optional(&state.pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        role == Some("admin".to_string())
    } else {
        false
    };

    if !can_restore {
        return Err(StatusCode::FORBIDDEN);
    }

    let vault = sqlx::query_as::<_, Vault>(
        "UPDATE vaults SET deleted_at = NULL, deleted_by = NULL WHERE id = $1 AND deleted_at IS NOT NULL RETURNING id, user_id, org_id, vault_type, name, created_at, deleted_at, deleted_by",
    )
    .bind(vault_id)
    .fetch_optional(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    // Restore all subdocs in the vault
    sqlx::query(
        "UPDATE subdocs SET deleted_at = NULL, deleted_by = NULL WHERE vault_id = $1 AND deleted_at IS NOT NULL",
    )
    .bind(vault_id)
    .execute(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(VaultResponse::from(vault)))
}

#[derive(Debug, Serialize)]
pub struct DeletedVaultResponse {
    pub id: Uuid,
    pub name: String,
    pub deleted_at: chrono::DateTime<chrono::Utc>,
    pub days_until_permanent_deletion: i64,
}

async fn list_deleted_vaults(
    State(state): State<AppState>,
    claims: Claims,
) -> Result<Json<Vec<DeletedVaultResponse>>, StatusCode> {
    let vaults = sqlx::query_as::<_, Vault>(
        r#"
        SELECT DISTINCT v.id, v.user_id, v.org_id, v.vault_type, v.name, v.created_at, v.deleted_at, v.deleted_by
        FROM vaults v
        LEFT JOIN organization_members om ON v.org_id = om.org_id AND om.user_id = $1
        WHERE v.deleted_at IS NOT NULL AND (
            v.user_id = $1 OR
            (v.org_id IS NOT NULL AND om.user_id IS NOT NULL AND om.role = 'admin')
        )
        ORDER BY v.deleted_at DESC
        "#,
    )
    .bind(claims.sub)
    .fetch_all(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response: Vec<DeletedVaultResponse> = vaults
        .into_iter()
        .filter_map(|v| {
            let deleted_at = v.deleted_at?;
            let days_until_permanent = 30 - (chrono::Utc::now() - deleted_at).num_days();
            Some(DeletedVaultResponse {
                id: v.id,
                name: v.name,
                deleted_at,
                days_until_permanent_deletion: days_until_permanent.max(0),
            })
        })
        .collect();

    Ok(Json(response))
}
