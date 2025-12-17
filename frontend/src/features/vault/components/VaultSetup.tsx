import { useState, useEffect } from 'react'
import { useVaultStore } from '../stores/vaultStore'
import { useStorage } from '../storage/StorageContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function VaultSetup() {
    const storage = useStorage()
    const { initializeVault, setStorage } = useVaultStore()
    const [isLoading, setIsLoading] = useState(false)
    const [vaultName, setVaultName] = useState('')

    useEffect(() => {
        setStorage(storage)
    }, [storage, setStorage])

    const handleChooseLocation = async () => {
        if (!vaultName.trim()) {
            console.error('Vault name is required')
            return
        }

        try {
            setIsLoading(true)
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
        } catch (error) {
            console.error('Failed to initialize vault:', error)
            alert(`Failed to initialize vault: ${error}`)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold">Welcome to Just Type</h1>
                <p className="text-muted-foreground">
                    Choose a location for your vault to get started
                </p>
                <div className="space-y-2">
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
                        {isLoading ? 'Setting up...' : 'Choose Vault Location'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
