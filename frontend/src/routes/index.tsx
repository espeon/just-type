import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useConfigStore } from '@/features/vault/stores/configStore'
import { VaultSetup } from '@/features/vault/components/VaultSetup'
import { Button } from '@/components/ui/button'

function VaultPage() {
    const currentVault = useConfigStore((state) => state.getCurrentVault())
    const userId = useConfigStore((state) => state.userId)
    const navigate = useNavigate()

    if (!currentVault) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <VaultSetup />
                {!userId && (
                    <div className="absolute bottom-8">
                        <p className="text-sm text-muted-foreground mb-2">
                            Already have an account?
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => navigate({ to: '/settings' })}
                        >
                            Go to Settings to Log In
                        </Button>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a document to start editing
        </div>
    )
}

export const Route = createFileRoute('/')({
    component: VaultPage
})
