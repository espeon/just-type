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
}

export function useTiptapEditor({ ydoc }: UseTiptapEditorProps) {
    console.log('useTiptapEditor: creating editor with ydoc', ydoc)

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
                    return "type '/' for commands"
                }
            }),
            KeyboardShortcutsExtension,
            SlashCommandExtension,
            DocumentMentionExtension
        ],
        editorProps: {
            attributes: {
                class: 'prose prose-shadcn prose-sm sm:prose-base lg:prose-lg max-w-none focus:outline-none dark:prose-invert mx-auto p-8'
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
