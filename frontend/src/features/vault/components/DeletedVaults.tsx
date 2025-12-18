import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { vaultsApi } from '@/api/vaults'
import type { DeletedVault } from '@/api/types'

export function DeletedVaults() {
    const [deletedVaults, setDeletedVaults] = useState<DeletedVault[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string>()

    useEffect(() => {
        loadDeletedVaults()
    }, [])

    const loadDeletedVaults = async () => {
        try {
            setLoading(true)
            const vaults = await vaultsApi.listDeleted()
            setDeletedVaults(vaults)
            setError(undefined)
        } catch (e) {
            setError('Failed to load deleted vaults')
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleRestore = async (vaultId: string) => {
        try {
            await vaultsApi.restore(vaultId)
            await loadDeletedVaults()
        } catch (e) {
            setError('Failed to restore vault')
            console.error(e)
        }
    }

    if (loading) {
        return <div className="text-sm text-muted-foreground">Loading deleted vaults...</div>
    }

    if (deletedVaults.length === 0) {
        return <div className="text-sm text-muted-foreground">No deleted vaults</div>
    }

    return (
        <div className="space-y-3">
            {error && <div className="text-sm text-destructive">{error}</div>}
            {deletedVaults.map((vault) => (
                <div
                    key={vault.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                >
                    <div className="flex-1">
                        <p className="font-medium">{vault.name}</p>
                        <p className="text-xs text-muted-foreground">
                            Deleted {new Date(vault.deleted_at).toLocaleDateString()}
                            {vault.days_until_permanent_deletion > 0 && (
                                <span> • {vault.days_until_permanent_deletion} days until permanent deletion</span>
                            )}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(vault.id)}
                    >
                        Restore
                    </Button>
                </div>
            ))}
        </div>
    )
}
