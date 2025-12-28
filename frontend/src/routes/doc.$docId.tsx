import { createFileRoute } from '@tanstack/react-router'
import { useVaultStore } from '@/features/vault/stores/vaultStore'
import { useConfigStore } from '@/features/vault/stores/configStore'
import { BlockSuiteEditor } from '@/features/editor/components/BlockSuiteEditor'
import { DocumentHistory } from '@/features/audit/DocumentHistory'
import { useEffect, useState } from 'react'
import { Loader } from '@/components/ui/loader'
import { Button } from '@/components/ui/button'
import { History } from 'lucide-react'

function DocumentPage() {
    const { docId } = Route.useParams()
    const currentVault = useConfigStore((state) => state.getCurrentVault())
    const currentDocument = useVaultStore((state) => state.currentDocument)
    const storage = useVaultStore((state) => state.storage)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showHistory, setShowHistory] = useState(false)

    useEffect(() => {
        async function loadDocument() {
            if (!currentVault) return
            if (!storage) return

            try {
                setIsLoading(true)
                setError(null)

                // Ensure vault is loaded (index built) before opening document
                const documents = useVaultStore.getState().documents
                if (documents.length === 0) {
                    await useVaultStore.getState().loadVault()
                }

                await useVaultStore.getState().openDocument(docId)
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

    return (
        <div className="relative flex h-full">
            <div className="flex-1">
                <BlockSuiteEditor document={currentDocument} />
            </div>

            {!showHistory && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHistory(true)}
                    className="absolute right-4 top-4"
                >
                    <History className="h-4 w-4" />
                    <span className="ml-2">history</span>
                </Button>
            )}

            {showHistory && (
                <div className="w-80">
                    <DocumentHistory
                        docGuid={docId}
                        onClose={() => setShowHistory(false)}
                    />
                </div>
            )}
        </div>
    )
}

export const Route = createFileRoute('/doc/$docId')({
    component: DocumentPage
})
