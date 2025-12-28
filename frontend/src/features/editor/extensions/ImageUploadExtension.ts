import Image from '@tiptap/extension-image'
import { uploadsApi } from '@/api/uploads'
import { Editor } from '@tiptap/core'

export const ImageUploadExtension = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            uploadId: {
                default: null
            }
        }
    },

    addProseMirrorPlugins() {
        return [...(this.parent?.() || [])]
    }
})

// Helper function to handle image upload
export async function uploadImage(file: File, editor: Editor) {
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
