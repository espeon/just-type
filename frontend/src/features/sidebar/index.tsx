import { useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { useConfigStore } from '@/features/vault/stores/configStore'
import { useVaultStore } from '@/features/vault/stores/vaultStore'
import { useStorage } from '@/features/vault/storage/StorageContext'
import { VaultSetup } from '@/features/vault/components/VaultSetup'
import { VaultSwitcher } from '@/features/vault/components/VaultSwitcher'
import { FileExplorer } from '@/features/vault/components/FileExplorer'
import { Separator } from '@/components/ui/separator'
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
    const { loadVault, setStorage } = useVaultStore()

    useEffect(() => {
        setStorage(storage)
    }, [storage, setStorage])

    useEffect(() => {
        if (currentVault) {
            loadVault()
        }
    }, [currentVault, loadVault])

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
                    <Separator />
                    <Link
                        to={'/settings'}
                        className="p-2 text-sm text-muted-foreground"
                    >
                        Settings
                    </Link>
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
