import { Editor, Extension } from '@tiptap/core'
import Suggestion, { SuggestionOptions } from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import { PluginKey } from '@tiptap/pm/state'
import { computePosition, flip, shift, offset } from '@floating-ui/dom'
import {
    SlashCommandList,
    SlashCommandListRef
} from '../components/SlashCommandList'

export interface SlashCommand {
    title: string
    description: string
    command: (editor: Editor) => void
}

interface CommandCategory {
    name: string
    commands: SlashCommand[]
}

export const commandCategories: CommandCategory[] = [
    {
        name: 'Basic blocks',
        commands: [
            {
                title: 'Heading 1',
                description: 'large section heading',
                command: (editor) =>
                    editor.chain().focus().toggleHeading({ level: 1 }).run()
            },
            {
                title: 'Heading 2',
                description: 'medium section heading',
                command: (editor) =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
            },
            {
                title: 'Heading 3',
                description: 'small section heading',
                command: (editor) =>
                    editor.chain().focus().toggleHeading({ level: 3 }).run()
            },
            {
                title: 'Paragraph',
                description: 'normal text',
                command: (editor) => editor.chain().focus().setParagraph().run()
            },
            {
                title: 'Bullet List',
                description: 'unordered list',
                command: (editor) =>
                    editor.chain().focus().toggleBulletList().run()
            },
            {
                title: 'Numbered List',
                description: 'ordered list',
                command: (editor) =>
                    editor.chain().focus().toggleOrderedList().run()
            },
            {
                title: 'Code Block',
                description: 'code with syntax highlighting',
                command: (editor) =>
                    editor.chain().focus().toggleCodeBlock().run()
            },
            {
                title: 'Blockquote',
                description: 'capture a quote',
                command: (editor) =>
                    editor.chain().focus().toggleBlockquote().run()
            },
            {
                title: 'Divider',
                description: 'visual separator',
                command: (editor) =>
                    editor.chain().focus().setHorizontalRule().run()
            }
        ]
    },
    {
        name: 'Media',
        commands: [
            {
                title: 'Image',
                description: 'upload an image',
                command: (editor) => {
                    // Create and trigger hidden file input
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0]
                        if (file) {
                            const { uploadImage } =
                                await import('./ImageUploadExtension')
                            uploadImage(file, editor)
                        }
                    }
                    input.click()
                }
            }
        ]
    }
]

// flatten for backwards compatibility
export const commands: SlashCommand[] = commandCategories.flatMap(
    (cat) => cat.commands
)

const SuggestionPluginKey = new PluginKey('slashCommandSuggestion')

export const SlashCommandExtension = Extension.create({
    name: 'slashCommand',

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                char: '/',
                allowSpaces: false,
                startOfLine: false,
                pluginKey: SuggestionPluginKey,
                items: ({ query }) => {
                    const filtered = commands.filter((cmd) =>
                        cmd.title.toLowerCase().includes(query.toLowerCase())
                    )
                    console.log('suggestion items:', query, filtered.length)
                    return filtered
                },

                render: () => {
                    let component: ReactRenderer<SlashCommandListRef> | null =
                        null
                    let popup: HTMLElement | null = null

                    const updatePosition = async (
                        clientRect:
                            | (() => DOMRect)
                            | (() => DOMRect | null)
                            | null
                            | undefined
                    ) => {
                        if (!clientRect || !popup) return

                        const getBoundingClientRect = () => {
                            const rect =
                                typeof clientRect === 'function'
                                    ? clientRect()
                                    : null
                            return rect || new DOMRect()
                        }

                        const virtualElement = {
                            getBoundingClientRect
                        }

                        const { x, y } = await computePosition(
                            virtualElement,
                            popup,
                            {
                                placement: 'bottom-start',
                                middleware: [
                                    offset(8),
                                    flip(),
                                    shift({ padding: 8 })
                                ]
                            }
                        )

                        Object.assign(popup.style, {
                            left: `${x}px`,
                            top: `${y}px`
                        })
                    }

                    return {
                        onStart: (props) => {
                            component = new ReactRenderer(SlashCommandList, {
                                props: {
                                    ...props,
                                    onSelect: (cmd: SlashCommand) => {
                                        props.command({})
                                        cmd.command(props.editor)
                                    }
                                },
                                editor: props.editor
                            })

                            if (!props.clientRect) {
                                return
                            }

                            popup = component.element
                            document.body.appendChild(popup)

                            Object.assign(popup.style, {
                                position: 'absolute',
                                zIndex: '50'
                            })

                            updatePosition(props.clientRect)
                        },

                        onUpdate(props) {
                            component?.updateProps({
                                ...props,
                                onSelect: (cmd: SlashCommand) => {
                                    props.command({})
                                    cmd.command(props.editor)
                                }
                            })

                            updatePosition(props.clientRect)
                        },

                        onKeyDown(props) {
                            if (props.event.key === 'Escape') {
                                return true
                            }

                            return component?.ref?.onKeyDown(props) ?? false
                        },

                        onExit() {
                            if (popup && popup.parentNode) {
                                popup.parentNode.removeChild(popup)
                            }
                            component?.destroy()
                            component = null
                            popup = null
                        }
                    }
                },

                command: ({ editor, range }) => {
                    editor.chain().focus().deleteRange(range).run()
                }
            } as SuggestionOptions)
        ]
    }
})
