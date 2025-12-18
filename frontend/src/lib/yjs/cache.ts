import * as Y from 'yjs'
import { decodeYjsState } from '@/lib/yjs/serializer'

const yDocCache = new Map<string, Y.Doc>()

export function getYDoc(documentId: string, initialState?: string): Y.Doc {
    let ydoc = yDocCache.get(documentId)

    if (ydoc) {
        return ydoc
    }

    ydoc = new Y.Doc()

    if (initialState) {
        decodeYjsState(initialState, ydoc)
    }

    yDocCache.set(documentId, ydoc)

    return ydoc
}
