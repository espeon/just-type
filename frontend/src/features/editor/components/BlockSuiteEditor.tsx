import { useTiptapEditor } from '../hooks/useTiptapEditor'
import { useCollaboration } from '../hooks/useCollaboration'
import { useVaultStore } from '@/features/vault/stores/vaultStore'
import { useEffect, useRef, useState } from 'react'
import { Document } from '@/features/vault/api/vaultCommands'
import { EditorBar } from './EditorBar'
import { CollaborationDialog } from './CollaborationDialog'
import { EmojiPicker } from '@/components/ui/emoji-picker'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, X } from 'lucide-react'
import * as Y from 'yjs'
import { TiptapEditor } from './TiptapEditor'

interface BlockSuiteEditorProps {
    document: Document
}

export function BlockSuiteEditor({ document }: BlockSuiteEditorProps) {
    const { saveDocument, updateMetadata } = useVaultStore()
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const [collaborationEnabled, setCollaborationEnabled] = useState(false)
    const [userName, setUserName] = useState('')
    const [roomPassword, setRoomPassword] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [newTag, setNewTag] = useState('')
    const [descriptionValue, setDescriptionValue] = useState(
        document.metadata.description || ''
    )

    const { editor, ydoc } = useTiptapEditor({
        documentId: document.id,
        initialState: document.state
    })

    useEffect(() => {
        if (!ydoc) return

        const handleUpdate = () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current)
            }
            saveTimeoutRef.current = setTimeout(() => {
                const state = Y.encodeStateAsUpdate(ydoc)
                const encoded = btoa(String.fromCharCode(...state))
                saveDocument(document.id, encoded)
            }, 500)
        }

        ydoc.on('update', handleUpdate)

        return () => {
            ydoc.off('update', handleUpdate)
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current)
            }
        }
    }, [ydoc, document.id, saveDocument])

    const { connected, peerCount } = useCollaboration({
        ydoc: ydoc || new Y.Doc(),
        documentId: document.id,
        enabled: collaborationEnabled && !!ydoc,
        roomPassword,
        userName
    })

    const handleStartCollaboration = (name: string, password: string) => {
        setUserName(name)
        setRoomPassword(password)
        setCollaborationEnabled(true)
    }

    const handleStopCollaboration = () => {
        setCollaborationEnabled(false)
        setRoomPassword('')
    }

    return (
        <div className="h-full flex flex-col">
            <EditorBar
                editorPath={[
                    { uuid: document.id, path: document.metadata.title }
                ]}
                connected={connected}
                peerCount={peerCount}
                onToggle={() => setDialogOpen(true)}
            />
            <div className="flex-1 overflow-auto">
                <div className="max-w-4xl mx-auto">
                    <div className="p-2 my-12">
                        <div className="ml-14 mb-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <EmojiPicker
                                    value={document.metadata.icon}
                                    onSelect={async (emoji) => {
                                        console.log('picked emoji', emoji)
                                        await updateMetadata(document.id, {
                                            icon: emoji
                                        })
                                    }}
                                />
                                <h1 className="text-3xl font-bold">
                                    {document.metadata.title}
                                </h1>
                            </div>

                            <Input
                                type="text"
                                variant="underlined"
                                placeholder="add a description..."
                                value={descriptionValue}
                                onChange={(e) =>
                                    setDescriptionValue(e.target.value)
                                }
                                onBlur={async () => {
                                    if (
                                        descriptionValue !==
                                        document.metadata.description
                                    ) {
                                        await updateMetadata(document.id, {
                                            description: descriptionValue
                                        })
                                    }
                                }}
                                className="text-muted-foreground"
                            />

                            <div className="flex flex-wrap gap-2 items-center">
                                {document.metadata.tags.map((tag) => (
                                    <Badge
                                        key={tag}
                                        variant="secondary"
                                        className="gap-1"
                                    >
                                        {tag}
                                        <div
                                            onClick={async () => {
                                                const restTags =
                                                    document.metadata.tags.filter(
                                                        (t) => t !== tag
                                                    )
                                                console.log(restTags)
                                                await updateMetadata(
                                                    document.id,
                                                    {
                                                        tags: restTags
                                                    }
                                                )
                                            }}
                                        >
                                            <X className="h-3 w-3 cursor-pointer" />
                                        </div>
                                    </Badge>
                                ))}
                                <Input
                                    type="text"
                                    placeholder="add tag..."
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyDown={async (e) => {
                                        if (
                                            e.key === 'Enter' &&
                                            newTag.trim()
                                        ) {
                                            await updateMetadata(document.id, {
                                                tags: [
                                                    ...document.metadata.tags,
                                                    newTag.trim()
                                                ]
                                            })
                                            setNewTag('')
                                        }
                                    }}
                                    className="w-32 h-6 rounded-full md:text-xs"
                                />
                                <div
                                    onClick={async () => {
                                        if (!newTag.trim()) return
                                        await updateMetadata(document.id, {
                                            tags: [
                                                ...document.metadata.tags,
                                                newTag.trim()
                                            ]
                                        })
                                        setNewTag('')
                                    }}
                                >
                                    <Plus className="h-5 w-5 text-muted-foreground" />
                                </div>
                            </div>
                        </div>
                        <TiptapEditor editor={editor} />
                    </div>
                </div>
            </div>

            <CollaborationDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onStart={handleStartCollaboration}
                onStop={handleStopCollaboration}
                isCollaborating={collaborationEnabled}
            />
        </div>
    )
}
