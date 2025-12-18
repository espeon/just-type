import { useVaultStore } from '../stores/vaultStore'
import { Button } from '@/components/ui/button'
import { Plus, X, ChevronDown, FolderPlus } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Document, DocumentStructure } from '../api/vaultCommands'
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSeparator
} from '@/components/ui/context-menu'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    useDroppable
} from '@dnd-kit/core'
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import twemoji from '@twemoji/api'

interface DocumentItemProps {
    doc: Document
    depth: number
    isExpanded: boolean
    hasChildren: boolean
    isRenaming: boolean
    onToggle: () => void
    onNavigate: (id: string) => void
    onDelete: (id: string) => void
    onCreateChild: (parentId: string) => void
    onConvertToFolder: (id: string) => void
    onRename: (id: string, newTitle: string) => void
    onCancelRename: () => void
}

function DocumentItem({
    doc,
    depth,
    isExpanded,
    hasChildren,
    isRenaming,
    onToggle,
    onNavigate,
    onDelete,
    onCreateChild,
    onConvertToFolder,
    onRename,
    onCancelRename
}: DocumentItemProps) {
    const isFolder = doc.metadata.type === 'folder' || hasChildren
    const icon = doc.metadata.icon || (isFolder ? '📁' : '📄')
    const [renameValue, setRenameValue] = useState(doc.metadata.title)

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: doc.id })

    const { setNodeRef: setDroppableRef, isOver } = useDroppable({
        id: `folder-${doc.id}`,
        disabled: !isFolder
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        paddingLeft: `${depth * 12 + 8}px`
    }

    return (
        <div
            ref={(node) => {
                setNodeRef(node)
                setDroppableRef(node)
            }}
            style={style}
            className={`${isOver && isFolder ? 'bg-muted' : ''}`}
        >
            <ContextMenu>
                <ContextMenuTrigger asChild>
                    <div
                        className="flex items-center justify-between group pr-2 py-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing"
                        {...attributes}
                        {...listeners}
                    >
                        <div
                            className="flex items-center gap-2 flex-1 min-w-0"
                            onClick={(e) => {
                                e.stopPropagation()
                                if (isRenaming) return
                                if (isFolder) {
                                    onToggle()
                                } else {
                                    onNavigate(doc.id)
                                }
                            }}
                        >
                            <span
                                {...listeners}
                                className="cursor-grab active:cursor-grabbing"
                            >
                                {/* TODO: if there is no folders don't offset */}
                                {hasChildren ? (
                                    <span className="text-muted-foreground">
                                        <ChevronDown
                                            className={`h-3 w-3 ${isExpanded ? '' : '-rotate-90'} transition-all duration-250 ease-in-out`}
                                        />
                                    </span>
                                ) : (
                                    <div className="min-w-3 w-3" />
                                )}
                            </span>
                            <div
                                className="h-max min-w-[1em] p-0 emoji-size"
                                dangerouslySetInnerHTML={{
                                    __html: twemoji.parse(icon)
                                }}
                            />
                            {isRenaming ? (
                                <input
                                    type="text"
                                    value={renameValue}
                                    onChange={(e) =>
                                        setRenameValue(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            onRename(doc.id, renameValue)
                                        } else if (e.key === 'Escape') {
                                            onCancelRename()
                                        }
                                    }}
                                    onBlur={() => {
                                        if (renameValue.trim()) {
                                            onRename(doc.id, renameValue)
                                        } else {
                                            onCancelRename()
                                        }
                                    }}
                                    className="flex-1 px-1 py-0 text-sm border rounded min-w-0"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <span className="text-sm truncate">
                                    {doc.metadata.title}
                                </span>
                            )}
                        </div>
                        {!isRenaming && (
                            <Button
                                key={'delete-btn-' + doc.id}
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onDelete(doc.id)
                                }}
                            >
                                <X className="h-4 max-w-0 group-hover:max-w-4" />
                            </Button>
                        )}
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuItem onClick={() => onCreateChild(doc.id)}>
                        <Plus className="h-4 w-4 mr-2" />
                        new document inside
                    </ContextMenuItem>
                    {!isFolder && (
                        <ContextMenuItem
                            onClick={() => onConvertToFolder(doc.id)}
                        >
                            <FolderPlus className="h-4 w-4 mr-2" />
                            convert to folder
                        </ContextMenuItem>
                    )}
                    <ContextMenuSeparator />
                    <ContextMenuItem
                        onClick={() => onDelete(doc.id)}
                        className="text-destructive"
                    >
                        <X className="h-4 w-4 mr-2" />
                        delete
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        </div>
    )
}

interface DocumentTreeNodeProps {
    doc: Document
    depth: number
    childrenMap: Map<string, Document[]>
    expandedFolders: Set<string>
    renamingId: string | null
    onToggle: (id: string) => void
    onNavigate: (id: string) => void
    onDelete: (id: string) => void
    onCreateChild: (parentId: string) => void
    onConvertToFolder: (id: string) => void
    onRename: (id: string, newTitle: string) => void
    onCancelRename: () => void
}

function DocumentTreeNode({
    doc,
    depth,
    childrenMap,
    expandedFolders,
    renamingId,
    onToggle,
    onNavigate,
    onDelete,
    onCreateChild,
    onConvertToFolder,
    onRename,
    onCancelRename
}: DocumentTreeNodeProps) {
    const children = childrenMap.get(doc.id) || []
    const hasChildren = children.length > 0
    const isExpanded = expandedFolders.has(doc.id)

    return (
        <>
            {hasChildren && isExpanded ? (
                <SortableContext
                    items={children.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <DocumentItem
                        doc={doc}
                        depth={depth}
                        isExpanded={isExpanded}
                        hasChildren={hasChildren}
                        isRenaming={renamingId === doc.id}
                        onToggle={() => onToggle(doc.id)}
                        onNavigate={onNavigate}
                        onDelete={onDelete}
                        onCreateChild={onCreateChild}
                        onConvertToFolder={onConvertToFolder}
                        onRename={onRename}
                        onCancelRename={onCancelRename}
                    />
                    {children.map((child) => (
                        <DocumentTreeNode
                            key={child.id}
                            doc={child}
                            depth={depth + 1}
                            childrenMap={childrenMap}
                            expandedFolders={expandedFolders}
                            renamingId={renamingId}
                            onToggle={onToggle}
                            onNavigate={onNavigate}
                            onDelete={onDelete}
                            onCreateChild={onCreateChild}
                            onConvertToFolder={onConvertToFolder}
                            onRename={onRename}
                            onCancelRename={onCancelRename}
                        />
                    ))}
                </SortableContext>
            ) : (
                <DocumentItem
                    doc={doc}
                    depth={depth}
                    isExpanded={isExpanded}
                    hasChildren={hasChildren}
                    isRenaming={renamingId === doc.id}
                    onToggle={() => onToggle(doc.id)}
                    onNavigate={onNavigate}
                    onDelete={onDelete}
                    onCreateChild={onCreateChild}
                    onConvertToFolder={onConvertToFolder}
                    onRename={onRename}
                    onCancelRename={onCancelRename}
                />
            )}
        </>
    )
}

export function FileExplorer() {
    const {
        documents,
        structure,
        createDocument,
        deleteDocument,
        updateMetadata,
        updateDocumentStructure
    } = useVaultStore()
    const navigate = useNavigate()
    const [newDocTitle, setNewDocTitle] = useState('')
    const [showNewDoc, setShowNewDoc] = useState(false)
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
        new Set()
    )
    const [renamingId, setRenamingId] = useState<string | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8
            }
        }),
        useSensor(KeyboardSensor)
    )

    // organize documents into tree structure
    const documentTree = useMemo(() => {
        const rootDocs: Document[] = []
        const childrenMap = new Map<string, Document[]>()

        documents.forEach((doc) => {
            if (doc.metadata.parentId) {
                const siblings = childrenMap.get(doc.metadata.parentId) || []
                siblings.push(doc)
                childrenMap.set(doc.metadata.parentId, siblings)
            } else {
                rootDocs.push(doc)
            }
        })

        // sort by order from structure
        const sortByStructure = (docs: Document[]) => {
            if (!structure) return docs

            return docs.sort((a, b) => {
                const structA = structure.documents.find((s) => s.id === a.id)
                const structB = structure.documents.find((s) => s.id === b.id)
                const orderA = structA?.order ?? Infinity
                const orderB = structB?.order ?? Infinity
                return orderA - orderB
            })
        }

        sortByStructure(rootDocs)
        childrenMap.forEach((children) => sortByStructure(children))

        return { rootDocs, childrenMap }
    }, [documents, structure])

    const toggleFolder = (folderId: string) => {
        setExpandedFolders((prev) => {
            const next = new Set(prev)
            if (next.has(folderId)) {
                next.delete(folderId)
            } else {
                next.add(folderId)
            }
            return next
        })
    }

    const handleCreateDocument = async () => {
        if (!newDocTitle.trim()) return

        try {
            const doc = await createDocument(newDocTitle)
            setNewDocTitle('')
            setShowNewDoc(false)
            navigate({ to: '/doc/$docId', params: { docId: doc.id } })
        } catch (error) {
            console.error('Failed to create document:', error)
        }
    }

    const handleCreateChild = async (parentId: string) => {
        try {
            const doc = await createDocument('untitled')
            await updateMetadata(doc.id, { parentId })
            setExpandedFolders((prev) => new Set(prev).add(parentId))
            setRenamingId(doc.id)
        } catch (error) {
            console.error('Failed to create child document:', error)
        }
    }

    const handleConvertToFolder = async (id: string) => {
        try {
            await updateMetadata(id, { type: 'folder' })
            setExpandedFolders((prev) => new Set(prev).add(id))
        } catch (error) {
            console.error('Failed to convert to folder:', error)
        }
    }

    const handleCreateFolder = async () => {
        try {
            const doc = await createDocument('untitled folder')
            await updateMetadata(doc.id, { type: 'folder' })
            setExpandedFolders((prev) => new Set(prev).add(doc.id))
            setRenamingId(doc.id)
        } catch (error) {
            console.error('Failed to create folder:', error)
        }
    }

    const handleRename = async (id: string, newTitle: string) => {
        if (!newTitle.trim()) {
            await deleteDocument(id)
            setRenamingId(null)
            return
        }

        try {
            await updateMetadata(id, { title: newTitle })
            setRenamingId(null)
        } catch (error) {
            console.error('Failed to rename document:', error)
        }
    }

    const handleCancelRename = async () => {
        if (renamingId) {
            const doc = documents.find((d) => d.id === renamingId)
            if (
                doc &&
                (doc.metadata.title === 'untitled' ||
                    doc.metadata.title === 'untitled folder')
            ) {
                await deleteDocument(renamingId)
            }
            setRenamingId(null)
        }
    }

    const handleDragStart = (event: DragStartEvent) => {
        console.log('Drag started:', event.active.id)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        console.log('Drag end called:', {
            activeId: active.id,
            overId: over?.id,
            hasOver: !!over
        })

        if (!over || active.id === over.id) {
            console.log('Bailing: no over or same id')
            return
        }

        const activeDoc = documents.find((d) => d.id === active.id)
        if (!activeDoc) {
            console.log('Bailing: no active doc found')
            return
        }

        console.log('Processing drop:', {
            activeId: active.id,
            overId: over.id
        })

        // check if dropped on a folder
        if (over.id.toString().startsWith('folder-')) {
            console.log('Detected folder drop')
            const folderId = over.id.toString().replace('folder-', '')
            if (folderId !== activeDoc.id) {
                console.log('Moving into folder:', folderId)
                // move into folder
                await updateMetadata(activeDoc.id, { parentId: folderId })
                setExpandedFolders((prev) => new Set(prev).add(folderId))
            }
            return
        }

        // reordering within same parent
        const overDoc = documents.find((d) => d.id === over.id)
        console.log('Looking for over doc:', {
            overId: over.id,
            found: !!overDoc
        })

        if (!overDoc) {
            console.log('Bailing: no over doc found')
            return
        }

        console.log('Checking parent match:', {
            activeParent: activeDoc.metadata.parentId,
            overParent: overDoc.metadata.parentId,
            match: activeDoc.metadata.parentId === overDoc.metadata.parentId
        })

        // only reorder if they share the same parent
        if (activeDoc.metadata.parentId === overDoc.metadata.parentId) {
            const parentId = activeDoc.metadata.parentId
            const siblings = documents.filter(
                (d) => d.metadata.parentId === parentId
            )

            // sort siblings by current structure order
            siblings.sort((a, b) => {
                const structA = structure?.documents.find((s) => s.id === a.id)
                const structB = structure?.documents.find((s) => s.id === b.id)
                const orderA = structA?.order ?? Infinity
                const orderB = structB?.order ?? Infinity
                return orderA - orderB
            })

            console.log(
                'Sorted siblings:',
                siblings.map((s) => ({
                    id: s.id,
                    title: s.metadata.title,
                    order: structure?.documents.find((d) => d.id === s.id)
                        ?.order
                }))
            )

            const activeIndex = siblings.findIndex((d) => d.id === active.id)
            const overIndex = siblings.findIndex((d) => d.id === over.id)

            if (activeIndex === -1 || overIndex === -1) {
                console.log('Bailing: invalid indexes', {
                    activeIndex,
                    overIndex
                })
                return
            }

            console.log('Reordering:', {
                activeIndex,
                overIndex,
                siblingsCount: siblings.length
            })

            // calculate new order for all siblings and update structure
            const structureUpdates: DocumentStructure[] = []
            siblings.forEach((doc, index) => {
                let newOrder: number
                if (doc.id === active.id) {
                    newOrder = overIndex
                } else if (activeIndex < overIndex) {
                    // moving down
                    if (index > activeIndex && index <= overIndex) {
                        newOrder = index - 1
                    } else {
                        newOrder = index
                    }
                } else {
                    // moving up
                    if (index >= overIndex && index < activeIndex) {
                        newOrder = index + 1
                    } else {
                        newOrder = index
                    }
                }

                console.log(
                    `Doc ${doc.metadata.title}: index=${index}, new order=${newOrder}`
                )

                structureUpdates.push({
                    id: doc.id,
                    parentId: doc.metadata.parentId,
                    order: newOrder
                })
            })

            console.log(
                `Updating structure with ${structureUpdates.length} documents`
            )

            await updateDocumentStructure(structureUpdates)
        }
    }

    // root level document IDs for the main SortableContext
    const rootDocIds = useMemo(() => {
        return documentTree.rootDocs.map((d) => d.id)
    }, [documentTree])

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="h-full bg-muted/10 p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold">Documents</h2>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCreateFolder}
                            title="Create folder"
                        >
                            <FolderPlus className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowNewDoc(!showNewDoc)}
                            title="Create document"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {showNewDoc && (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newDocTitle}
                            onChange={(e) => setNewDocTitle(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === 'Enter' && handleCreateDocument()
                            }
                            placeholder="Document title"
                            className="flex-1 px-2 py-1 text-sm border rounded"
                            autoFocus
                        />
                        <Button size="sm" onClick={handleCreateDocument}>
                            Create
                        </Button>
                    </div>
                )}

                <div className="flex-1 overflow-auto">
                    <SortableContext
                        items={rootDocIds}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-1">
                            {documentTree.rootDocs.map((doc) => (
                                <DocumentTreeNode
                                    key={doc.id}
                                    doc={doc}
                                    depth={0}
                                    childrenMap={documentTree.childrenMap}
                                    expandedFolders={expandedFolders}
                                    renamingId={renamingId}
                                    onToggle={toggleFolder}
                                    onNavigate={(id) =>
                                        navigate({
                                            to: '/doc/$docId',
                                            params: { docId: id }
                                        })
                                    }
                                    onDelete={async (id) => {
                                        await deleteDocument(id)
                                        navigate({ to: '/' })
                                    }}
                                    onCreateChild={handleCreateChild}
                                    onConvertToFolder={handleConvertToFolder}
                                    onRename={handleRename}
                                    onCancelRename={handleCancelRename}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </div>
            </div>
        </DndContext>
    )
}
