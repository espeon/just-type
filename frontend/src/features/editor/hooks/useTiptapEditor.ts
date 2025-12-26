import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import Placeholder from '@tiptap/extension-placeholder'
import { KeyboardShortcutsExtension } from '../extensions/KeyboardShortcutsExtension'
import { SlashCommandExtension } from '../extensions/SlashCommandExtension'
import { DocumentMentionExtension } from '../extensions/DocumentMentionExtension'
import * as Y from 'yjs'

interface UseTiptapEditorProps {
    ydoc: Y.Doc
    editable?: boolean
}

export function useTiptapEditor({
    ydoc,
    editable = true
}: UseTiptapEditorProps) {
    console.log(
        'useTiptapEditor: creating editor with ydoc',
        ydoc,
        'editable:',
        editable
    )

    const editor = useEditor({
        extensions: [
            StarterKit,
            Collaboration.configure({
                document: ydoc
            }),
            Placeholder.configure({
                placeholder: ({ node }) => {
                    if (node.type.name === 'heading') {
                        return 'heading'
                    }
                    return editable ? "type '/' for commands" : 'read-only'
                }
            }),
            KeyboardShortcutsExtension,
            SlashCommandExtension,
            DocumentMentionExtension
        ],
        editable,
        editorProps: {
            attributes: {
                class: 'prose prose-shadcn prose-sm sm:prose-base lg:prose-lg max-w-none focus:outline-none dark:prose-invert mx-auto p-8',
                'data-editor-content': 'true'
            }
        },
        onUpdate: () => {
            console.log('Tiptap editor update fired, ydoc updates:', ydoc)
        }
    })

    console.log(
        'useTiptapEditor returning editor:',
        editor ? 'initialized' : 'null'
    )

    return {
        editor
    }
}
