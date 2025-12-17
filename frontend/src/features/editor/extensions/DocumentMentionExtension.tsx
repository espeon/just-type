import Mention from '@tiptap/extension-mention'
import { SuggestionOptions } from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import tippy, { Instance as TippyInstance } from 'tippy.js'
import { VaultIndex } from '@/features/vault/types'
import { MentionList, MentionListRef } from '../components/MentionList'

interface DocumentMentionOptions {
    index: VaultIndex | null
}

export const DocumentMentionExtension = Mention.extend<DocumentMentionOptions>({
    name: 'documentMention',

    addOptions() {
        return {
            ...this.parent?.(),
            index: null,
            HTMLAttributes: {
                class: 'mention'
            },
            renderLabel({ node }): string {
                return `@${node.attrs.label ?? node.attrs.id}`
            },
            suggestion: {
                char: '@',
                allowSpaces: true,
                startOfLine: false,

                items: ({ query, editor }) => {
                    const options = editor.extensionManager.extensions.find(
                        (ext) => ext.name === 'documentMention'
                    )?.options as DocumentMentionOptions | undefined

                    const { index } = options || {}
                    if (!index) return []

                    const results: Array<{
                        id: string
                        label: string
                    }> = []

                    for (const doc of index.documents.values()) {
                        if (
                            doc.title
                                .toLowerCase()
                                .includes(query.toLowerCase())
                        ) {
                            results.push({
                                id: doc.id,
                                label: doc.title
                            })
                        }
                    }

                    return results.slice(0, 10)
                },

                render: () => {
                    let component: ReactRenderer<MentionListRef> | null = null
                    let popup: TippyInstance[] | null = null

                    return {
                        onStart: (props) => {
                            component = new ReactRenderer(MentionList, {
                                props: {
                                    ...props,
                                    onSelect: (item: {
                                        id: string
                                        label: string
                                    }) => {
                                        props.command({
                                            id: item.id,
                                            label: item.label
                                        })
                                    }
                                },
                                editor: props.editor
                            })

                            if (!props.clientRect) {
                                return
                            }

                            popup = tippy('body', {
                                getReferenceClientRect:
                                    props.clientRect as () => DOMRect,
                                appendTo: () => document.body,
                                content: component.element,
                                showOnCreate: true,
                                interactive: true,
                                trigger: 'manual',
                                placement: 'bottom-start'
                            })
                        },

                        onUpdate(props) {
                            component?.updateProps({
                                ...props,
                                onSelect: (item: {
                                    id: string
                                    label: string
                                }) => {
                                    props.command({
                                        id: item.id,
                                        label: item.label
                                    })
                                }
                            })

                            if (!props.clientRect) {
                                return
                            }

                            popup?.[0]?.setProps({
                                getReferenceClientRect:
                                    props.clientRect as () => DOMRect
                            })
                        },

                        onKeyDown(props) {
                            if (props.event.key === 'Escape') {
                                popup?.[0]?.hide()
                                return true
                            }

                            return component?.ref?.onKeyDown(props) ?? false
                        },

                        onExit() {
                            popup?.[0]?.destroy()
                            component?.destroy()
                        }
                    }
                }
            } as Partial<SuggestionOptions>
        }
    }
})
