import { Extension } from '@tiptap/core'

export const KeyboardShortcutsExtension = Extension.create({
    name: 'keyboardShortcuts',

    addKeyboardShortcuts() {
        return {
            'Mod-Enter': ({ editor }) => {
                const { state } = editor
                const { selection } = state
                const { $from } = selection

                editor
                    .chain()
                    .insertContentAt($from.after(), { type: 'paragraph' })
                    .focus($from.after() + 1)
                    .run()

                return true
            },

            'Mod-Shift-d': ({ editor }) => {
                const { state } = editor
                const { selection } = state
                const { $from } = selection

                const node = $from.parent
                const pos = $from.before()

                editor
                    .chain()
                    .insertContentAt(pos + node.nodeSize, node.toJSON())
                    .focus()
                    .run()

                return true
            }
        }
    }
})
