import { useMemo } from 'react'
import { useThemeStore } from './loader'
import { getThemesByCategory } from './defs'
import { FontSelector } from './font-selector'

type Categories =
    | 'default'
    | 'dutch'
    | 'catppuccin'
    | 'popular'
    | 'editor'
    | 'aesthetic'
    | 'minimal'

function titleCase(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

export function ThemeSettings() {
    const theme = useThemeStore()
    const themes = useMemo(() => getThemesByCategory(), [])
    // @ts-expect-error SHUT THE FUCK UP
    delete themes['dutch']
    const themeKeys = useMemo(
        () => Object.keys(themes),
        [themes]
    ) as Categories[]

    return (
        <>
            <h2 className="text-2xl font-semibold mb-4">Theme Settings</h2>

            <div className="mb-8">
                <h3 className="text-xl font-medium mb-3">font</h3>
                <FontSelector />
            </div>

            <h3 className="text-xl font-medium mb-4">colors</h3>
            {themeKeys.map((category) => (
                <div key={category} className="mb-6">
                    <h3 className="text-xl font-medium mb-2">
                        {titleCase(category)}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {themes[category].map((themeVariant) => (
                            <div
                                key={themeVariant.id}
                                className={`cursor-pointer p-4 border rounded-lg ${
                                    theme.theme === themeVariant.id
                                        ? 'border-blue-500'
                                        : 'border-gray-300'
                                }`}
                                style={{
                                    backgroundColor:
                                        themeVariant.preview.background,
                                    color: themeVariant.preview.foreground
                                }}
                                onClick={() =>
                                    theme.updateTheme(themeVariant.id)
                                }
                            >
                                <div>
                                    {themeVariant.name}
                                    <div className="text-sm text-muted-foreground">
                                        {themeVariant.description}
                                    </div>
                                </div>
                                <div className="mt-2 flex gap-2 ml-auto w-max">
                                    <div
                                        className="size-6 rounded-full border"
                                        style={{
                                            backgroundColor:
                                                themeVariant.preview.accent,
                                            border:
                                                '1px solid ' +
                                                themeVariant.preview
                                                    .foreground +
                                                '20'
                                        }}
                                    />
                                    <div
                                        className="size-6 rounded-full border"
                                        style={{
                                            backgroundColor:
                                                themeVariant.preview.foreground,
                                            border:
                                                '1px solid ' +
                                                themeVariant.preview.accent +
                                                '20'
                                        }}
                                    />
                                    <div
                                        className="size-6 rounded-full border"
                                        style={{
                                            backgroundColor:
                                                themeVariant.preview.primary,
                                            border:
                                                '1px solid ' +
                                                themeVariant.preview
                                                    .foreground +
                                                '20'
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </>
    )
}
