import * as Y from 'yjs'

/**
 * Encode Yjs document state to base64 string
 */
export function encodeYjsState(ydoc: Y.Doc): string {
    const update = Y.encodeStateAsUpdate(ydoc)
    return btoa(String.fromCharCode(...update))
}

/**
 * Decode base64 string and apply to Yjs document
 */
export function decodeYjsState(encoded: string, ydoc: Y.Doc): void {
    if (!encoded) return

    try {
        const binary = atob(encoded)
        const update = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) {
            update[i] = binary.charCodeAt(i)
        }
        Y.applyUpdate(ydoc, update)
    } catch (error) {
        console.error('Failed to decode Yjs state:', error)
    }
}
