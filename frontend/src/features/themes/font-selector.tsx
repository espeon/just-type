import { useEffect, useState } from 'react'
import { FONTS, type FontFamily, applyFont, getStoredFont } from './fonts'

export function FontSelector() {
    const [selectedFont, setSelectedFont] = useState<FontFamily>('default')
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        const font = getStoredFont()
        setSelectedFont(font)
        setIsLoaded(true)
    }, [])

    const handleFontChange = (font: FontFamily) => {
        setSelectedFont(font)
        applyFont(font)
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
                Object.entries(FONTS) as [
                    FontFamily,
                    (typeof FONTS)[FontFamily]
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
