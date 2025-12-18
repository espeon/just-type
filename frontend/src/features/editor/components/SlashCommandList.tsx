import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Editor } from '@tiptap/core'

interface SlashCommand {
    title: string
    description: string
    command: (editor: Editor) => void
}

interface SlashCommandListProps {
    items: SlashCommand[]
    command: (cmd: Editor) => void
    onSelect: (cmd: SlashCommand) => void
    showSearch?: boolean
    showCategories?: boolean
}

export interface SlashCommandListRef {
    onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

export const SlashCommandList = forwardRef<
    SlashCommandListRef,
    SlashCommandListProps
>((props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [search, setSearch] = useState('')

    useEffect(() => {
        setSelectedIndex(0)
    }, [props.items])

    const filteredItems = props.showSearch
        ? props.items.filter(
              (item) =>
                  item.title.toLowerCase().includes(search.toLowerCase()) ||
                  item.description.toLowerCase().includes(search.toLowerCase())
          )
        : props.items

    const selectItem = (index: number) => {
        const item = filteredItems[index]
        if (item) {
            props.onSelect(item)
        }
    }

    const upHandler = () => {
        setSelectedIndex(
            (selectedIndex + filteredItems.length - 1) % filteredItems.length
        )
    }

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % filteredItems.length)
    }

    const enterHandler = () => {
        selectItem(selectedIndex)
    }

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }) => {
            if (event.key === 'ArrowUp') {
                upHandler()
                return true
            }

            if (event.key === 'ArrowDown') {
                downHandler()
                return true
            }

            if (event.key === 'Enter') {
                enterHandler()
                return true
            }

            return false
        }
    }))

    if (filteredItems.length === 0) {
        return (
            <div className="bg-popover border rounded-md shadow-md p-2 text-sm text-muted-foreground">
                no commands found
            </div>
        )
    }

    return (
        <div className="bg-popover border rounded-md shadow-md overflow-hidden min-w-xs max-w-xs">
            {props.showSearch && (
                <div className="p-2 border-b">
                    <Input
                        type="text"
                        placeholder="search commands..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-8"
                        autoFocus
                    />
                </div>
            )}
            <div className="max-h-[300px] overflow-y-auto">
                {filteredItems.map((item, index) => (
                    <button
                        key={item.title}
                        className={`w-full text-left px-3 py-2 ${
                            index === selectedIndex
                                ? 'bg-accent text-accent-foreground'
                                : 'hover:bg-accent/50'
                        }`}
                        onClick={() => selectItem(index)}
                        onMouseEnter={() => setSelectedIndex(index)}
                    >
                        <div className="text-sm font-medium">{item.title}</div>
                        <div className="text-xs text-muted-foreground">
                            {item.description}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
})

SlashCommandList.displayName = 'SlashCommandList'
