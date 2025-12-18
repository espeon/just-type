import { useState } from 'react'
import { useConfigStore } from '@/features/vault/stores/configStore'
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

interface AuthDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
    const { login, register } = useConfigStore()
    const [mode, setMode] = useState<'login' | 'register'>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            if (mode === 'login') {
                await login(email, password)
            } else {
                await register(
                    email,
                    password,
                    username || undefined,
                    displayName || undefined
                )
            }
            onOpenChange(false)
            setEmail('')
            setPassword('')
            setUsername('')
            setDisplayName('')
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'authentication failed'
            )
        } finally {
            setIsLoading(false)
        }
    }

    const toggleMode = () => {
        setMode(mode === 'login' ? 'register' : 'login')
        setError(null)
        setUsername('')
        setDisplayName('')
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'login' ? 'login' : 'create account'}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'login'
                            ? 'sign in to sync your vaults'
                            : 'create an account to sync across devices'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    {mode === 'register' && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="username">
                                    username (optional)
                                </Label>
                                <Input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) =>
                                        setUsername(e.target.value)
                                    }
                                    placeholder="@yourname"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="displayName">
                                    display name (optional)
                                </Label>
                                <Input
                                    id="displayName"
                                    type="text"
                                    value={displayName}
                                    onChange={(e) =>
                                        setDisplayName(e.target.value)
                                    }
                                    placeholder="Your Name"
                                />
                            </div>
                        </>
                    )}
                    {error && (
                        <div className="text-sm text-destructive">{error}</div>
                    )}
                    <div className="flex flex-col gap-2">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading
                                ? mode === 'login'
                                    ? 'signing in...'
                                    : 'creating account...'
                                : mode === 'login'
                                  ? 'sign in'
                                  : 'create account'}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={toggleMode}
                        >
                            {mode === 'login'
                                ? 'need an account? register'
                                : 'have an account? sign in'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
