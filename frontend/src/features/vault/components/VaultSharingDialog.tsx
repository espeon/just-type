import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Trash2 } from 'lucide-react'
import { vaultsApi } from '@/api/vaults'
import { VaultMember } from '@/api/types'

interface VaultSharingDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    vaultId: string
}

export function VaultSharingDialog({ open, onOpenChange, vaultId }: VaultSharingDialogProps) {
    const [members, setMembers] = useState<VaultMember[]>([])
    const [newUserId, setNewUserId] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            loadMembers()
        }
    }, [open, vaultId])

    const loadMembers = async () => {
        try {
            setError(null)
            const data = await vaultsApi.listMembers(vaultId)
            setMembers(data)
        } catch (err) {
            setError('Failed to load vault members')
            console.error(err)
        }
    }

    const handleAddMember = async () => {
        if (!newUserId.trim()) return

        setIsLoading(true)
        try {
            setError(null)
            await vaultsApi.addMember(vaultId, { user_id: newUserId })
            setNewUserId('')
            await loadMembers()
        } catch (err) {
            setError('Failed to add member')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleRemoveMember = async (memberId: string) => {
        try {
            setError(null)
            await vaultsApi.removeMember(vaultId, memberId)
            await loadMembers()
        } catch (err) {
            setError('Failed to remove member')
            console.error(err)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>share vault</DialogTitle>
                    <DialogDescription>
                        invite users to collaborate on this vault
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="p-3 bg-red-50 text-red-700 rounded text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="user-id">user id</Label>
                        <div className="flex gap-2">
                            <Input
                                id="user-id"
                                placeholder="enter user id"
                                value={newUserId}
                                onChange={(e) => setNewUserId(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAddMember()
                                    }
                                }}
                            />
                            <Button
                                onClick={handleAddMember}
                                disabled={!newUserId.trim() || isLoading}
                            >
                                {isLoading ? 'adding...' : 'add'}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-medium">members</h3>
                        {members.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                                no members yet
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {members.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between p-2 border rounded text-sm"
                                    >
                                        <div className="flex-1">
                                            <p className="font-mono text-xs">
                                                {member.user_id}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {member.role}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                handleRemoveMember(member.id)
                                            }
                                            className="text-destructive hover:text-destructive h-6 w-6 p-0"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
