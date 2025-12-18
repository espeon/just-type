import { useState } from 'react'
import { useConfigStore } from '../stores/configStore'
import { useVaultStore } from '../stores/vaultStore'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Trash2 } from 'lucide-react'
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

    const handleDeleteVault = async (vaultId: string) => {
        removeVault(vaultId)

        if (currentVaultId === vaultId && vaults.length > 1) {
            const nextVault = vaults.find((v) => v.id !== vaultId)
            if (nextVault) {
                setCurrentVault(nextVault.id)
                await loadVault()
            }
        }

        setVaultToDelete(null)
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
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
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
                            {currentVaultId !== vault.id && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setVaultToDelete(vault.id)}
                                    className="text-destructive hover:text-destructive h-8 w-8 p-0"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
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
                        >
                            cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() =>
                                vaultToDelete &&
                                handleDeleteVault(vaultToDelete)
                            }
                        >
                            delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
