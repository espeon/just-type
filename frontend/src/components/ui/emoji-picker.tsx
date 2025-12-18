import { useEffect, useState } from 'react'
import { Button } from './button'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import twemoji from '@twemoji/api'
import emojibase from 'emojibase-data/en/data.json'

interface Emoji {
    emoji: string
    codepoint: string
    label: string
}

interface EmojiCategories {
    [key: string]: Emoji[]
}

interface EmojiPickerProps {
    value?: string
    onSelect: (emoji: string) => void
}

const EMOJI_CATEGORY_NAMES: string[] = [
    'smileys',
    'people',
    'modifiers',
    'animals',
    'food',
    'activities',
    'travel',
    'objects',
    'symbols',
    'flags'
]

export function EmojiPicker({ value, onSelect }: EmojiPickerProps) {
    const [open, setOpen] = useState(false)
    const [categories, setCategories] = useState<EmojiCategories>({})
    const [activeCategory, setActiveCategory] = useState<string>('smileys')

    useEffect(() => {
        const categoryMap: EmojiCategories = {}
        emojibase.forEach((emoji) => {
            const category = emoji.group?.toString() ?? 'other'
            if (!categoryMap[category]) {
                categoryMap[category] = []
            }
            categoryMap[category].push({
                emoji: emoji.emoji,
                codepoint: emoji.hexcode,
                label: emoji.label
            })
        })
        setCategories(categoryMap)
    }, [])

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
                    dangerouslySetInnerHTML={{
                        __html: twemoji.parse(value || '📄')
                    }}
                />
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="space-y-2">
                    <div className="flex gap-1 border-b pb-2 overflow-x-auto">
                        {Object.keys(categories).map((cat) => (
                            <Button
                                key={cat}
                                variant={
                                    activeCategory === cat ? 'default' : 'ghost'
                                }
                                size="sm"
                                onClick={() => setActiveCategory(cat)}
                                className="text-xs"
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>
                    <div className="grid grid-cols-8 gap-1 h-56 overflow-y-auto">
                        {categories[activeCategory]?.map(
                            ({ emoji, label, codepoint }) => (
                                <button
                                    key={label}
                                    onClick={() => handleSelect(emoji)}
                                    className="text-2xl hover:bg-accent rounded p-1"
                                    dangerouslySetInnerHTML={{
                                        __html: twemoji.parse(
                                            twemoji.convert.fromCodePoint(
                                                codepoint
                                            )
                                        )
                                    }}
                                    title={label}
                                />
                            )
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
