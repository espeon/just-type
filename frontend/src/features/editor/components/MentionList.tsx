import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState
} from 'react'

interface MentionItem {
    id: string
    label: string
}

interface MentionListProps {
    items: MentionItem[]
    command: (item: { id: string; label: string }) => void
    onSelect: (item: { id: string; label: string }) => void
}

export interface MentionListRef {
    onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>(
    (props, ref) => {
        const [selectedIndex, setSelectedIndex] = useState(0)

        useEffect(() => {
            setSelectedIndex(0)
        }, [props.items])

        const selectItem = (index: number) => {
            const item = props.items[index]
            if (item) {
                props.onSelect(item)
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
                    no documents found
                </div>
            )
        }

        return (
            <div className="bg-popover border rounded-md shadow-md overflow-hidden min-w-[200px]">
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
                        {item.label}
                    </button>
                ))}
            </div>
        )
    }
)

MentionList.displayName = 'MentionList'
