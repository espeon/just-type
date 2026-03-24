import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CanvasPage } from '@/features/canvas/canvas-page'
import { useConfigStore } from '@/features/vault/stores/configStore'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import { vaultsApi } from '@/api/vaults'
import { useEffect, useState } from 'react'

function CanvasRoute() {
    const { canvasId } = Route.useParams()
    const currentVault = useConfigStore((state) => state.getCurrentVault())
    const navigate = useNavigate()
    const [pairedDocId, setPairedDocId] = useState<string | null>(null)

    useEffect(() => {
        async function checkForDocument() {
            if (!currentVault) return

            try {
                const allDocs = await vaultsApi.getDocumentsMetadata(
                    currentVault.id
                )
                const canvas = allDocs.find((doc) => doc.guid === canvasId)
                if (canvas?.parent_guid) {
                    setPairedDocId(canvas.parent_guid)
                }
            } catch (err) {
                console.error('Failed to check for paired document:', err)
            }
        }

        checkForDocument()
    }, [currentVault, canvasId])

    if (!currentVault) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="text-gray-500">No vault selected</div>
            </div>
        )
    }

    return (
        <div className="relative w-full h-screen">
            <CanvasPage canvasGuid={canvasId} vaultId={currentVault.id} />

            {pairedDocId && (
                <Button
                    onClick={() =>
                        navigate({
                            to: '/doc/$docId',
                            params: { docId: pairedDocId }
                        })
                    }
                    className="fixed bottom-4 right-4 z-50"
                    size="lg"
                    title="Open paired document"
                >
                    <FileText className="w-5 h-5 mr-2" />
                    Open Document
                </Button>
            )}
        </div>
    )
}

export const Route = createFileRoute('/canvas/$canvasId')({
    component: CanvasRoute
})
