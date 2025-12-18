import { useState } from 'react'
import { ThemeSettings } from '@/features/themes/theme-settings'
import { AuthDialog } from '@/features/auth/components/AuthDialog'
import { VaultManagement } from '@/features/vault/components/VaultManagement'
import { useConfigStore } from '@/features/vault/stores/configStore'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/settings')({
    component: RouteComponent
})

function RouteComponent() {
    const { userId, clearAuth } = useConfigStore()
    const [authDialogOpen, setAuthDialogOpen] = useState(false)

    return (
        <div className="flex flex-1 justify-center">
            <div className="max-w-3xl py-4 w-full">
                <h1 className="mb-4 text-3xl font-bold">settings</h1>

                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold mb-2">account</h2>
                        {userId ? (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    signed in
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => clearAuth()}
                                >
                                    sign out
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    not signed in
                                </p>
                                <Button onClick={() => setAuthDialogOpen(true)}>
                                    sign in / register
                                </Button>
                            </div>
                        )}
                    </div>

                    <Separator />

                    <VaultManagement />

                    <Separator />

                    <ThemeSettings />
                </div>

                <AuthDialog
                    open={authDialogOpen}
                    onOpenChange={setAuthDialogOpen}
                />
            </div>
        </div>
    )
}
