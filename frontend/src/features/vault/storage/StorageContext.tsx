import { createContext, useContext, ReactNode } from 'react'
import { StorageProvider } from './types'
import { TauriStorageProvider } from './TauriStorageProvider'
import { IndexedDBStorageProvider } from './IndexedDBStorageProvider'

const StorageContext = createContext<StorageProvider | null>(null)

interface StorageProviderProps {
    children: ReactNode
}

export function StorageProviderComponent({ children }: StorageProviderProps) {
    // Detect platform and provide appropriate storage
    const isTauri = '__TAURI_INTERNALS__' in window
    console.log('StorageProvider: isTauri =', isTauri)
    const storage = isTauri
        ? new TauriStorageProvider()
        : new IndexedDBStorageProvider()
    console.log('StorageProvider: using', storage.constructor.name)

    return (
        <StorageContext.Provider value={storage}>
            {children}
        </StorageContext.Provider>
    )
}

export function useStorage(): StorageProvider {
    const storage = useContext(StorageContext)
    if (!storage) {
        throw new Error(
            'useStorage must be used within StorageProviderComponent'
        )
    }
    return storage
}
