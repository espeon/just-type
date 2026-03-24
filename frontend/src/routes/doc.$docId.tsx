import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useVaultStore } from '@/features/vault/stores/vaultStore'
import { useConfigStore } from '@/features/vault/stores/configStore'
import { BlockSuiteEditor } from '@/features/editor/components/BlockSuiteEditor'
import { DocumentHistory } from '@/features/audit/DocumentHistory'
import { useEffect, useState } from 'react'
import { Loader } from '@/components/ui/loader'
import { Button } from '@/components/ui/button'
import { Presentation } from 'lucide-react'
import { vaultsApi } from '@/api/vaults'

function DocumentPage() {
    const { docId } = Route.useParams()
    const currentVault = useConfigStore((state) => state.getCurrentVault())
    const currentDocument = useVaultStore((state) => state.currentDocument)
    const storage = useVaultStore((state) => state.storage)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showHistory, setShowHistory] = useState(false)
    const [pairedCanvasId, setPairedCanvasId] = useState<string | null>(null)
    const [isCreatingCanvas, setIsCreatingCanvas] = useState(false)
    const navigate = useNavigate()

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

    // Check for paired canvas
    useEffect(() => {
        async function checkForCanvas() {
            if (!currentVault || !currentDocument) return

            try {
                const allDocs = await vaultsApi.getDocumentsMetadata(
                    currentVault.id
                )
                const canvas = allDocs.find(
                    (doc) =>
                        doc.doc_type === 'canvas' && doc.parent_guid === docId
                )
                if (canvas) {
                    setPairedCanvasId(canvas.guid)
                }
            } catch (err) {
                console.error('Failed to check for canvas:', err)
            }
        }

        checkForCanvas()
    }, [currentVault, currentDocument, docId])

    const handleOpenCanvas = async () => {
        if (!currentVault || !currentDocument) return

        if (pairedCanvasId) {
            navigate({
                to: '/canvas/$canvasId',
                params: { canvasId: pairedCanvasId }
            })
        } else {
            // Create new canvas
            try {
                setIsCreatingCanvas(true)
                const title = `${currentDocument.metadata.title} - Canvas`
                const response = await vaultsApi.createCanvas(
                    currentVault.id,
                    title,
                    docId
                )
                setPairedCanvasId(response.guid)
                navigate({
                    to: '/canvas/$canvasId',
                    params: { canvasId: response.guid }
                })
            } catch (err) {
                console.error('Failed to create canvas:', err)
                alert('Failed to create canvas')
            } finally {
                setIsCreatingCanvas(false)
            }
        }
    }

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
                <BlockSuiteEditor
                    document={currentDocument}
                    onHistoryToggle={() => setShowHistory(!showHistory)}
                    showHistory={showHistory}
                />
            </div>

            {showHistory && (
                <div className="w-80">
                    <DocumentHistory
                        docGuid={docId}
                        onClose={() => setShowHistory(false)}
                    />
                </div>
            )}

            {/* Canvas toggle button */}
            <Button
                onClick={handleOpenCanvas}
                disabled={isCreatingCanvas}
                className="fixed bottom-4 right-4 z-50"
                size="lg"
                title={
                    pairedCanvasId
                        ? 'Open paired canvas'
                        : 'Create canvas for this document'
                }
            >
                <Presentation className="w-5 h-5 mr-2" />
                {isCreatingCanvas
                    ? 'Creating...'
                    : pairedCanvasId
                      ? 'Open Canvas'
                      : 'Create Canvas'}
            </Button>
        </div>
    )
}

export const Route = createFileRoute('/doc/$docId')({
    component: DocumentPage
})
