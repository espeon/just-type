import { useState, useEffect } from 'react'
import { useVaultStore } from '../stores/vaultStore'
import { useConfigStore } from '../stores/configStore'
import { useStorage } from '../storage/StorageContext'
import { vaultsApi } from '@/api/vaults'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

export function VaultSetup() {
    const storage = useStorage()
    const { initializeVault, setStorage, loadVault, clearVault } =
        useVaultStore()
    const { vaults, setCurrentVault, addVault, currentOrgContext, userId } =
        useConfigStore()
    const [isLoading, setIsLoading] = useState(false)
    const [vaultName, setVaultName] = useState('')
    const navi = useNavigate()

    useEffect(() => {
        setStorage(storage)
    }, [storage, setStorage])

    const hasOtherVaults = vaults.length > 0

    const handleClose = () => {
        if (hasOtherVaults) {
            // Switch to first available vault
            setCurrentVault(vaults[0].id)
            navi({ to: '/' })
        }
    }

    const handleChooseLocation = async () => {
        if (!vaultName.trim()) {
            console.error('Vault name is required')
            return
        }

        try {
            setIsLoading(true)

            // Organization vaults don't need a local path - they're server-only
            if (currentOrgContext !== 'personal' && userId) {
                console.log('Creating org vault on server...')
                const serverVault = await vaultsApi.create({
                    name: vaultName,
                    vault_type: 'org',
                    org_id: currentOrgContext
                })

                // Auto-add with default cache path
                const cachePath = `~/.just-type/cache/${serverVault.id}`
                addVault(vaultName, cachePath, true, serverVault.id)
                clearVault()
                await loadVault()
                navi({ to: '/' })
            } else {
                // Personal vaults need a local path
                console.log('Choosing vault location...')
                const path = await storage.chooseVaultLocation()
                console.log('Selected path:', path)
                if (path) {
                    console.log(
                        'Initializing vault with name:',
                        vaultName,
                        'path:',
                        path
                    )
                    await initializeVault(vaultName, path)
                    console.log('Vault initialized successfully')
                } else {
                    console.log('No path selected')
                }
            }
        } catch (error) {
            console.error('Failed to initialize vault:', error)
            alert(`Failed to initialize vault: ${error}`)
        } finally {
            setIsLoading(false)
        }
    }

    const isOrgContext = currentOrgContext !== 'personal'

    return (
        <div className="relative flex items-center justify-center h-screen">
            {hasOtherVaults && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="absolute right-4 top-4"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
            <div className="text-center space-y-4 max-w-md">
                <h1 className="text-4xl font-semibold">Welcome to Just Type</h1>
                <p className="text-muted-foreground">
                    {isOrgContext
                        ? 'Create a vault for your organization'
                        : 'Choose a location for your vault to get started'}
                </p>
                <div className="space-y-8">
                    <Input
                        type="text"
                        placeholder="Vault name (e.g., Personal, Work)"
                        value={vaultName}
                        onChange={(e) => setVaultName(e.target.value)}
                        className="max-w-xs mx-auto"
                    />
                    <Button
                        onClick={handleChooseLocation}
                        disabled={isLoading || !vaultName.trim()}
                        size="lg"
                    >
                        {isLoading
                            ? 'Setting up...'
                            : isOrgContext
                              ? 'Create Organization Vault'
                              : 'Choose Vault Location'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
