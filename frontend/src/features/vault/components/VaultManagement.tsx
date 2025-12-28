import { useState, useEffect } from 'react'
import { useConfigStore } from '../stores/configStore'
import { useVaultStore } from '../stores/vaultStore'
import { vaultsApi } from '@/api/vaults'
import { organizationsApi, Organization } from '@/api/organizations'
import { VaultSharingDialog } from './VaultSharingDialog'
import { Button } from '@/components/ui/button'
import { Trash2, Share2, Cloud, Lock, ArrowRightToLine } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { syncImagesToServer } from '@/lib/storage/image-sync'
import * as Y from 'yjs'

export function VaultManagement() {
    const {
        vaults,
        currentVaultId,
        removeVault,
        setCurrentVault,
        updateVault,
        userId
    } = useConfigStore()
    const { loadVault } = useVaultStore()
    const [vaultToDelete, setVaultToDelete] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isTogglingSync, setIsTogglingSync] = useState<string | null>(null)
    const [sharingVaultId, setSharingVaultId] = useState<string | null>(null)
    const [transferVaultId, setTransferVaultId] = useState<string | null>(null)
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [isTransferring, setIsTransferring] = useState(false)
    const [serverVaults, setServerVaults] = useState<Map<string, any>>(
        new Map()
    )

    useEffect(() => {
        if (userId) {
            loadOrganizations()
            loadServerVaults()
        }
    }, [userId])

    async function loadServerVaults() {
        try {
            const vaultList = await vaultsApi.list()
            const vaultMap = new Map()
            vaultList.forEach((vault) => {
                vaultMap.set(vault.id, vault)
            })
            setServerVaults(vaultMap)
        } catch (error) {
            console.error('Failed to load server vaults:', error)
        }
    }

    async function loadOrganizations() {
        try {
            const orgs = await organizationsApi.list()
            // Filter to only orgs where user is admin
            const adminOrgs = []
            for (const org of orgs) {
                const members = await organizationsApi.listMembers(org.id)
                const userMember = members.find((m) => m.user_id === userId)
                if (userMember?.role === 'admin') {
                    adminOrgs.push(org)
                }
            }
            setOrganizations(adminOrgs)
            if (adminOrgs.length > 0) {
                setSelectedOrgId(adminOrgs[0].id)
            }
        } catch (error) {
            console.error('Failed to load organizations:', error)
        }
    }

    const handleToggleSync = async (vaultId: string) => {
        const vault = vaults.find((v) => v.id === vaultId)
        if (!vault) return

        setIsTogglingSync(vaultId)
        try {
            if (vault.syncEnabled) {
                // Disable sync
                updateVault(vaultId, { syncEnabled: false })
            } else {
                // Enable sync - need to create on server first
                if (!userId) {
                    alert('you must be logged in to enable sync')
                    return
                }

                try {
                    const serverVault = await vaultsApi.create({
                        name: vault.name
                    })

                    // Verify the vault was created successfully on the server
                    await vaultsApi.get(serverVault.id)

                    // Sync all local images to server before enabling sync
                    console.log('Syncing images to server...')
                    const { structure, storage } = useVaultStore.getState()
                    if (structure && storage && vault.localPath) {
                        let totalImagesSynced = 0

                        // Iterate through all documents in the vault
                        for (const docMeta of structure.documents) {
                            try {
                                // Load the document from storage
                                const doc = await storage.readDocument(
                                    vault.localPath,
                                    docMeta.id
                                )

                                // Parse the Yjs state
                                const ydoc = new Y.Doc()
                                if (doc.state) {
                                    const update = new Uint8Array(
                                        atob(doc.state)
                                            .split('')
                                            .map((c) => c.charCodeAt(0))
                                    )
                                    Y.applyUpdate(ydoc, update)
                                }

                                const imagesSynced =
                                    await syncImagesToServer(ydoc)
                                totalImagesSynced += imagesSynced

                                // Save updated document state if images were synced
                                if (imagesSynced > 0) {
                                    const updatedState = btoa(
                                        String.fromCharCode(
                                            ...Y.encodeStateAsUpdate(ydoc)
                                        )
                                    )
                                    await storage.writeDocument(
                                        vault.localPath,
                                        docMeta.id,
                                        doc.metadata,
                                        updatedState
                                    )
                                }
                            } catch (error) {
                                console.error(
                                    `Failed to sync images in document ${docMeta.id}:`,
                                    error
                                )
                            }
                        }

                        if (totalImagesSynced > 0) {
                            console.log(
                                `Synced ${totalImagesSynced} images to server`
                            )
                        }
                    }

                    // Create new vault with server ID
                    const newVault = {
                        ...vault,
                        id: serverVault.id,
                        syncEnabled: true
                    }

                    // Update vaults list with new vault
                    useConfigStore.setState((state) => ({
                        vaults: state.vaults.map((v) =>
                            v.id === vaultId ? newVault : v
                        ),
                        // Update currentVaultId if this was the current vault
                        currentVaultId:
                            state.currentVaultId === vaultId
                                ? serverVault.id
                                : state.currentVaultId
                    }))
                } catch (error) {
                    console.error('Failed to create vault on server:', error)
                    alert('Failed to enable sync on server')
                }
            }
        } catch (error) {
            console.error('Failed to toggle sync:', error)
        } finally {
            setIsTogglingSync(null)
        }
    }

    const handleTransferVault = async () => {
        if (!transferVaultId || !selectedOrgId) return

        setIsTransferring(true)
        try {
            await vaultsApi.transferToOrg(transferVaultId, selectedOrgId)

            // Reload vault list to reflect the change
            await useConfigStore.getState().syncServerVaults()

            setTransferVaultId(null)
            alert('Vault transferred to organization successfully')
        } catch (error) {
            console.error('Failed to transfer vault:', error)
            alert('Failed to transfer vault to organization')
        } finally {
            setIsTransferring(false)
        }
    }

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

    // Group vaults by organization
    const personalVaults = vaults.filter((v) => {
        const serverVault = serverVaults.get(v.id)
        return !serverVault || serverVault.vault_type === 'user'
    })

    const orgVaultGroups = new Map<string, typeof vaults>()
    vaults.forEach((v) => {
        const serverVault = serverVaults.get(v.id)
        if (serverVault?.org_id) {
            if (!orgVaultGroups.has(serverVault.org_id)) {
                orgVaultGroups.set(serverVault.org_id, [])
            }
            orgVaultGroups.get(serverVault.org_id)!.push(v)
        }
    })

    const renderVault = (vault: (typeof vaults)[0]) => (
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
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleSync(vault.id)}
                        disabled={isTogglingSync === vault.id}
                        className="h-8 px-2 text-xs"
                        title={
                            vault.syncEnabled ? 'disable sync' : 'enable sync'
                        }
                    >
                        {vault.syncEnabled ? (
                            <>
                                <Cloud className="h-4 w-4 mr-1" />
                                disable
                            </>
                        ) : (
                            <>
                                <Lock className="h-4 w-4 mr-1" />
                                enable
                            </>
                        )}
                    </Button>
                    {vault.syncEnabled && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSharingVaultId(vault.id)}
                                className="h-8 w-8 p-0"
                                title="share vault"
                            >
                                <Share2 className="h-4 w-4" />
                            </Button>
                            {organizations.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setTransferVaultId(vault.id)}
                                    className="h-8 w-8 p-0"
                                    title="transfer to organization"
                                >
                                    <ArrowRightToLine className="h-4 w-4" />
                                </Button>
                            )}
                        </>
                    )}
                    {currentVaultId !== vault.id && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setVaultToDelete(vault.id)}
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                            title="remove vault"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">vaults</h2>

            {/* Personal vaults */}
            {personalVaults.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                        personal
                    </h3>
                    <div className="space-y-3">
                        {personalVaults.map(renderVault)}
                    </div>
                </div>
            )}

            {/* Organization vaults */}
            {Array.from(orgVaultGroups.entries()).map(([orgId, orgVaults]) => {
                const org = organizations.find((o) => o.id === orgId)
                return (
                    <div key={orgId} className="mb-6">
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">
                            {org?.name || orgId}
                        </h3>
                        <div className="space-y-3">
                            {orgVaults.map(renderVault)}
                        </div>
                    </div>
                )
            })}

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

            <Dialog
                open={!!transferVaultId}
                onOpenChange={(open) => !open && setTransferVaultId(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            transfer vault to organization
                        </DialogTitle>
                        <DialogDescription>
                            this will transfer ownership of the vault to an
                            organization. all org members will have access based
                            on their role.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                organization
                            </label>
                            <Select
                                value={selectedOrgId || ''}
                                onValueChange={(value) =>
                                    setSelectedOrgId(value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="select organization" />
                                </SelectTrigger>
                                <SelectContent>
                                    {organizations.map((org) => (
                                        <SelectItem key={org.id} value={org.id}>
                                            {org.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setTransferVaultId(null)}
                                disabled={isTransferring}
                            >
                                cancel
                            </Button>
                            <Button
                                onClick={handleTransferVault}
                                disabled={isTransferring || !selectedOrgId}
                            >
                                {isTransferring
                                    ? 'transferring...'
                                    : 'transfer'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
