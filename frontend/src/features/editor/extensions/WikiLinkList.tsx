import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState
} from 'react'

interface WikiLinkItem {
    id: string
    title: string
    type: 'doc' | 'header'
    docTitle?: string
}

interface WikiLinkListProps {
    items: WikiLinkItem[]
    command: (item: { id: string; title: string }) => void
    onSelect: (item: { id: string; title: string }) => void
}

export interface WikiLinkListRef {
    onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

export const WikiLinkList = forwardRef<WikiLinkListRef, WikiLinkListProps>(
    (props, ref) => {
        const [selectedIndex, setSelectedIndex] = useState(0)

        useEffect(() => {
            setSelectedIndex(0)
        }, [props.items])

        const selectItem = (index: number) => {
            const item = props.items[index]
            if (item) {
                props.onSelect({ id: item.id, title: item.title })
            }
        }

        const upHandler = () => {
            setSelectedIndex(
                (selectedIndex + props.items.length - 1) % props.items.length
            )
        }

        const downHandler = () => {
            setSelectedIndex((selectedIndex + 1) % props.items.length)
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

        if (props.items.length === 0) {
            return (
                <div className="bg-popover border rounded-md shadow-md p-2 text-sm text-muted-foreground">
                    No documents found
                </div>
            )
        }

        return (
            <div className="bg-popover border rounded-md shadow-md overflow-hidden">
                {props.items.map((item, index) => (
                    <button
                        key={item.id}
                        className={`w-full text-left px-3 py-2 text-sm ${
                            index === selectedIndex
                                ? 'bg-accent text-accent-foreground'
                                : 'hover:bg-accent/50'
                        }`}
                        onClick={() => selectItem(index)}
                        onMouseEnter={() => setSelectedIndex(index)}
                    >
                        {item.type === 'header'
                            ? `${item.docTitle} > ${item.title}`
                            : item.title}
                    </button>
                ))}
            </div>
        )
    }
)

WikiLinkList.displayName = 'WikiLinkList'
