// src/features/vault/hooks/useBacklinks.ts
import { useVaultStore } from '../stores/vaultStore'
import { useMemo } from 'react'

export function useBacklinks(docId: string | undefined) {
    const { index } = useVaultStore()

    const backlinks = useMemo(() => {
        if (!docId || !index) return []

        const docIndex = index.documents.get(docId)
        if (!docIndex) return []

        return docIndex.backlinks
            .map((linkingDocId) => {
                const linkingDoc = index.documents.get(linkingDocId)
                return linkingDoc
                    ? { id: linkingDoc.id, title: linkingDoc.title }
                    : null
            })
            .filter(Boolean) as { id: string; title: string }[]
    }, [docId, index])

    return backlinks
}
