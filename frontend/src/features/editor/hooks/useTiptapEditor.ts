import { useEffect, useState } from 'react'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import Placeholder from '@tiptap/extension-placeholder'
import { KeyboardShortcutsExtension } from '../extensions/KeyboardShortcutsExtension'
import { SlashCommandExtension } from '../extensions/SlashCommandExtension'
import { DocumentMentionExtension } from '../extensions/DocumentMentionExtension'
import { VaultIndex } from '@/features/vault/types'
import * as Y from 'yjs'

interface UseTiptapEditorProps {
    documentId?: string
    initialState?: string
    ydoc?: Y.Doc
    index?: VaultIndex | null
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
