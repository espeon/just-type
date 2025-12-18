import { EditorContent, Editor } from '@tiptap/react'

interface TiptapEditorProps {
    editor: Editor | null
}

export function TiptapEditor({ editor }: TiptapEditorProps) {
    if (!editor) {
        return (
            <div className="p-8 text-muted-foreground">loading editor...</div>
        )
    }

    return (
        <div className="w-full h-full" data-editor-content>
            <EditorContent editor={editor} />
        </div>
    )
}
