export type FontFamily = 'default' | 'inter' | 'tasa-orbiter' | 'atkinson-hyperlegible'

export const FONTS: Record<FontFamily, { name: string; description: string; stack: string }> = {
    default: {
        name: 'Default',
        description: 'System default fonts',
        stack: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", sans-serif'
    },
    inter: {
        name: 'Inter',
        description: 'Modern, geometric sans-serif',
        stack: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    },
    'tasa-orbiter': {
        name: 'TASA Orbiter',
        description: 'Distinctive, technical typeface',
        stack: '"TASA Orbiter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    },
    'atkinson-hyperlegible': {
        name: 'Atkinson Hyperlegible',
        description: 'Highly legible typeface for accessibility',
        stack: '"Atkinson Hyperlegible", -apple-system, BlinkMacSystemFont, sans-serif'
    }
}

export function applyFont(font: FontFamily) {
    document.documentElement.style.fontFamily = FONTS[font].stack
    localStorage.setItem('font-family', font)
}

export function getStoredFont(): FontFamily {
    const stored = localStorage.getItem('font-family') as FontFamily | null
    return stored && stored in FONTS ? stored : 'default'
}

export function initializeFont() {
    const font = getStoredFont()
    applyFont(font)
}
