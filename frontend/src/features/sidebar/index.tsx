import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useConfigStore } from '@/features/vault/stores/configStore'
import { useVaultStore } from '@/features/vault/stores/vaultStore'
import { useStorage } from '@/features/vault/storage/StorageContext'
import { VaultSetup } from '@/features/vault/components/VaultSetup'
import { VaultSwitcher } from '@/features/vault/components/VaultSwitcher'
import { FileExplorer } from '@/features/vault/components/FileExplorer'
import { usersApi } from '@/api/users'
import { getInitials, getAvatarColor } from '@/lib/utils'
import { User } from '@/api/types'
import {
    Sidebar,
    SidebarProvider,
    SidebarInset,
    SidebarContent,
    SidebarTrigger,
    SidebarRail,
    SidebarFooter
} from '@/components/ui/sidebar'

export function SidebarWrapper({ children }: { children: React.ReactNode }) {
    const storage = useStorage()
    const currentVault = useConfigStore((state) => state.getCurrentVault())
    const userId = useConfigStore((state) => state.userId)
    const { loadVault, setStorage } = useVaultStore()
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        setStorage(storage)
    }, [storage, setStorage])

    useEffect(() => {
        if (currentVault) {
            loadVault()
        }
    }, [currentVault, loadVault])

    useEffect(() => {
        if (userId) {
            usersApi
                .getCurrentUser()
                .then(setUser)
                .catch((err) =>
                    console.error('Failed to load user profile', err)
                )
        }
    }, [userId])

    if (!currentVault) {
        return <VaultSetup />
    }

    return (
        <SidebarProvider>
            <Sidebar>
                <Link to="/" className="text-2xl pl-5 mt-4 border-b pb-4">
                    <div>just type_</div>
                </Link>
                <SidebarRail />
                <SidebarContent>
                    <FileExplorer />
                </SidebarContent>
                <SidebarFooter>
                    <VaultSwitcher />
                    {userId && user ? (
                        <>
                            <Link
                                to={'/settings'}
                                className="flex items-center gap-2 p-2 rounded-md bg-background border hover:bg-muted transition"
                            >
                                <div
                                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 ${getAvatarColor(
                                        user.display_name || user.username
                                    )}`}
                                >
                                    {user.avatar_url ? (
                                        <img
                                            src={user.avatar_url}
                                            alt={
                                                user.display_name ||
                                                user.username ||
                                                'User'
                                            }
                                            className="h-full w-full rounded-full object-cover"
                                        />
                                    ) : (
                                        getInitials(
                                            user.display_name || user.username
                                        )
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {user.display_name ||
                                            user.username ||
                                            'Profile'}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {user.username
                                            ? `@${user.username}`
                                            : user.email}
                                    </p>
                                </div>
                            </Link>
                        </>
                    ) : (
                        <Link
                            className="flex items-center gap-2 p-2 rounded-md bg-background border hover:bg-muted transition"
                            to="/settings"
                        >
                            settings
                        </Link>
                    )}
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <div className="p-2 fixed top-0 z-999">
                    <SidebarTrigger />
                </div>
                {children}
            </SidebarInset>
        </SidebarProvider>
    )
}
