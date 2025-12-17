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
