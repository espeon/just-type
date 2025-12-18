import '@fontsource/inter'
import '@fontsource/atkinson-hyperlegible'
import '@fontsource/tasa-orbiter'
import '@fontsource/unifont'
import '@fontsource/libre-baskerville'

export type FontFamily =
    | 'default'
    | 'inter'
    | 'tasa-orbiter'
    | 'atkinson-hyperlegible'
export type EditorFont = 'default' | 'libre-baskerville' | 'unifont'

export const FONTS: Record<
    FontFamily,
    { name: string; description: string; stack: string }
> = {
    default: {
        name: 'Default',
        description: 'System default fonts',
        stack: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", sans-serif'
    },
    inter: {
        name: 'Inter',
        description: 'Modern, geometric sans-serif',
        stack: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
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

export const EDITOR_FONTS: Record<
    EditorFont,
    { name: string; description: string; stack: string }
> = {
    default: {
        name: 'Default',
        description: 'System default serif',
        stack: 'Georgia, "Times New Roman", serif'
    },
    'libre-baskerville': {
        name: 'Libre Baskerville',
        description: 'Classic, elegant serif',
        stack: '"Libre Baskerville", Georgia, serif'
    },
    unifont: {
        name: 'Unifont',
        description: 'Monospace, unicode font',
        stack: '"Unifont", monospace'
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
    const editorFont = getStoredEditorFont()
    applyEditorFont(editorFont)
}

export function applyEditorFont(font: EditorFont) {
    const fontStack = EDITOR_FONTS[font].stack

    // Apply to elements with data-editor-content attribute
    const editorElements = document.querySelectorAll('[data-editor-content]')
    editorElements.forEach((el) => {
        ;(el as HTMLElement).style.fontFamily = fontStack
    })

    // Also apply to contenteditable divs (Tiptap editor content)
    const contentEditables = document.querySelectorAll('[contenteditable]')
    contentEditables.forEach((el) => {
        ;(el as HTMLElement).style.fontFamily = fontStack
    })

    localStorage.setItem('editor-font-family', font)
}

export function getStoredEditorFont(): EditorFont {
    const stored = localStorage.getItem(
        'editor-font-family'
    ) as EditorFont | null
    return stored && stored in EDITOR_FONTS ? stored : 'default'
}
