import { apiClient } from './client'
import type { User, PublicUserProfile, UpdateProfileRequest } from './types'

export const usersApi = {
    getCurrentUser: async (): Promise<User> => {
        return apiClient.get<User>('/api/users/me')
    },

    updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
        return apiClient.put<User>('/api/users/me', data)
    },

    searchUsers: async (query: string): Promise<PublicUserProfile[]> => {
        return apiClient.get<PublicUserProfile[]>(
            `/api/users/search?q=${encodeURIComponent(query)}`
        )
    },

    getUserProfile: async (userId: string): Promise<PublicUserProfile> => {
        return apiClient.get<PublicUserProfile>(`/api/users/${userId}`)
    },
}
