import { apiClient } from './client'
import { ServerVault, CreateVaultRequest, DocumentMetadata } from './types'

export const vaultsApi = {
    list: async (): Promise<ServerVault[]> => {
        return apiClient.get<ServerVault[]>('/api/vaults')
    },

    create: async (data: CreateVaultRequest): Promise<ServerVault> => {
        return apiClient.post<ServerVault>('/api/vaults', data)
    },

    get: async (vaultId: string): Promise<ServerVault> => {
        return apiClient.get<ServerVault>(`/api/vaults/${vaultId}`)
    },

    delete: async (vaultId: string): Promise<void> => {
        return apiClient.delete<void>(`/api/vaults/${vaultId}`)
    },

    getDocumentsMetadata: async (
        vaultId: string
    ): Promise<DocumentMetadata[]> => {
        return apiClient.get<DocumentMetadata[]>(
            `/api/vaults/${vaultId}/documents/metadata`
        )
    }
}
