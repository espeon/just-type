import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { auditApi } from '@/api/audit'
import type { DocumentEdit } from '@/api/types'
import { Button } from '@/components/ui/button'

interface DocumentHistoryProps {
    docGuid: string
    onClose: () => void
}

function formatTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`
    return `${Math.floor(seconds / 2592000)}mo ago`
}

export function DocumentHistory({ docGuid, onClose }: DocumentHistoryProps) {
    const [edits, setEdits] = useState<DocumentEdit[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let mounted = true

        async function loadEdits() {
            try {
                setIsLoading(true)
                const data = await auditApi.getDocumentEdits(docGuid, {
                    limit: 50
                })
                if (mounted) {
                    setEdits(data)
                }
            } catch (error) {
                console.error('Failed to load document edits:', error)
            } finally {
                if (mounted) {
                    setIsLoading(false)
                }
            }
        }

        loadEdits()

        return () => {
            mounted = false
        }
    }, [docGuid])

    return (
        <div className="flex h-full flex-col border-l bg-background">
            <div className="flex items-center justify-between border-b px-4 py-3">
                <h2 className="text-sm font-semibold">document history</h2>
                <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                        <div className="text-sm text-muted-foreground">
                            loading history...
                        </div>
                    </div>
                ) : !edits || edits.length === 0 ? (
                    <div className="flex items-center justify-center p-8">
                        <div className="text-sm text-muted-foreground">
                            no edit history yet
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2 p-4">
                        {edits.map((edit) => (
                            <EditItem key={edit.id} edit={edit} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function EditItem({ edit }: { edit: DocumentEdit }) {
    const timeAgo = formatTimeAgo(new Date(edit.created_at))
    const displayName = edit.display_name || edit.username || 'anonymous'
    const initials = displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    const showDiff = edit.content_before && edit.content_after

    return (
        <div className="flex items-start gap-3 rounded-lg border p-3 text-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                {edit.avatar_url ? (
                    <img
                        src={edit.avatar_url}
                        alt={displayName}
                        className="h-8 w-8 rounded-full object-cover"
                    />
                ) : (
                    initials
                )}
            </div>
            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{displayName}</span>
                    <span className="text-xs capitalize text-muted-foreground">
                        {edit.edit_type || 'edited'}
                    </span>
                    {edit.block_type && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                            {edit.block_type}
                        </span>
                    )}
                </div>
                {showDiff ? (
                    <DiffView
                        before={edit.content_before!}
                        after={edit.content_after!}
                    />
                ) : edit.content_after ? (
                    <div className="line-clamp-2 text-xs text-muted-foreground">
                        {edit.content_after}
                    </div>
                ) : null}
                <div className="text-xs text-muted-foreground">{timeAgo}</div>
            </div>
        </div>
    )
}

function DiffView({ before, after }: { before: string; after: string }) {
    // Simple word-level diff highlighting
    const beforeWords = before.split(/\s+/)
    const afterWords = after.split(/\s+/)

    // Find added/removed words (simple approach)
    const removed = beforeWords.filter((w) => !afterWords.includes(w))
    const added = afterWords.filter((w) => !beforeWords.includes(w))

    if (removed.length === 0 && added.length === 0) {
        // No word-level changes, show character diff summary
        return (
            <div className="text-xs text-muted-foreground">
                {after.length > before.length
                    ? `+${after.length - before.length} chars`
                    : `${after.length - before.length} chars`}
            </div>
        )
    }

    return (
        <div className="space-y-1 text-xs">
            {removed.length > 0 && (
                <div className="line-clamp-1">
                    <span className="text-red-600">- {removed.join(' ')}</span>
                </div>
            )}
            {added.length > 0 && (
                <div className="line-clamp-1">
                    <span className="text-green-600">+ {added.join(' ')}</span>
                </div>
            )}
        </div>
    )
}
