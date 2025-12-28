export interface User {
    id: string
    email: string
    username?: string
    display_name?: string
    avatar_url?: string
    created_at: string
}

export interface AuthResponse {
    token: string
    refresh_token: string
    user: User
}

export interface RegisterRequest {
    email: string
    password: string
    username?: string
    display_name?: string
}

export interface LoginRequest {
    email: string
    password: string
}

export interface ServerVault {
    id: string
    name: string
    created_at: string
    effective_role?: string
    org_id?: string
    vault_type?: string
}

export interface DeletedVault {
    id: string
    name: string
    deleted_at: string
    days_until_permanent_deletion: number
}

export interface CreateVaultRequest {
    name: string
    org_id?: string
    vault_type?: string
}

export interface DocumentMetadata {
    guid: string
    vault_id: string
    title: string
    doc_type: string
    icon?: string
    description?: string
    tags: string[]
    parent_guid?: string
    created_at: string
    modified_at: string
}

export interface VaultMember {
    id: string
    vault_id: string
    user_id: string
    role: string
    joined_at: string
}

export interface VaultMemberWithProfile {
    id: string
    vault_id: string
    user_id: string
    role: string
    joined_at: string
    username?: string
    display_name?: string
    avatar_url?: string
}

export interface PublicUserProfile {
    id: string
    username?: string
    display_name?: string
    avatar_url?: string
}

export interface UpdateProfileRequest {
    username?: string
    display_name?: string
    avatar_url?: string
}

export interface AddVaultMemberRequest {
    user_id?: string
    username?: string
    role?: string
}

export interface DocumentEdit {
    id: string
    subdoc_guid: string
    user_id: string
    session_id: string
    yjs_update: Uint8Array
    edit_type?: string
    block_type?: string
    block_position?: number
    content_before?: string
    content_after?: string
    created_at: string
    username?: string
    display_name?: string
    avatar_url?: string
}

export interface DocumentSnapshot {
    id: string
    subdoc_guid: string
    yjs_state: Uint8Array
    created_by: string
    snapshot_type: string
    description?: string
    created_at: string
}
