import { useState } from 'react'
import { Button } from './button'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

const EMOJI_CATEGORIES = {
    recent: ['📄', '📁', '✨', '🔥', '💡', '📝', '🎯', '🚀'],
    smileys: [
        '😀',
        '😃',
        '😄',
        '😁',
        '😅',
        '😂',
        '🤣',
        '😊',
        '😇',
        '🙂',
        '🙃',
        '😉',
        '😌',
        '😍',
        '🥰',
        '😘'
    ],
    nature: [
        '🌱',
        '🌿',
        '☘️',
        '🍀',
        '🌸',
        '🌺',
        '🌻',
        '🌹',
        '🌷',
        '🌼',
        '🌴',
        '🌳',
        '🌲',
        '🍁',
        '🍃',
        '🌾'
    ],
    objects: [
        '📚',
        '📖',
        '📝',
        '📄',
        '📃',
        '📋',
        '📊',
        '📈',
        '📉',
        '🗂️',
        '📁',
        '📂',
        '🗃️',
        '🗄️',
        '📦',
        '🗳️'
    ],
    symbols: [
        '❤️',
        '🧡',
        '💛',
        '💚',
        '💙',
        '💜',
        '🖤',
        '🤍',
        '🤎',
        '💔',
        '❣️',
        '💕',
        '💞',
        '💓',
        '💗',
        '💖'
    ],
    flags: ['🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏴‍☠️', '🇺🇳']
}

interface EmojiPickerProps {
    value?: string
    onSelect: (emoji: string) => void
}

export function EmojiPicker({ value, onSelect }: EmojiPickerProps) {
    const [open, setOpen] = useState(false)
    const [category, setCategory] =
        useState<keyof typeof EMOJI_CATEGORIES>('recent')

    const handleSelect = (emoji: string) => {
        onSelect(emoji)
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-lg"
                >
                    {value || '📄'}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="space-y-2">
                    <div className="flex gap-1 border-b pb-2 overflow-x-auto">
                        {Object.keys(EMOJI_CATEGORIES).map((cat) => (
                            <Button
                                key={cat}
                                variant={category === cat ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() =>
                                    setCategory(
                                        cat as keyof typeof EMOJI_CATEGORIES
                                    )
                                }
                                className="text-xs"
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>
                    <div className="grid grid-cols-8 gap-1">
                        {EMOJI_CATEGORIES[category].map((emoji) => (
                            <button
                                key={emoji}
                                onClick={() => handleSelect(emoji)}
                                className="text-2xl hover:bg-accent rounded p-1"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
