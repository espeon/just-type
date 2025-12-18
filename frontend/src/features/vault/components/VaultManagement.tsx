import { useState } from 'react'
import { useConfigStore } from '../stores/configStore'
import { useVaultStore } from '../stores/vaultStore'
import { vaultsApi } from '@/api/vaults'
import { VaultSharingDialog } from './VaultSharingDialog'
import { Button } from '@/components/ui/button'
import { Trash2, Share2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'

export function VaultManagement() {
    const { vaults, currentVaultId, removeVault, setCurrentVault } =
        useConfigStore()
    const { loadVault } = useVaultStore()
    const [vaultToDelete, setVaultToDelete] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [sharingVaultId, setSharingVaultId] = useState<string | null>(null)

    const handleDeleteVault = async (vaultId: string) => {
        setIsDeleting(true)
        try {
            const vault = vaults.find((v) => v.id === vaultId)

            // Delete from server if vault is synced
            if (vault?.syncEnabled) {
                try {
                    await vaultsApi.delete(vaultId)
                } catch (error) {
                    console.error('Failed to delete vault from server:', error)
                    // Continue with local deletion even if server deletion fails
                }
            }

            // Delete from local config
            removeVault(vaultId)

            // Switch to another vault if deleting the current one
            if (currentVaultId === vaultId && vaults.length > 1) {
                const nextVault = vaults.find((v) => v.id !== vaultId)
                if (nextVault) {
                    setCurrentVault(nextVault.id)
                    await loadVault()
                }
            }

            setVaultToDelete(null)
        } finally {
            setIsDeleting(false)
        }
    }

    if (vaults.length === 0) {
        return (
            <div>
                <h2 className="text-xl font-semibold mb-2">vaults</h2>
                <p className="text-sm text-muted-foreground">
                    no vaults yet. create one from the sidebar.
                </p>
            </div>
        )
    }

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">vaults</h2>
            <div className="space-y-3">
                {vaults.map((vault) => (
                    <div
                        key={vault.id}
                        className={`p-4 border rounded-lg ${
                            currentVaultId === vault.id
                                ? 'border bg-muted'
                                : 'border-border'
                        }`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h3 className="font-medium">{vault.name}</h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {vault.syncEnabled ? (
                                        <span className="text-blue-600 dark:text-blue-400">
                                            synced
                                        </span>
                                    ) : (
                                        <span>local only</span>
                                    )}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {vault.localPath}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                {vault.syncEnabled && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            setSharingVaultId(vault.id)
                                        }
                                        className="h-8 w-8 p-0"
                                        title="share vault"
                                    >
                                        <Share2 className="h-4 w-4" />
                                    </Button>
                                )}
                                {currentVaultId !== vault.id && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            setVaultToDelete(vault.id)
                                        }
                                        className="text-destructive hover:text-destructive h-8 w-8 p-0"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Dialog
                open={!!vaultToDelete}
                onOpenChange={(open) => !open && setVaultToDelete(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>delete vault?</DialogTitle>
                        <DialogDescription>
                            this will remove the vault from your list. your
                            files will not be deleted.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setVaultToDelete(null)}
                            disabled={isDeleting}
                        >
                            cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() =>
                                vaultToDelete &&
                                handleDeleteVault(vaultToDelete)
                            }
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'deleting...' : 'delete'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {sharingVaultId && (
                <VaultSharingDialog
                    open={!!sharingVaultId}
                    onOpenChange={(open) => !open && setSharingVaultId(null)}
                    vaultId={sharingVaultId}
                />
            )}
        </div>
    )
}
