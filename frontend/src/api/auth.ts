import { apiClient } from './client'
import { AuthResponse, LoginRequest, RegisterRequest } from './types'

export const authApi = {
    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        return apiClient.post<AuthResponse>('/api/auth/register', data)
    },

    login: async (data: LoginRequest): Promise<AuthResponse> => {
        return apiClient.post<AuthResponse>('/api/auth/login', data)
    }
}
