import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CollaborationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onStart: (userName: string, password: string) => void
    onStop: () => void
    isCollaborating: boolean
}

export function CollaborationDialog({
    open,
    onOpenChange,
    onStart,
    onStop,
    isCollaborating
}: CollaborationDialogProps) {
    const [userName, setUserName] = useState('')
    const [password, setPassword] = useState('')

    const handleStart = () => {
        if (userName.trim() && password.trim()) {
            onStart(userName.trim(), password.trim())
            onOpenChange(false)
        }
    }

    const handleStop = () => {
        onStop()
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isCollaborating
                            ? 'Collaboration Active'
                            : 'Start Collaboration'}
                    </DialogTitle>
                    <DialogDescription>
                        {isCollaborating
                            ? 'Share the room password with others to collaborate on this document.'
                            : 'Enter your name and a room password to start collaborating.'}
                    </DialogDescription>
                </DialogHeader>

                {isCollaborating ? (
                    <div className="space-y-4">
                        <div>
                            <Label>Room Password</Label>
                            <div className="mt-2 p-3 bg-muted rounded font-mono text-sm">
                                {password || '••••••••'}
                            </div>
                        </div>
                        <Button
                            onClick={handleStop}
                            variant="destructive"
                            className="w-full"
                        >
                            Stop Collaboration
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="userName">Your Name</Label>
                            <Input
                                id="userName"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                placeholder="Enter your name"
                                onKeyDown={(e) =>
                                    e.key === 'Enter' && handleStart()
                                }
                            />
                        </div>
                        <div>
                            <Label htmlFor="password">Room Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter a shared password"
                                onKeyDown={(e) =>
                                    e.key === 'Enter' && handleStart()
                                }
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Share this password with others to join the same
                                room
                            </p>
                        </div>
                        <Button
                            onClick={handleStart}
                            disabled={!userName.trim() || !password.trim()}
                            className="w-full"
                        >
                            Start Collaboration
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
