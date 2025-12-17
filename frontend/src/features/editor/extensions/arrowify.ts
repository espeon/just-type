import { Extension } from '@tiptap/core'

export const ArrowifyExtension = Extension.create({
    name: 'arrowify',

    addInputRules() {
        return [
            {
                undoable: true,
                find: /->/g,
                handler: ({ state, range, chain }) => {
                    const { from, to } = range
                    const tr = state.tr.replaceWith(
                        from,
                        to,
                        state.schema.text('→')
                    )
                    chain().insertContent(tr).run()
                }
            }
        ]
    }
})
