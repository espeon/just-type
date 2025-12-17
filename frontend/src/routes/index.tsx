import { createFileRoute } from '@tanstack/react-router'
import { useConfigStore } from '@/features/vault/stores/configStore'
import { VaultSetup } from '@/features/vault/components/VaultSetup'

function VaultPage() {
    const currentVault = useConfigStore((state) => state.getCurrentVault())

    if (!currentVault) {
        return <VaultSetup />
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
