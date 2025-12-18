import { useEffect, useState } from 'react'
import { EDITOR_FONTS, type EditorFont, applyEditorFont, getStoredEditorFont } from './fonts'

export function EditorFontSelector() {
    const [selectedFont, setSelectedFont] = useState<EditorFont>('default')
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        const font = getStoredEditorFont()
        setSelectedFont(font)
        setIsLoaded(true)
    }, [])

    const handleFontChange = (font: EditorFont) => {
        setSelectedFont(font)
        applyEditorFont(font)
    }

    if (!isLoaded) {
        return <div className="text-sm text-muted-foreground">Loading fonts...</div>
    }

    return (
        <div className="space-y-3">
            {(Object.entries(EDITOR_FONTS) as [EditorFont, typeof EDITOR_FONTS[EditorFont]][]).map(
                ([fontKey, fontConfig]) => (
                    <div
                        key={fontKey}
                        onClick={() => handleFontChange(fontKey)}
                        className={`cursor-pointer p-4 rounded-lg border transition-colors ${
                            selectedFont === fontKey
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
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
                )
            )}
        </div>
    )
}
