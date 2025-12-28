import Image from '@tiptap/extension-image'
import { uploadsApi } from '@/api/uploads'
import { Editor } from '@tiptap/core'
import { storeImage, getImage } from '@/lib/storage/image-storage'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react'
import { useEffect, useState } from 'react'

// React component for rendering images with local:// URLs
function ImageNodeView({ node }: { node: any }) {
    const [src, setSrc] = useState<string | null>(node.attrs.src)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadImage() {
            if (node.attrs.src?.startsWith('local://')) {
                try {
                    const objectUrl = await getImage(node.attrs.src)
                    if (objectUrl) {
                        setSrc(objectUrl)
                    }
                } catch (error) {
                    console.error('Failed to load image:', error)
                } finally {
                    setLoading(false)
                }
            } else {
                setSrc(node.attrs.src)
                setLoading(false)
            }
        }

        loadImage()

        // Cleanup object URL on unmount
        return () => {
            if (src?.startsWith('blob:')) {
                URL.revokeObjectURL(src)
            }
        }
    }, [node.attrs.src])

    if (loading) {
        return (
            <NodeViewWrapper>
                <div className="inline-block h-24 w-24 animate-pulse rounded bg-muted" />
            </NodeViewWrapper>
        )
    }

    if (!src) {
        return (
            <NodeViewWrapper>
                <div className="inline-block rounded border border-destructive bg-destructive/10 p-2 text-xs text-destructive">
                    image not found
                </div>
            </NodeViewWrapper>
        )
    }

    return (
        <NodeViewWrapper>
            <img
                src={src}
                alt={node.attrs.alt || ''}
                title={node.attrs.title || ''}
                className="max-w-full rounded"
            />
        </NodeViewWrapper>
    )
}

export const ImageUploadExtension = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            uploadId: {
                default: null
            }
        }
    },

    addNodeView() {
        return ReactNodeViewRenderer(ImageNodeView)
    },

    addProseMirrorPlugins() {
        return [...(this.parent?.() || [])]
    }
})

// Helper function to handle image upload
// For now, always use local storage (IndexedDB)
// TODO: detect vault type and use server upload for synced vaults
export async function uploadImage(
    file: File,
    editor: Editor,
    useLocal: boolean = true
) {
    if (useLocal) {
        return uploadImageLocal(file, editor)
    } else {
        return uploadImageServer(file, editor)
    }
}

// Server-based upload for synced vaults
async function uploadImageServer(file: File, editor: Editor) {
    try {
        // Create a placeholder
        const placeholderUrl = URL.createObjectURL(file)
        editor.chain().focus().setImage({ src: placeholderUrl }).run()

        // Upload the actual file
        const upload = await uploadsApi.upload(file)
        const imageUrl = uploadsApi.getUrl(upload)

        // Replace placeholder with real URL
        editor
            .chain()
            .focus()
            .setImage({
                src: imageUrl
                //uploadId: upload.id
            })
            .run()

        // Clean up placeholder
        URL.revokeObjectURL(placeholderUrl)
    } catch (error) {
        console.error('Failed to upload image:', error)
        // Could add error notification here
    }
}

// Local storage (IndexedDB) for local vaults
async function uploadImageLocal(file: File, editor: Editor) {
    try {
        // Create a placeholder
        const placeholderUrl = URL.createObjectURL(file)
        editor.chain().focus().setImage({ src: placeholderUrl }).run()

        // Store in IndexedDB
        const blob = new Blob([await file.arrayBuffer()], { type: file.type })
        const localUrl = await storeImage(blob)

        // Replace placeholder with local:// URL
        editor
            .chain()
            .focus()
            .setImage({
                src: localUrl
            })
            .run()

        // Clean up placeholder
        URL.revokeObjectURL(placeholderUrl)
    } catch (error) {
        console.error('Failed to store image locally:', error)
        // Could add error notification here
    }
}
