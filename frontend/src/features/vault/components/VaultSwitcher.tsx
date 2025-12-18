import { useState } from 'react'
import { useConfigStore } from '../stores/configStore'
import { useVaultStore } from '../stores/vaultStore'
import { useStorage } from '../storage/StorageContext'
import { vaultsApi } from '@/api/vaults'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'
import { ChevronsUpDown, LucideCloud } from 'lucide-react'

export function VaultSwitcher() {
    const storage = useStorage()
    const {
        vaults,
        currentVaultId,
        setCurrentVault,
        addVault,
        removeVault,
        userId
    } = useConfigStore()
    const { loadVault } = useVaultStore()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [newVaultName, setNewVaultName] = useState('')
    const [enableSync, setEnableSync] = useState(false)

    const currentVault = vaults.find((v) => v.id === currentVaultId)

    const handleSwitchVault = async (vaultId: string) => {
        setCurrentVault(vaultId)
        await loadVault()
    }

    const handleCreateVault = async () => {
        if (!newVaultName.trim()) return

        try {
            setIsCreating(true)
            const path = await storage.chooseVaultLocation()
            if (path) {
                await storage.initializeVault(path)

                let vaultId: string

                // Create on server first if sync is enabled
                if (enableSync && userId) {
                    try {
                        const serverVault = await vaultsApi.create({
                            name: newVaultName
                        })
                        vaultId = serverVault.id
                    } catch (error) {
                        console.error(
                            'Failed to create vault on server:',
                            error
                        )
                        throw error
                    }
                } else {
                    // For local vaults, generate a local ID
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    vaultId = undefined as any
                }

                // Add vault with server ID (or undefined for local, which will generate one)
                addVault(newVaultName, path, enableSync, vaultId)

                setNewVaultName('')
                setEnableSync(false)
                setIsDialogOpen(false)
                await loadVault()
            }
        } catch (error) {
            console.error('Failed to create vault:', error)
        } finally {
            setIsCreating(false)
        }
    }

    const handleDeleteVault = (vaultId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (
            confirm(
                'remove this vault from the list? (files will not be deleted)'
            )
        ) {
            removeVault(vaultId)
            if (currentVaultId === vaultId && vaults.length > 0) {
                const nextVault = vaults.find((v) => v.id !== vaultId)
                if (nextVault) {
                    setCurrentVault(nextVault.id)
                    loadVault()
                }
            }
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full justify-start text-sm font-normal px-4 py-6"
                    >
                        <div className="flex flex-col items-start flex-1">
                            <span className="text-xs text-muted-foreground">
                                vault
                            </span>
                            <span className="font-medium">
                                {currentVault?.name || 'no vault'}
                                {currentVault && currentVault.syncEnabled ? (
                                    <LucideCloud className="inline-block ml-2 text-blue-500  mb-0.5" />
                                ) : (
                                    <span className="px-2 py-0.5 bg-muted rounded-sm text-xs ml-2">
                                        local
                                    </span>
                                )}
                            </span>
                        </div>
                        <ChevronsUpDown />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-60">
                    <DropdownMenuLabel>switch vault</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {vaults.map((vault) => (
                        <DropdownMenuItem
                            key={vault.id}
                            onClick={() => handleSwitchVault(vault.id)}
                            className="flex items-center justify-between"
                        >
                            <div className="flex flex-col">
                                <span className="font-medium">
                                    {vault.name}{' '}
                                    {vault.syncEnabled ? (
                                        <LucideCloud className="inline-block ml-2 text-blue-500" />
                                    ) : (
                                        <span className="px-2 py-0.5 bg-muted rounded-sm text-xs ml-2">
                                            local
                                        </span>
                                    )}
                                </span>
                                <span className="text-xs text-muted-foreground truncate max-w-50">
                                    {vault.localPath}
                                </span>
                            </div>
                            {vault.id !== currentVaultId && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) =>
                                        handleDeleteVault(vault.id, e)
                                    }
                                    className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                                >
                                    remove
                                </Button>
                            )}
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsDialogOpen(true)}>
                        <span className="font-medium">+ new vault</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>create new vault</DialogTitle>
                        <DialogDescription>
                            choose a name and location for your new vault
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="vault-name">vault name</Label>
                            <Input
                                id="vault-name"
                                type="text"
                                placeholder="e.g., personal, work"
                                value={newVaultName}
                                onChange={(e) =>
                                    setNewVaultName(e.target.value)
                                }
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        handleCreateVault()
                                    }
                                }}
                            />
                        </div>
                        {userId && (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="enable-sync"
                                    checked={enableSync}
                                    onCheckedChange={(checked) =>
                                        setEnableSync(checked === true)
                                    }
                                />
                                <Label
                                    htmlFor="enable-sync"
                                    className="text-sm font-normal cursor-pointer"
                                >
                                    enable sync to server
                                </Label>
                            </div>
                        )}
                        <Button
                            onClick={handleCreateVault}
                            disabled={isCreating || !newVaultName.trim()}
                            className="w-full"
                        >
                            {isCreating ? 'creating...' : 'choose location'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
