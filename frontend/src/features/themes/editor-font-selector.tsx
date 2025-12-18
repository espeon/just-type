import { useEffect, useState } from 'react'
import { EDITOR_FONTS, type EditorFont, getStoredEditorFont } from './fonts'

export function EditorFontSelector() {
    const [selectedFont, setSelectedFont] = useState<EditorFont>('default')
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        const font = getStoredEditorFont()
        setSelectedFont(font)
        setIsLoaded(true)
    }, [])

    const applyEditorFont = (font: EditorFont) => {
        const fontStack = EDITOR_FONTS[font].stack
        console.log('applyEditorFont in component:', font, 'stack:', fontStack)

        // Apply to elements with data-editor-content attribute
        const editorElements = document.querySelectorAll(
            '[data-editor-content]'
        )
        console.log(
            'data-editor-content elements found:',
            editorElements.length
        )
        editorElements.forEach((el) => {
            ;(el as HTMLElement).style.fontFamily = fontStack
            console.log('Applied font to data-editor-content element')
        })

        // Also apply to contenteditable divs (Tiptap editor content)
        const contentEditables = document.querySelectorAll('[contenteditable]')
        console.log('contenteditable elements found:', contentEditables.length)
        contentEditables.forEach((el) => {
            ;(el as HTMLElement).style.fontFamily = fontStack
            console.log(
                'Applied font to contenteditable element:',
                (el as HTMLElement).className
            )
        })

        localStorage.setItem('editor-font-family', font)
    }

    const handleFontChange = (font: EditorFont) => {
        setSelectedFont(font)
        // Apply immediately and retry after a short delay to catch dynamically rendered editors
        applyEditorFont(font)
        setTimeout(() => applyEditorFont(font), 100)
    }

    if (!isLoaded) {
        return (
            <div className="text-sm text-muted-foreground">
                Loading fonts...
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {(
                Object.entries(EDITOR_FONTS) as [
                    EditorFont,
                    (typeof EDITOR_FONTS)[EditorFont]
                ][]
            ).map(([fontKey, fontConfig]) => (
                <div
                    key={fontKey}
                    onClick={() => handleFontChange(fontKey)}
                    className={`cursor-pointer p-4 rounded-lg border transition-colors ${
                        selectedFont === fontKey
                            ? 'border bg-muted'
                            : 'border-border hover:bg-muted'
                    }`}
                >
                    <div
                        className="mb-2"
                        style={{ fontFamily: fontConfig.stack }}
                    >
                        <p className="font-semibold text-base">
                            {fontConfig.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {fontConfig.description}
                        </p>
                    </div>
                    <p
                        className="text-sm text-foreground/70"
                        style={{ fontFamily: fontConfig.stack }}
                    >
                        The quick brown fox jumps over the lazy dog
                    </p>
                </div>
            ))}
        </div>
    )
}
