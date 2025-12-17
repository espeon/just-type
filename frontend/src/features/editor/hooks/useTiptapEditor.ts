import { useEffect, useState } from 'react'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCaret from '@tiptap/extension-collaboration-caret'
import * as Y from 'yjs'

interface UseTiptapEditorProps {
    documentId?: string
    initialState?: string
    ydoc?: Y.Doc
}

export function useTiptapEditor({
    initialState,
    ydoc: externalYdoc
}: UseTiptapEditorProps) {
    const [ydoc] = useState(() => {
        if (externalYdoc) return externalYdoc

        const doc = new Y.Doc()

        if (initialState) {
            try {
                const decoded = Uint8Array.from(atob(initialState), (c) =>
                    c.charCodeAt(0)
                )
                Y.applyUpdate(doc, decoded)
            } catch (e) {
                console.error('failed to apply initial state:', e)
            }
        }

        return doc
    })

    const editor = useEditor({
        extensions: [
            StarterKit,
            Collaboration.configure({
                document: ydoc
            }),
            CollaborationCaret.configure({
                provider: null,
                user: {
                    name: 'anonymous',
                    color:
                        '#' + Math.floor(Math.random() * 16777215).toString(16)
                }
            })
        ],
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-screen p-8'
            }
        }
    })

    useEffect(() => {
        return () => {
            if (!externalYdoc) {
                ydoc?.destroy()
            }
        }
    }, [ydoc, externalYdoc])

    return {
        editor,
        ydoc
    }
}
