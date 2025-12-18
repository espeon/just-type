import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useConfigStore } from '../stores/configStore'
import { usersApi } from '@/api/users'
import { getInitials, getAvatarColor } from '@/lib/utils'

export function ProfileSettings() {
    const { userId } = useConfigStore()
    const [username, setUsername] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    useEffect(() => {
        loadProfile()
    }, [userId])

    const loadProfile = async () => {
        if (!userId) return

        try {
            setError(null)
            const user = await usersApi.getCurrentUser()
            setUsername(user.username || '')
            setDisplayName(user.display_name || '')
            setAvatarUrl(user.avatar_url || '')
        } catch (err) {
            setError('Failed to load profile')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        setError(null)
        setSuccess(null)

        try {
            await usersApi.updateProfile({
                username: username || undefined,
                display_name: displayName || undefined,
                avatar_url: avatarUrl || undefined
            })
            setSuccess('Profile updated successfully!')
            setTimeout(() => setSuccess(null), 3000)
        } catch (err) {
            setError('Failed to save profile')
            console.error(err)
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="text-sm text-muted-foreground">
                Loading profile...
            </div>
        )
    }

    const displayValue = displayName || username || 'Your Profile'
    const avatarDisplay = displayName || username

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold mb-4">profile settings</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-3 bg-green-50 text-green-700 rounded text-sm">
                        {success}
                    </div>
                )}

                <div className="flex items-start gap-6 mb-6">
                    <div
                        className={`h-16 w-16 rounded-full flex items-center justify-center text-lg font-semibold text-white flex-shrink-0 ${getAvatarColor(
                            avatarDisplay
                        )}`}
                    >
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt={displayValue}
                                className="h-full w-full rounded-full object-cover"
                            />
                        ) : (
                            getInitials(avatarDisplay)
                        )}
                    </div>

                    <div className="flex-1">
                        <p className="text-sm font-medium mb-1">
                            {displayValue}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            User ID: {userId}
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">username</Label>
                        <Input
                            id="username"
                            type="text"
                            placeholder="@yourname"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isSaving}
                        />
                        <p className="text-xs text-muted-foreground">
                            3-30 characters, alphanumeric with
                            hyphens/underscores
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="displayName">display name</Label>
                        <Input
                            id="displayName"
                            type="text"
                            placeholder="Your Name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            disabled={isSaving}
                        />
                        <p className="text-xs text-muted-foreground">
                            How others see your name
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="avatarUrl">avatar url</Label>
                        <Input
                            id="avatarUrl"
                            type="url"
                            placeholder="https://example.com/avatar.jpg"
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            disabled={isSaving}
                        />
                        <p className="text-xs text-muted-foreground">
                            Link to your profile picture
                        </p>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full"
                    >
                        {isSaving ? 'saving...' : 'save changes'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
