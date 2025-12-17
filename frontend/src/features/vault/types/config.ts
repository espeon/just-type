export interface VaultConfig {
    id: string
    name: string
    localPath: string
    serverVaultId?: string
    syncEnabled: boolean
    createdAt: number
    lastOpened?: number
}

export interface AppConfig {
    vaults: VaultConfig[]
    currentVaultId: string | null
    userId: string | null
    authToken: string | null
}

export const DEFAULT_CONFIG: AppConfig = {
    vaults: [],
    currentVaultId: null,
    userId: null,
    authToken: null
}
