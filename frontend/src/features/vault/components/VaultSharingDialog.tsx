import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'
import { Trash2 } from 'lucide-react'
import { vaultsApi } from '@/api/vaults'
import { usersApi } from '@/api/users'
import { VaultMemberWithProfile, PublicUserProfile } from '@/api/types'
import { getInitials, getAvatarColor } from '@/lib/utils'

interface VaultSharingDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    vaultId: string
}

export function VaultSharingDialog({
    open,
    onOpenChange,
    vaultId
}: VaultSharingDialogProps) {
    const [members, setMembers] = useState<VaultMemberWithProfile[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<PublicUserProfile[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
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

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchQuery.trim()) {
            setSearchResults([])
            return
        }

        setIsSearching(true)
        try {
            setError(null)
            const results = await usersApi.searchUsers(searchQuery)
            setSearchResults(results)
        } catch (err) {
            setError('Failed to search users')
            console.error(err)
        } finally {
            setIsSearching(false)
        }
    }

    const handleAddMember = async (userId: string) => {
        setIsLoading(true)
        try {
            setError(null)
            await vaultsApi.addMember(vaultId, { user_id: userId })
            setSearchQuery('')
            setSearchResults([])
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

    const getDisplayName = (member: VaultMemberWithProfile): string => {
        return member.display_name || member.username || 'Unknown User'
    }

    const getUsername = (member: VaultMemberWithProfile): string => {
        return member.username ? `@${member.username}` : member.user_id
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
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
                    <form onSubmit={handleSearch} className="space-y-2">
                        <Label htmlFor="search">search by username</Label>
                        <div className="flex gap-2">
                            <Input
                                id="search"
                                placeholder="search for user..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Button
                                type="submit"
                                disabled={!searchQuery.trim() || isSearching}
                            >
                                {isSearching ? 'searching...' : 'search'}
                            </Button>
                        </div>
                    </form>

                    {searchResults.length > 0 && (
                        <div className="space-y-2 border rounded p-3 bg-slate-50">
                            <p className="text-xs font-medium text-muted-foreground">
                                found {searchResults.length} user
                                {searchResults.length !== 1 ? 's' : ''}
                            </p>
                            <div className="space-y-1">
                                {searchResults.map((user) => {
                                    const isAlreadyMember = members.some(
                                        (m) => m.user_id === user.id
                                    )
                                    return (
                                        <div
                                            key={user.id}
                                            className="flex items-center gap-2 p-2 border rounded hover:bg-white transition"
                                        >
                                            <div
                                                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold text-white ${getAvatarColor(
                                                    user.display_name ||
                                                        user.username
                                                )}`}
                                            >
                                                {user.avatar_url ? (
                                                    <img
                                                        src={user.avatar_url}
                                                        alt={
                                                            user.display_name ||
                                                            user.username ||
                                                            'User'
                                                        }
                                                        className="h-full w-full rounded-full object-cover"
                                                    />
                                                ) : (
                                                    getInitials(
                                                        user.display_name ||
                                                            user.username
                                                    )
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {user.display_name ||
                                                        user.username ||
                                                        'Unknown User'}
                                                </p>
                                                {user.username && (
                                                    <p className="text-xs text-muted-foreground font-mono">
                                                        @{user.username}
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                size="sm"
                                                variant={
                                                    isAlreadyMember
                                                        ? 'outline'
                                                        : 'default'
                                                }
                                                disabled={
                                                    isAlreadyMember || isLoading
                                                }
                                                onClick={() =>
                                                    handleAddMember(user.id)
                                                }
                                            >
                                                {isAlreadyMember
                                                    ? 'added'
                                                    : 'add'}
                                            </Button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

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
                                        className="flex items-center gap-2 p-2 border rounded text-sm hover:bg-slate-50 transition"
                                    >
                                        <div
                                            className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0 ${getAvatarColor(
                                                member.display_name ||
                                                    member.username
                                            )}`}
                                        >
                                            {member.avatar_url ? (
                                                <img
                                                    src={member.avatar_url}
                                                    alt={getDisplayName(member)}
                                                    className="h-full w-full rounded-full object-cover"
                                                />
                                            ) : (
                                                getInitials(
                                                    member.display_name ||
                                                        member.username
                                                )
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">
                                                {getDisplayName(member)}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span className="font-mono truncate">
                                                    {getUsername(member)}
                                                </span>
                                                <span className="text-xs px-1 bg-slate-200 rounded">
                                                    {member.role}
                                                </span>
                                            </div>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                handleRemoveMember(member.id)
                                            }
                                            className="text-destructive hover:text-destructive h-6 w-6 p-0 flex-shrink-0"
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
