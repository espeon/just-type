import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { auditApi } from '@/api/audit'
import type { DocumentEdit } from '@/api/types'
import { Button } from '@/components/ui/button'
import { diffWords } from 'diff'
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '@/components/ui/popover'
import { generateHTML } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'
import { ImageUploadExtension } from '../editor/extensions/ImageUploadExtension'

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

interface EditBlock {
    id: string
    edits: DocumentEdit[]
    user: {
        username: string
        displayName: string | null | undefined
        avatarUrl: string | null | undefined
    }
    startTime: Date
    endTime: Date
}

function batchEditsIntoBlocks(
    edits: DocumentEdit[],
    windowSeconds: number = 30
): EditBlock[] {
    if (edits.length === 0) return []

    const blocks: EditBlock[] = []
    let currentBlock: EditBlock | null = null

    // Edits come in reverse chronological order (newest first)
    // So we need to calculate gaps backwards (previous edit is older)
    for (const edit of edits) {
        const editTime = new Date(edit.created_at)

        // Start a new block if:
        // 1. No current block
        // 2. Different user
        // 3. Time gap too large (current edit is >30s older than previous)
        if (
            !currentBlock ||
            currentBlock.user.username !== edit.username ||
            Math.abs(currentBlock.startTime.getTime() - editTime.getTime()) /
                1000 >
                windowSeconds
        ) {
            const newBlock: EditBlock = {
                id: edit.id,
                edits: [edit],
                user: {
                    username: edit.username || 'anonymous',
                    displayName: edit.display_name,
                    avatarUrl: edit.avatar_url
                },
                startTime: editTime,
                endTime: editTime
            }
            currentBlock = newBlock
            blocks.push(newBlock)
        } else {
            // Add to current block
            currentBlock.edits.push(edit)
            // Update start time since we're going backwards in time
            currentBlock.startTime = editTime
        }
    }

    return blocks
}

export function DocumentHistory({ docGuid, onClose }: DocumentHistoryProps) {
    const [blocks, setBlocks] = useState<EditBlock[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let mounted = true

        async function loadEdits() {
            try {
                setIsLoading(true)
                const data = await auditApi.getDocumentEdits(docGuid, {
                    limit: 100
                })
                if (mounted) {
                    setBlocks(batchEditsIntoBlocks(data))
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
                ) : !blocks || blocks.length === 0 ? (
                    <div className="flex items-center justify-center p-8">
                        <div className="text-sm text-muted-foreground">
                            no edit history yet
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2 p-4">
                        {blocks.map((block) => (
                            <BlockItem key={block.id} block={block} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function BlockItem({ block }: { block: EditBlock }) {
    const timeAgo = formatTimeAgo(block.endTime)
    const displayName =
        block.user.displayName || block.user.username || 'anonymous'
    const initials = displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    // Get first and last edit to show overall diff
    const firstEdit = block.edits[block.edits.length - 1] // oldest
    const lastEdit = block.edits[0] // newest

    const before = firstEdit.content_before || ''
    const after = lastEdit.content_after || ''
    const hasContent = before && after

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div className="rounded border cursor-pointer hover:bg-muted/50">
                    <div className="flex items-start gap-2 p-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                            {block.user.avatarUrl ? (
                                <img
                                    src={block.user.avatarUrl}
                                    alt={displayName}
                                    className="h-6 w-6 rounded-full object-cover"
                                />
                            ) : (
                                initials
                            )}
                        </div>
                        <div className="flex-1 space-y-0.5">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">
                                    {displayName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {block.edits.length} edit
                                    {block.edits.length !== 1 ? 's' : ''}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {timeAgo}
                                </span>
                            </div>
                            {hasContent && (
                                <DiffView
                                    before={before}
                                    after={after}
                                    compact
                                />
                            )}
                        </div>
                    </div>
                </div>
            </PopoverTrigger>
            {hasContent && (
                <PopoverContent
                    className="w-[800px] max-h-[600px] overflow-y-auto"
                    side="left"
                    align="start"
                >
                    <div className="space-y-2">
                        <div className="text-sm font-medium">
                            {displayName} • {block.edits.length} edit
                            {block.edits.length !== 1 ? 's' : ''} • {timeAgo}
                        </div>
                        <HtmlDiffView before={before} after={after} />
                    </div>
                </PopoverContent>
            )}
        </Popover>
    )
}

function DiffView({
    before,
    after,
    compact = false
}: {
    before: string
    after: string
    compact?: boolean
}) {
    const changes = diffWords(before, after)

    if (compact) {
        // Compact view: just show added/removed counts
        const added = changes
            .filter((c) => c.added)
            .reduce((sum, c) => sum + c.value.length, 0)
        const removed = changes
            .filter((c) => c.removed)
            .reduce((sum, c) => sum + c.value.length, 0)

        if (added === 0 && removed === 0) {
            return (
                <div className="text-xs text-muted-foreground">no changes</div>
            )
        }

        return (
            <div className="text-xs space-x-2">
                {removed > 0 && (
                    <span className="text-red-600">-{removed}</span>
                )}
                {added > 0 && <span className="text-green-600">+{added}</span>}
            </div>
        )
    }

    // Full diff view
    return (
        <div className="rounded bg-muted/50 p-2 text-xs font-mono space-y-1 max-h-48 overflow-y-auto">
            <div className="whitespace-pre-wrap break-words">
                {changes.map((change, i) => {
                    if (change.added) {
                        return (
                            <span
                                key={i}
                                className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                            >
                                {change.value}
                            </span>
                        )
                    }
                    if (change.removed) {
                        return (
                            <span
                                key={i}
                                className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 line-through"
                            >
                                {change.value}
                            </span>
                        )
                    }
                    return (
                        <span key={i} className="text-muted-foreground">
                            {change.value}
                        </span>
                    )
                })}
            </div>
        </div>
    )
}

function HtmlDiffView({ before, after }: { before: string; after: string }) {
    // Convert Yjs XML to proper HTML using Tiptap
    const xmlToHtml = (xml: string) => {
        try {
            // Parse the XML string into a simple JSON structure
            // Yjs stores content as <paragraph>text</paragraph><heading level="1">text</heading> etc
            const parser = new DOMParser()
            const doc = parser.parseFromString(`<doc>${xml}</doc>`, 'text/xml')

            // Convert to Tiptap JSON format
            const content: any[] = []
            doc.documentElement.childNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const el = node as Element
                    const tagName = el.tagName
                    const text = el.textContent || ''

                    if (tagName === 'paragraph') {
                        content.push({
                            type: 'paragraph',
                            content: text ? [{ type: 'text', text }] : []
                        })
                    } else if (tagName === 'heading') {
                        const level = parseInt(el.getAttribute('level') || '1')
                        content.push({
                            type: 'heading',
                            attrs: { level },
                            content: text ? [{ type: 'text', text }] : []
                        })
                    } else if (tagName === 'image') {
                        const src = el.getAttribute('src') || ''
                        content.push({
                            type: 'image',
                            attrs: { src }
                        })
                    } else if (tagName === 'bulletList') {
                        // Handle lists recursively
                        const items: any[] = []
                        el.childNodes.forEach((li) => {
                            if (
                                li.nodeType === Node.ELEMENT_NODE &&
                                li.nodeName === 'listItem'
                            ) {
                                items.push({
                                    type: 'listItem',
                                    content: [
                                        {
                                            type: 'paragraph',
                                            content: [
                                                {
                                                    type: 'text',
                                                    text: li.textContent || ''
                                                }
                                            ]
                                        }
                                    ]
                                })
                            }
                        })
                        content.push({ type: 'bulletList', content: items })
                    }
                }
            })

            // Generate HTML from JSON
            return generateHTML({ type: 'doc', content }, [
                StarterKit,
                ImageUploadExtension
            ])
        } catch (e) {
            console.error('Failed to parse XML:', e)
            return `<div>${xml.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`
        }
    }

    // Just convert both to HTML and show side-by-side
    const beforeHtml = xmlToHtml(before)
    const afterHtml = xmlToHtml(after)

    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                    before
                </div>
                <div
                    className="prose prose-sm prose-shadcn max-w-none rounded border p-4 bg-background"
                    dangerouslySetInnerHTML={{
                        __html: beforeHtml
                    }}
                />
            </div>
            <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                    after
                </div>
                <div
                    className="prose prose-sm prose-shadcn max-w-none rounded border p-4 bg-background"
                    dangerouslySetInnerHTML={{
                        __html: afterHtml
                    }}
                />
            </div>
        </div>
    )
}
