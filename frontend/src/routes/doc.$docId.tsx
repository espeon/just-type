import { createFileRoute } from '@tanstack/react-router'
import { useVaultStore } from '@/features/vault/stores/vaultStore'
import { useConfigStore } from '@/features/vault/stores/configStore'
import { BlockSuiteEditor } from '@/features/editor/components/BlockSuiteEditor'
import { useEffect, useState } from 'react'
import { Loader } from '@/components/ui/loader'

function DocumentPage() {
    const { docId } = Route.useParams()
    const currentVault = useConfigStore((state) => state.getCurrentVault())
    const currentDocument = useVaultStore((state) => state.currentDocument)
    const storage = useVaultStore((state) => state.storage)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadDocument() {
            if (!currentVault) return
            if (!storage) return

            try {
                setIsLoading(true)
                setError(null)
                await useVaultStore.getState().openDocument(docId)

                // Track this as the last opened document for this vault
                useConfigStore.getState().updateVault(currentVault.id, {
                    lastOpenedDocumentId: docId
                })
            } catch (err) {
                setError(String(err))
            } finally {
                setIsLoading(false)
            }
        }

        loadDocument()
    }, [docId, currentVault, storage])

    if (isLoading) {
        return (
            <div className="p-4">
                <Loader />
            </div>
        )
    }

    if (error) {
        return <div className="p-4 text-red-500">Error: {error}</div>
    }

    if (!currentDocument) {
        return <div className="p-4">Document not found</div>
    }

    return <BlockSuiteEditor document={currentDocument} />
}

export const Route = createFileRoute('/doc/$docId')({
    component: DocumentPage
})
