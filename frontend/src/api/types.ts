export interface User {
    id: string
    email: string
    created_at: string
}

export interface AuthResponse {
    token: string
    user: User
}

export interface RegisterRequest {
    email: string
    password: string
}

export interface LoginRequest {
    email: string
    password: string
}

export interface ServerVault {
    id: string
    name: string
    created_at: string
}

export interface CreateVaultRequest {
    name: string
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

export interface AddVaultMemberRequest {
    user_id: string
    role?: string
}
