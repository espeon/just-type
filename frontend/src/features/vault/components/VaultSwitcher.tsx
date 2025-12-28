import { useState, useEffect } from 'react'
import { useConfigStore } from '../stores/configStore'
import { useVaultStore } from '../stores/vaultStore'
import { useStorage } from '../storage/StorageContext'
import { vaultsApi } from '@/api/vaults'
import { organizationsApi, Organization } from '@/api/organizations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
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
import { ChevronsUpDown, LucideCloud, Origami, UserIcon } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

export function VaultSwitcher() {
    const storage = useStorage()
    const {
        vaults,
        currentVaultId,
        setCurrentVault,
        addVault,
        userId,
        currentOrgContext,
        setCurrentOrgContext
    } = useConfigStore()
    const { loadVault, clearVault } = useVaultStore()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [newVaultName, setNewVaultName] = useState('')
    const [enableSync, setEnableSync] = useState(false)
    const [vaultType, setVaultType] = useState<'user' | 'org'>('user')
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [serverVaults, setServerVaults] = useState<Map<string, any>>(
        new Map()
    )

    const navi = useNavigate()

    const currentVault = vaults.find((v) => v.id === currentVaultId)

    // Filter vaults based on current org context
    const filteredVaults = vaults.filter((v) => {
        const serverVault = serverVaults.get(v.id)

        if (currentOrgContext === 'personal') {
            // Show user vaults and local vaults
            return !serverVault || serverVault.vault_type === 'user'
        } else {
            // Show vaults for selected org
            return serverVault?.org_id === currentOrgContext
        }
    })

    useEffect(() => {
        if (userId) {
            loadOrganizations()
            loadServerVaults()
        }
    }, [userId])

    async function loadOrganizations() {
        try {
            const orgs = await organizationsApi.list()
            setOrganizations(orgs)
            if (orgs.length > 0) {
                setSelectedOrgId(orgs[0].id)
            }
        } catch (error) {
            console.error('failed to load organizations:', error)
        }
    }

    async function loadServerVaults() {
        try {
            const vaultList = await vaultsApi.list()
            const vaultMap = new Map()
            vaultList.forEach((vault) => {
                vaultMap.set(vault.id, vault)
            })
            setServerVaults(vaultMap)
        } catch (error) {
            console.error('failed to load server vaults:', error)
        }
    }

    const handleSwitchVault = async (vaultId: string) => {
        setCurrentVault(vaultId)
        clearVault()
        // redirect to root to reset any open routes/files (via navigator)
        navi({ to: '/' })
        await loadVault()
    }

    const handleCreateVault = async () => {
        if (!newVaultName.trim()) return

        try {
            setIsCreating(true)

            // Org vaults don't need a local path - they're server-only
            if (enableSync && vaultType === 'org' && userId) {
                try {
                    const serverVault = await vaultsApi.create({
                        name: newVaultName,
                        vault_type: vaultType,
                        org_id: selectedOrgId || undefined
                    })

                    // Auto-add with default cache path
                    const cachePath = `~/.just-type/cache/${serverVault.id}`
                    addVault(newVaultName, cachePath, true, serverVault.id)

                    setNewVaultName('')
                    setEnableSync(false)
                    setVaultType('user')
                    setIsDialogOpen(false)
                    clearVault()
                    await loadVault()
                    navi({ to: '/' })
                } catch (error) {
                    console.error('Failed to create org vault:', error)
                    throw error
                }
            } else {
                // User vaults or local vaults need a local path
                const path = await storage.chooseVaultLocation()
                if (path) {
                    await storage.initializeVault(path)

                    let vaultId: string

                    // Create on server first if sync is enabled
                    if (enableSync && userId) {
                        try {
                            const serverVault = await vaultsApi.create({
                                name: newVaultName,
                                vault_type: vaultType,
                                org_id:
                                    vaultType === 'org'
                                        ? selectedOrgId || undefined
                                        : undefined
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
                    clearVault()
                    await loadVault()
                    navi({ to: '/' })
                }
            }
        } catch (error) {
            console.error('Failed to create vault:', error)
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <>
            {/* Organization Context Selector */}
            <Select
                value={currentOrgContext}
                onValueChange={async (value) => {
                    setCurrentOrgContext(value)

                    // Find vaults in the new context
                    const newContextVaults = vaults.filter((v) => {
                        const serverVault = serverVaults.get(v.id)
                        if (value === 'personal') {
                            return (
                                !serverVault ||
                                serverVault.vault_type === 'user'
                            )
                        } else {
                            return serverVault?.org_id === value
                        }
                    })

                    // Auto-select first vault if available, otherwise clear selection
                    if (newContextVaults.length > 0) {
                        setCurrentVault(newContextVaults[0].id)
                        clearVault()
                        await loadVault()
                    } else {
                        setCurrentVault('')
                        clearVault()
                    }

                    navi({ to: '/' })
                }}
            >
                <SelectTrigger className="w-full mb-2">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="personal">
                        <UserIcon />
                        personal
                    </SelectItem>
                    {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                            <Origami />
                            {org.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Vault Switcher */}
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

                    {filteredVaults.map((vault) => {
                        const serverVault = serverVaults.get(vault.id)
                        const isOrgVault = serverVault?.org_id

                        return (
                            <DropdownMenuItem
                                key={vault.id}
                                onClick={() => handleSwitchVault(vault.id)}
                                className="flex items-center justify-between"
                            >
                                <div className="flex flex-col flex-1">
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
                                        {isOrgVault
                                            ? serverVault?.effective_role ||
                                              'member'
                                            : vault.localPath}
                                    </span>
                                </div>
                            </DropdownMenuItem>
                        )
                    })}

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
                            <>
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
                                {enableSync && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="vault-type">
                                                vault type
                                            </Label>
                                            <Select
                                                value={vaultType}
                                                onValueChange={(value) =>
                                                    setVaultType(
                                                        value as 'user' | 'org'
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="user">
                                                        personal vault
                                                    </SelectItem>
                                                    <SelectItem value="org">
                                                        organization vault
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {vaultType === 'org' &&
                                            organizations.length > 0 && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="organization">
                                                        organization
                                                    </Label>
                                                    <Select
                                                        value={
                                                            selectedOrgId || ''
                                                        }
                                                        onValueChange={(
                                                            value
                                                        ) =>
                                                            setSelectedOrgId(
                                                                value
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {organizations.map(
                                                                (org) => (
                                                                    <SelectItem
                                                                        key={
                                                                            org.id
                                                                        }
                                                                        value={
                                                                            org.id
                                                                        }
                                                                    >
                                                                        {
                                                                            org.name
                                                                        }
                                                                    </SelectItem>
                                                                )
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                        {vaultType === 'org' &&
                                            organizations.length === 0 && (
                                                <p className="text-sm text-muted-foreground">
                                                    no organizations available.
                                                    create one in settings
                                                    first.
                                                </p>
                                            )}
                                    </>
                                )}
                            </>
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
