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
import { GripVertical, Plus, X } from 'lucide-react'
import * as Y from 'yjs'
import { TiptapEditor } from './TiptapEditor'
import DragHandle from '@tiptap/extension-drag-handle-react'
import BubbleMenuComponent from './BubbleMenu'
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '@/components/ui/popover'
import { SlashCommandList } from './SlashCommandList'
import { commands } from '../extensions/SlashCommandExtension'

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
    const [commandPopoverOpen, setCommandPopoverOpen] = useState(false)
    const [insertBefore, setInsertBefore] = useState(false)
    const [dragHandleNodePos, setDragHandleNodePos] = useState<number | null>(
        null
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

    const { provider, connected, peerCount } = useCollaboration({
        ydoc: ydoc || new Y.Doc(),
        documentId: document.id,
        enabled: collaborationEnabled && !!ydoc,
        roomPassword,
        userName
    })

    useEffect(() => {
        if (!editor || !provider) return

        import('@tiptap/extension-collaboration-caret').then(
            ({ default: CollaborationCaret }) => {
                editor.extensionManager.extensions.push(
                    CollaborationCaret.configure({
                        provider,
                        user: {
                            name: userName,
                            color:
                                '#' +
                                Math.floor(Math.random() * 16777215).toString(
                                    16
                                )
                        }
                    })
                )
            }
        )
    }, [editor, provider, userName])

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
                        <div className="ml-6 mb-4 space-y-3">
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
                        <DragHandle
                            editor={editor}
                            computePositionConfig={{ placement: 'left' }}
                            className="-ml-4 flex"
                            onNodeChange={({ node, pos }) => {
                                if (node) {
                                    setDragHandleNodePos(pos)
                                }
                            }}
                        >
                            <Popover
                                open={commandPopoverOpen}
                                onOpenChange={setCommandPopoverOpen}
                            >
                                <PopoverTrigger asChild>
                                    <Plus
                                        className="h-full text-muted-foreground cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setInsertBefore(e.shiftKey)
                                            setCommandPopoverOpen(true)
                                        }}
                                    />
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-64 p-0"
                                    align="start"
                                >
                                    <SlashCommandList
                                        items={commands.map((cmd) => ({
                                            ...cmd,
                                            command: (editor: any) => {
                                                if (
                                                    !editor ||
                                                    dragHandleNodePos === null
                                                )
                                                    return

                                                const { doc } = editor.state
                                                const node =
                                                    doc.nodeAt(
                                                        dragHandleNodePos
                                                    )
                                                if (!node) return

                                                // calculate position before or after the node
                                                const pos = insertBefore
                                                    ? dragHandleNodePos
                                                    : dragHandleNodePos +
                                                      node.nodeSize

                                                // create content based on command type
                                                let content: any
                                                if (
                                                    cmd.title.includes(
                                                        'Heading'
                                                    )
                                                ) {
                                                    const level = parseInt(
                                                        cmd.title.split(' ')[1]
                                                    )
                                                    content = {
                                                        type: 'heading',
                                                        attrs: { level }
                                                    }
                                                } else if (
                                                    cmd.title === 'Paragraph'
                                                ) {
                                                    content = {
                                                        type: 'paragraph'
                                                    }
                                                } else if (
                                                    cmd.title === 'Bullet List'
                                                ) {
                                                    content = {
                                                        type: 'bulletList',
                                                        content: [
                                                            {
                                                                type: 'listItem',
                                                                content: [
                                                                    {
                                                                        type: 'paragraph'
                                                                    }
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                } else if (
                                                    cmd.title ===
                                                    'Numbered List'
                                                ) {
                                                    content = {
                                                        type: 'orderedList',
                                                        content: [
                                                            {
                                                                type: 'listItem',
                                                                content: [
                                                                    {
                                                                        type: 'paragraph'
                                                                    }
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                } else if (
                                                    cmd.title === 'Code Block'
                                                ) {
                                                    content = {
                                                        type: 'codeBlock'
                                                    }
                                                } else if (
                                                    cmd.title === 'Blockquote'
                                                ) {
                                                    content = {
                                                        type: 'blockquote',
                                                        content: [
                                                            {
                                                                type: 'paragraph'
                                                            }
                                                        ]
                                                    }
                                                } else if (
                                                    cmd.title === 'Divider'
                                                ) {
                                                    content = {
                                                        type: 'horizontalRule'
                                                    }
                                                } else if (
                                                    cmd.title === 'Columns'
                                                ) {
                                                    editor
                                                        .chain()
                                                        .focus()
                                                        .setColumns()
                                                        .run()
                                                    return
                                                }

                                                editor
                                                    .chain()
                                                    .focus()
                                                    .insertContentAt(
                                                        pos,
                                                        content
                                                    )
                                                    .run()
                                            }
                                        }))}
                                        command={() => {}}
                                        onSelect={(cmd) => {
                                            cmd.command(editor)
                                            setCommandPopoverOpen(false)
                                        }}
                                        showSearch={true}
                                    />
                                </PopoverContent>
                            </Popover>
                            <GripVertical className="h-full text-muted-foreground" />
                        </DragHandle>
                        <BubbleMenuComponent editor={editor} />
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
