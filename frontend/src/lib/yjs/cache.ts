import * as Y from 'yjs'

const yDocCache = new Map<string, Y.Doc>()

export function getYDoc(documentId: string, initialState?: string): Y.Doc {
    let ydoc = yDocCache.get(documentId)

    if (ydoc) {
        return ydoc
    }

    ydoc = new Y.Doc()
    yDocCache.set(documentId, ydoc)

    return ydoc
}
