import { useEffect, useMemo, useCallback } from 'react'
import * as Y from 'yjs'
import { encodeYjsState, decodeYjsState } from '@/lib/yjs/serializer'

interface UseYjsDocumentProps {
    documentId: string
    initialState?: string
    onUpdate?: (state: string) => void
}

export function useYjsDocument({
    documentId,
    initialState,
    onUpdate
}: UseYjsDocumentProps) {
    // Create new ydoc when documentId changes
    const ydoc = useMemo(() => {
        const doc = new Y.Doc()
        if (initialState) {
            decodeYjsState(initialState, doc)
        }
        return doc
    }, [documentId])

    // Subscribe to updates
    useEffect(() => {
        if (!onUpdate) return

        const updateHandler = () => {
            const state = encodeYjsState(ydoc)
            onUpdate(state)
        }

        ydoc.on('update', updateHandler)

        return () => {
            ydoc.off('update', updateHandler)
        }
    }, [ydoc, onUpdate])

    // Get current state
    const getState = useCallback(() => {
        return encodeYjsState(ydoc)
    }, [ydoc])

    // Cleanup on unmount or document change
    useEffect(() => {
        return () => {
            ydoc.destroy()
        }
    }, [ydoc])

    return { ydoc, getState }
}
