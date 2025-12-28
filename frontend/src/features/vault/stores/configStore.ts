import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { VaultConfig } from '../types/config'
import { v4 as uuidv4 } from 'uuid'
import { authApi } from '@/api/auth'
import { vaultsApi } from '@/api/vaults'

interface PersistedState {
    userId: string | null
    authToken: string | null
    refreshToken: string | null
    currentOrgContext: 'personal' | string
    // Per-user vault configs: { userId: { vaults: [], currentVaultId: '' } }
    userVaultConfigs: Record<
        string,
        { vaults: VaultConfig[]; currentVaultId: string | null }
    >
}

interface ConfigState {
    userId: string | null
    authToken: string | null
    refreshToken: string | null
    currentOrgContext: 'personal' | string
    vaults: VaultConfig[]
    currentVaultId: string | null
    addVault: (
        name: string,
        localPath: string,
        syncEnabled?: boolean,
        vaultId?: string
    ) => VaultConfig
    removeVault: (vaultId: string) => void
    updateVault: (vaultId: string, updates: Partial<VaultConfig>) => void
    setCurrentVault: (vaultId: string) => void
    setCurrentOrgContext: (context: 'personal' | string) => void
    setAuth: (userId: string, token: string, refreshToken: string) => void
    clearAuth: () => void
    syncServerVaults: () => Promise<void>
    login: (email: string, password: string) => Promise<void>
    register: (
        email: string,
        password: string,
        username?: string,
        displayName?: string
    ) => Promise<void>
    refreshAccessToken: () => Promise<void>
    getCurrentVault: () => VaultConfig | null
}

export const useConfigStore = create<ConfigState>()(
    persist(
        (set, get) => ({
            userId: null,
            authToken: null,
            refreshToken: null,
            currentOrgContext: 'personal',
            vaults: [],
            currentVaultId: null,

            addVault: (
                name: string,
                localPath: string,
                syncEnabled = false,
                vaultId?: string
            ) => {
                const vault: VaultConfig = {
                    id: vaultId || uuidv4(),
                    name,
                    localPath,
                    syncEnabled,
                    createdAt: Date.now()
                }

                set((state) => ({
                    vaults: [...state.vaults, vault],
                    currentVaultId: vault.id
                }))

                return vault
            },

            removeVault: (vaultId: string) => {
                set((state) => ({
                    vaults: state.vaults.filter((v) => v.id !== vaultId),
                    currentVaultId:
                        state.currentVaultId === vaultId
                            ? state.vaults[0]?.id || null
                            : state.currentVaultId
                }))
            },

            updateVault: (vaultId: string, updates: Partial<VaultConfig>) => {
                set((state) => ({
                    vaults: state.vaults.map((v) =>
                        v.id === vaultId ? { ...v, ...updates } : v
                    )
                }))
            },

            setCurrentVault: (vaultId: string) => {
                set({ currentVaultId: vaultId })

                // Update last opened timestamp
                get().updateVault(vaultId, { lastOpened: Date.now() })
            },

            setCurrentOrgContext: (context: 'personal' | string) => {
                set({ currentOrgContext: context })
            },

            setAuth: (userId: string, token: string, refreshToken: string) => {
                // Get vault config for this user from persisted state
                const stored = localStorage.getItem('just-type-config')
                const existingState: PersistedState = stored
                    ? JSON.parse(stored).state
                    : {
                          userId: null,
                          authToken: null,
                          refreshToken: null,
                          currentOrgContext: 'personal',
                          userVaultConfigs: {}
                      }

                const userConfig = existingState.userVaultConfigs?.[userId]

                set({
                    userId,
                    authToken: token,
                    refreshToken,
                    vaults: userConfig?.vaults || [],
                    currentVaultId: userConfig?.currentVaultId || null,
                    currentOrgContext: 'personal' // Reset to personal on login
                })
            },

            clearAuth: () => {
                set({
                    userId: null,
                    authToken: null,
                    refreshToken: null,
                    vaults: [],
                    currentVaultId: null,
                    currentOrgContext: 'personal'
                })
            },

            syncServerVaults: async () => {
                try {
                    const serverVaults = await vaultsApi.list()
                    const { vaults } = get()

                    console.log(
                        '[syncServerVaults] Server vaults:',
                        serverVaults.map((v) => ({ id: v.id, name: v.name }))
                    )
                    console.log(
                        '[syncServerVaults] Local vaults:',
                        vaults.map((v) => ({
                            id: v.id,
                            name: v.name,
                            path: v.localPath
                        }))
                    )

                    // Add any server vaults that aren't in local config
                    for (const serverVault of serverVaults) {
                        const existingVault = vaults.find(
                            (v) => v.id === serverVault.id
                        )
                        if (!existingVault) {
                            console.log(
                                `[syncServerVaults] Adding missing vault: ${serverVault.name} (${serverVault.id})`
                            )
                            // Auto-add server vault with default cache path
                            const cachePath = `~/.just-type/cache/${serverVault.id}`
                            get().addVault(
                                serverVault.name,
                                cachePath,
                                true, // sync enabled
                                serverVault.id
                            )
                        } else {
                            console.log(
                                `[syncServerVaults] Vault already exists: ${serverVault.name} (${serverVault.id})`
                            )
                        }
                    }
                } catch (error) {
                    console.error('Failed to sync server vaults:', error)
                }
            },

            login: async (email: string, password: string) => {
                const response = await authApi.login({ email, password })
                get().setAuth(
                    response.user.id,
                    response.token,
                    response.refresh_token
                )
                // Sync server vaults after login
                await get().syncServerVaults()
            },

            register: async (
                email: string,
                password: string,
                username?: string,
                displayName?: string
            ) => {
                const response = await authApi.register({
                    email,
                    password,
                    username,
                    display_name: displayName
                })
                get().setAuth(
                    response.user.id,
                    response.token,
                    response.refresh_token
                )
                // Sync server vaults after registration
                await get().syncServerVaults()
            },

            refreshAccessToken: async () => {
                const { refreshToken } = get()
                if (!refreshToken) {
                    throw new Error('No refresh token available')
                }

                const response = await authApi.refresh(refreshToken)
                get().setAuth(
                    response.user.id,
                    response.token,
                    response.refresh_token
                )
            },

            getCurrentVault: () => {
                const { vaults, currentVaultId } = get()
                return vaults.find((v) => v.id === currentVaultId) || null
            }
        }),
        {
            name: 'just-type-config',
            partialize: (state): PersistedState => {
                const { userId, vaults, currentVaultId } = state

                // Get current persisted state to preserve other users' data
                const stored = localStorage.getItem('just-type-config')
                const existingState: PersistedState = stored
                    ? JSON.parse(stored).state
                    : {
                          userId: null,
                          authToken: null,
                          refreshToken: null,
                          currentOrgContext: 'personal',
                          userVaultConfigs: {}
                      }

                // Update vault config for current user
                const userVaultConfigs = { ...existingState.userVaultConfigs }
                if (userId) {
                    userVaultConfigs[userId] = { vaults, currentVaultId }
                }

                return {
                    userId: state.userId,
                    authToken: state.authToken,
                    refreshToken: state.refreshToken,
                    currentOrgContext: state.currentOrgContext,
                    userVaultConfigs
                }
            },
            merge: (
                persistedState: unknown,
                currentState: ConfigState
            ): ConfigState => {
                const persisted = persistedState as PersistedState
                const userId = persisted.userId

                // Load vault config for current user
                const userConfig = userId
                    ? persisted.userVaultConfigs?.[userId]
                    : null

                return {
                    ...currentState,
                    userId: persisted.userId,
                    authToken: persisted.authToken,
                    refreshToken: persisted.refreshToken,
                    currentOrgContext:
                        persisted.currentOrgContext || 'personal',
                    vaults: userConfig?.vaults || [],
                    currentVaultId: userConfig?.currentVaultId || null
                }
            }
        }
    )
)
