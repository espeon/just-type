import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AppConfig, VaultConfig, DEFAULT_CONFIG } from '../types/config'
import { v4 as uuidv4 } from 'uuid'
import { authApi } from '@/api/auth'

interface ConfigState extends AppConfig {
    addVault: (
        name: string,
        localPath: string,
        syncEnabled?: boolean
    ) => VaultConfig
    removeVault: (vaultId: string) => void
    updateVault: (vaultId: string, updates: Partial<VaultConfig>) => void
    setCurrentVault: (vaultId: string) => void
    setAuth: (userId: string, token: string) => void
    clearAuth: () => void
    login: (email: string, password: string) => Promise<void>
    register: (email: string, password: string) => Promise<void>
    getCurrentVault: () => VaultConfig | null
}

export const useConfigStore = create<ConfigState>()(
    persist(
        (set, get) => ({
            ...DEFAULT_CONFIG,

            addVault: (
                name: string,
                localPath: string,
                syncEnabled = false
            ) => {
                const vault: VaultConfig = {
                    id: uuidv4(),
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

            setAuth: (userId: string, token: string) => {
                set({ userId, authToken: token })
            },

            clearAuth: () => {
                set({ userId: null, authToken: null })

                // Disable sync on all vaults when logging out
                set((state) => ({
                    vaults: state.vaults.map((v) => ({
                        ...v,
                        syncEnabled: false,
                        serverVaultId: undefined
                    }))
                }))
            },

            login: async (email: string, password: string) => {
                const response = await authApi.login({ email, password })
                get().setAuth(response.user.id, response.token)
            },

            register: async (email: string, password: string) => {
                const response = await authApi.register({ email, password })
                get().setAuth(response.user.id, response.token)
            },

            getCurrentVault: () => {
                const { vaults, currentVaultId } = get()
                return vaults.find((v) => v.id === currentVaultId) || null
            }
        }),
        {
            name: 'just-type-config'
        }
    )
)
