import { useEffect, useMemo, useCallback } from 'react'
import { encodeYjsState } from '@/lib/yjs/serializer'
import { getYDoc } from '@/lib/yjs/cache'

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
    const ydoc = useMemo(
        () => getYDoc(documentId, initialState),
        [documentId, initialState]
    )

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

    const getState = useCallback(() => {
        return encodeYjsState(ydoc)
    }, [ydoc])

    return { ydoc, getState }
}
