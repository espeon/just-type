import { ReactNode, Suspense } from 'react'
import AppErrorPage from '@/features/errors/app-error'
import { ErrorBoundary } from 'react-error-boundary'
import { TooltipProvider } from '@/components/ui/tooltip'
import { StorageProviderComponent } from '@/features/vault/storage/StorageContext'

export default function AppProvider({ children }: { children: ReactNode }) {
    return (
        <Suspense fallback={<>Loading...</>}>
            <ErrorBoundary FallbackComponent={AppErrorPage}>
                <StorageProviderComponent>
                    <TooltipProvider>{children}</TooltipProvider>
                </StorageProviderComponent>
            </ErrorBoundary>
        </Suspense>
    )
}
