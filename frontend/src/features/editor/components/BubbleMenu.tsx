import { useEffect, useRef, useState } from 'react'
import { Editor } from '@tiptap/core'
import { BubbleMenu } from '@tiptap/react/menus'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import {
    Bold,
    Code2,
    Heading1,
    Heading2,
    Heading3,
    Heading4,
    Heading5,
    Heading6,
    Italic,
    Underline,
    ChevronDown
} from 'lucide-react'

const HeadingLevels: [1, 2, 3] = [1, 2, 3]
const HeadingLevelsMap = [
    Heading1,
    Heading2,
    Heading3,
    Heading4,
    Heading5,
    Heading6
]

type Props = {
    editor: Editor
}

export default function BubbleMenuComponent({ editor }: Props) {
    const [subOpen, setSubOpen] = useState(false)
    const subOpenRef = useRef(subOpen)
    useEffect(() => {
        subOpenRef.current = subOpen
    }, [subOpen])

    if (!editor) return null

    return (
        <BubbleMenu
            editor={editor}
            shouldShow={({ editor, state }) => {
                // hide bubble menu when slash command is active
                const { from, to } = state.selection
                const text = state.doc.textBetween(from - 1, to, '\0')
                if (text.startsWith('/')) {
                    return false
                }

                // default behavior: show on text selection
                return !state.selection.empty
            }}
            options={{
                placement: 'top',
                offset: 8,
                flip: true,
                autoPlacement: {
                    alignment: 'start',
                    allowedPlacements: ['top', 'right']
                }
            }}
            className="flex items-center gap-1 rounded-md bg-popover p-1 shadow-md border border-border"
        >
            <Button
                size="icon"
                variant="ghost"
                onClick={() => editor.chain().focus().toggleBold().run()}
            >
                <Bold />
            </Button>

            <Button
                size="icon"
                variant="ghost"
                onClick={() => editor.chain().focus().toggleItalic().run()}
            >
                <Italic />
            </Button>

            <Button
                size="icon"
                variant="ghost"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
                <Underline />
            </Button>

            <Button
                size="icon"
                variant="ghost"
                onClick={() => editor.chain().focus().toggleCode().run()}
            >
                <Code2 />
            </Button>

            <DropdownMenu onOpenChange={(open) => setSubOpen(open)}>
                <DropdownMenuTrigger asChild>
                    <Button
                        size="icon"
                        variant="ghost"
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        aria-label="Formatting options"
                        title="Formatting options"
                    >
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuPrimitive.Content
                    sideOffset={4}
                    align="start"
                    className="w-40 bg-popover text-popover-foreground rounded-md border p-1 shadow-md"
                    onCloseAutoFocus={(e: Event) => e.preventDefault()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    {HeadingLevels.map((level) => {
                        const Icon = HeadingLevelsMap[level - 1]
                        return (
                            <DropdownMenuItem
                                key={level}
                                onClick={() =>
                                    editor
                                        .chain()
                                        .focus()
                                        .toggleHeading({ level })
                                        .run()
                                }
                            >
                                <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    <span>Heading {level}</span>
                                </div>
                            </DropdownMenuItem>
                        )
                    })}

                    <DropdownMenuItem
                        onClick={() =>
                            editor.chain().focus().setParagraph().run()
                        }
                    >
                        <div className="flex items-center gap-2">
                            <span className="font-normal">P</span>
                            <span>Paragraph</span>
                        </div>
                    </DropdownMenuItem>
                </DropdownMenuPrimitive.Content>
            </DropdownMenu>
        </BubbleMenu>
    )
}
