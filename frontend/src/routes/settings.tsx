import { useState } from 'react'
import { ThemeSettings } from '@/features/themes/theme-settings'
import { AuthDialog } from '@/features/auth/components/AuthDialog'
import { VaultManagement } from '@/features/vault/components/VaultManagement'
import { ProfileSettings } from '@/features/vault/components/ProfileSettings'
import { DeletedVaults } from '@/features/vault/components/DeletedVaults'
import { useConfigStore } from '@/features/vault/stores/configStore'
import { Button } from '@/components/ui/button'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/settings')({
    component: RouteComponent
})

type SettingsTab = 'account' | 'vaults' | 'theme'

function RouteComponent() {
    const { userId, clearAuth } = useConfigStore()
    const [authDialogOpen, setAuthDialogOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<SettingsTab>('account')

    const tabs: { id: SettingsTab; label: string }[] = [
        { id: 'account', label: 'account' },
        { id: 'vaults', label: 'vaults' },
        { id: 'theme', label: 'theme' }
    ]

    return (
        <div className="flex flex-1 justify-center">
            <div className="max-w-4xl py-4 w-full px-4">
                <h1 className="mb-6 text-3xl font-semibold">settings</h1>

                <div className="flex gap-8">
                    {/* Sidebar */}
                    <div className="w-32 flex-shrink-0">
                        <div className="space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                        activeTab === tab.id
                                            ? 'bg-muted text-foreground font-medium'
                                            : 'text-muted-foreground hover:bg-muted/50'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {activeTab === 'account' && (
                            <div className="space-y-6">
                                {userId ? (
                                    <div>
                                        <h2 className="text-lg font-semibold mb-3">
                                            profile
                                        </h2>
                                        <div className="space-y-4">
                                            <ProfileSettings />
                                            <h2 className="text-lg font-semibold pt-6">
                                                authentication
                                            </h2>
                                            <Button
                                                variant="outline"
                                                onClick={() => clearAuth()}
                                            >
                                                sign out
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <h2 className="text-lg font-semibold mb-3">
                                            authentication
                                        </h2>
                                        <div className="space-y-2">
                                            <p className="text-sm text-muted-foreground">
                                                not signed in
                                            </p>
                                            <Button
                                                onClick={() =>
                                                    setAuthDialogOpen(true)
                                                }
                                            >
                                                sign in / register
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'vaults' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold mb-3">
                                        your vaults
                                    </h2>
                                    <VaultManagement />
                                </div>

                                <div>
                                    <h2 className="text-lg font-semibold mb-3">
                                        deleted vaults
                                    </h2>
                                    <DeletedVaults />
                                </div>
                            </div>
                        )}

                        {activeTab === 'theme' && (
                            <div>
                                <h2 className="text-lg font-semibold mb-3">
                                    appearance
                                </h2>
                                <ThemeSettings />
                            </div>
                        )}
                    </div>
                </div>

                <AuthDialog
                    open={authDialogOpen}
                    onOpenChange={setAuthDialogOpen}
                />
            </div>
        </div>
    )
}
