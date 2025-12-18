import { useEffect, useState } from 'react'
import { Button } from './button'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import twemoji from '@twemoji/api'
import emojibase from 'emojibase-data/en/data.json'

interface Emoji {
    emoji: string
    codepoint: string
    label: string
    skins?: Array<{ emoji: string; codepoint: string }>
}

interface EmojiCategories {
    [key: string]: Emoji[]
}

interface EmojiPickerProps {
    value?: string
    onSelect: (emoji: string) => void
}

const CATEGORY_MAP: Record<string, { name: string; emoji: string }> = {
    '0': { name: 'smileys', emoji: '😀' },
    '1': { name: 'people', emoji: '👋' },
    '3': { name: 'animals', emoji: '🐶' },
    '4': { name: 'food', emoji: '🍔' },
    '5': { name: 'activities', emoji: '⚽' },
    '6': { name: 'travel', emoji: '✈️' },
    '7': { name: 'objects', emoji: '💡' },
    '8': { name: 'symbols', emoji: '❤️' },
    '9': { name: 'flags', emoji: '🚩' },
    other: { name: 'other', emoji: '❓' }
}

const EXCLUDED_CATEGORIES: number[] = [2]

const SKIN_TONES = [
    { emoji: '👋', codepoint: '', label: 'Default' },
    { emoji: '👋🏻', codepoint: '1F3FB', label: 'Light' },
    { emoji: '👋🏼', codepoint: '1F3FC', label: 'Medium-Light' },
    { emoji: '👋🏽', codepoint: '1F3FD', label: 'Medium' },
    { emoji: '👋🏾', codepoint: '1F3FE', label: 'Medium-Dark' },
    { emoji: '👋🏿', codepoint: '1F3FF', label: 'Dark' }
]

export function EmojiPicker({ value, onSelect }: EmojiPickerProps) {
    const [open, setOpen] = useState(false)
    const [categories, setCategories] = useState<EmojiCategories>({})
    const [activeCategory, setActiveCategory] = useState<string>('0')
    const [selectedSkinTone, setSelectedSkinTone] = useState<string>('')

    useEffect(() => {
        const categoryMap: EmojiCategories = {}
        emojibase.forEach((emoji) => {
            const categoryId = emoji.group?.toString() ?? 'other'
            console.log('cat', categoryId)
            if (EXCLUDED_CATEGORIES.includes(Number(categoryId))) {
                return
            }
            if (!categoryMap[categoryId]) {
                categoryMap[categoryId] = []
            }
            categoryMap[categoryId].push({
                emoji: emoji.emoji,
                codepoint: emoji.hexcode,
                label: emoji.label,
                skins: emoji.skins?.map((skin) => ({
                    emoji: skin.emoji,
                    codepoint: skin.hexcode
                }))
            })
        })
        setCategories(categoryMap)
    }, [])

    const stripVariationSelector = (emoji: string, codepoint: string) => {
        // only strip variation selector for simple skin tone emojis (no ZWJ sequences)
        if (!codepoint.includes('200D')) {
            return emoji.replace(/\uFE0F/g, '')
        }
        return emoji
    }

    const getEmojiWithSkinTone = (
        baseEmoji: string,
        skins?: Array<{ emoji: string; codepoint: string }>,
        codepoint?: string
    ) => {
        if (!skins || skins.length === 0 || !selectedSkinTone) {
            return stripVariationSelector(baseEmoji, codepoint || '')
        }

        const matchingSkin = skins.find((skin) =>
            skin.codepoint.includes(selectedSkinTone)
        )

        return (
            matchingSkin?.emoji ||
            stripVariationSelector(baseEmoji, codepoint || '')
        )
    }

    const handleSelect = (emoji: string) => {
        onSelect(emoji)
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon-lg"
                    className="h-8 w-8 p-1 text-lg"
                    dangerouslySetInnerHTML={{
                        __html: twemoji.parse(value || '📄')
                    }}
                />
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="space-y-3">
                    <div className="flex gap-1 border-b pb-2 overflow-x-scroll no-scrollbar">
                        {Object.entries(categories).map(([catId]) => {
                            const catInfo = CATEGORY_MAP[catId]
                            return (
                                <Button
                                    key={catId}
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setActiveCategory(catId)}
                                    className={`flex items-center gap-1 text-xs px-1 transition-colors ${
                                        activeCategory === catId
                                            ? 'bg-blue-950 text-blue-700 grayscale-75'
                                            : 'grayscale opacity-50'
                                    }`}
                                    title={catInfo?.name}
                                    dangerouslySetInnerHTML={{
                                        __html: twemoji.parse(
                                            catInfo?.emoji || '❓'
                                        )
                                    }}
                                ></Button>
                            )
                        })}
                    </div>
                    {activeCategory === '1' && (
                        <div className="grid grid-cols-8 gap-1">
                            {SKIN_TONES.map((tone) => (
                                <button
                                    key={tone.label}
                                    onClick={() =>
                                        setSelectedSkinTone(tone.codepoint)
                                    }
                                    className={`text-lg p-1 rounded transition-colors ${
                                        selectedSkinTone === tone.codepoint
                                            ? 'bg-accent'
                                            : 'hover:bg-muted'
                                    }`}
                                    title={tone.label}
                                    dangerouslySetInnerHTML={{
                                        __html: twemoji.parse(tone.emoji)
                                    }}
                                />
                            ))}
                        </div>
                    )}
                    <div className="grid grid-cols-8 gap-1 h-56 overflow-y-auto">
                        {categories[activeCategory]?.map(
                            ({ emoji, label, skins, codepoint }) => {
                                const displayEmoji = getEmojiWithSkinTone(
                                    emoji,
                                    skins,
                                    codepoint
                                )
                                return (
                                    <button
                                        key={`${label}-${selectedSkinTone}`}
                                        onClick={() =>
                                            handleSelect(displayEmoji)
                                        }
                                        className="text-2xl hover:bg-accent rounded p-1"
                                        title={label}
                                        dangerouslySetInnerHTML={{
                                            __html: twemoji.parse(displayEmoji)
                                        }}
                                    />
                                )
                            }
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
