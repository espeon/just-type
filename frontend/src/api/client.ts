import { useConfigStore } from '@/features/vault/stores/configStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

interface ApiError {
    message: string
    status: number
}

class ApiClient {
    private getAuthHeaders(): HeadersInit {
        const token = useConfigStore.getState().authToken
        return token
            ? {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
              }
            : {
                  'Content-Type': 'application/json'
              }
    }

    async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`
        const headers = this.getAuthHeaders()

        const response = await fetch(url, {
            ...options,
            headers: {
                ...headers,
                ...options.headers
            }
        })

        if (!response.ok) {
            const error: ApiError = {
                message: await response.text(),
                status: response.status
            }
            throw error
        }

        if (response.status === 204) {
            return undefined as T
        }

        return response.json()
    }

    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' })
    }

    async post<T>(endpoint: string, data?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined
        })
    }

    async put<T>(endpoint: string, data?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined
        })
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' })
    }
}

export const apiClient = new ApiClient()
