import { Extension } from '@tiptap/core'
import Suggestion, { SuggestionOptions } from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import tippy, { Instance as TippyInstance } from 'tippy.js'
import { VaultIndex } from '@/features/vault/types'
import { WikiLinkList, WikiLinkListRef } from './WikiLinkList'

interface WikiLinkOptions {
    index: VaultIndex | null
    onLinkInsert: (docId: string, title: string) => void
}

export const WikiLinkExtension = Extension.create<WikiLinkOptions>({
    name: 'wikilink',

    addOptions() {
        return {
            index: null,
            onLinkInsert: () => {}
        }
    },

    addProseMirrorPlugins() {
        const options = this.options

        return [
            Suggestion({
                editor: this.editor,
                char: '[[',
                allowSpaces: true,
                startOfLine: false,

                items: ({ query }) => {
                    const { index } = options
                    if (!index) return []

                    const results: Array<{
                        id: string
                        title: string
                        type: 'doc' | 'header'
                        docTitle?: string
                    }> = []

                    for (const doc of index.documents.values()) {
                        if (
                            doc.title
                                .toLowerCase()
                                .includes(query.toLowerCase())
                        ) {
                            results.push({
                                id: doc.id,
                                title: doc.title,
                                type: 'doc'
                            })
                        }

                        for (const header of doc.headers) {
                            if (
                                header.text
                                    .toLowerCase()
                                    .includes(query.toLowerCase())
                            ) {
                                results.push({
                                    id: `${doc.id}#${header.slug}`,
                                    title: header.text,
                                    type: 'header',
                                    docTitle: doc.title
                                })
                            }
                        }
                    }

                    return results.slice(0, 10)
                },

                render: () => {
                    let component: ReactRenderer<WikiLinkListRef> | null = null
                    let popup: TippyInstance[] | null = null

                    return {
                        onStart: (props) => {
                            component = new ReactRenderer(WikiLinkList, {
                                props: {
                                    ...props,
                                    onSelect: (item: {
                                        id: string
                                        title: string
                                    }) => {
                                        options.onLinkInsert(
                                            item.id,
                                            item.title
                                        )
                                        props.command({
                                            id: item.id,
                                            title: item.title
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
                                    title: string
                                }) => {
                                    options.onLinkInsert(item.id, item.title)
                                    props.command({
                                        id: item.id,
                                        title: item.title
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
                },

                command: ({ editor, range, props }) => {
                    const { id, title } = props as { id: string; title: string }

                    editor
                        .chain()
                        .focus()
                        .deleteRange(range)
                        .insertContent([
                            {
                                type: 'text',
                                marks: [
                                    {
                                        type: 'link',
                                        attrs: {
                                            href: `/doc/${id.split('#')[0]}`
                                        }
                                    }
                                ],
                                text: title
                            },
                            { type: 'text', text: ' ' }
                        ])
                        .run()
                }
            } as SuggestionOptions)
        ]
    }
})
