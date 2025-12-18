import { create } from 'zustand'
import {
    Document,
    DocumentMetadata,
    VaultStructure,
    DocumentStructure
} from '../api/vaultCommands'
import { VaultIndex } from '../types'
import { buildDocumentIndex } from '../utils/indexer'
import { useConfigStore } from './configStore'
import { StorageProvider } from '../storage/types'
import { vaultsApi } from '@/api/vaults'

interface VaultState {
    documents: Document[]
    index: VaultIndex | null
    structure: VaultStructure | null
    currentDocument: Document | null
    isLoading: boolean
    error: string | null
    storage: StorageProvider | null

    setStorage: (storage: StorageProvider) => void
    initializeVault: (name: string, path: string) => Promise<void>
    loadVault: () => Promise<void>
    buildIndex: () => Promise<void>
    createDocument: (title: string) => Promise<Document>
    openDocument: (id: string) => Promise<void>
    saveDocument: (id: string, state: string) => Promise<void>
    updateMetadata: (
        id: string,
        metadataUpdates: Partial<DocumentMetadata>
    ) => Promise<void>
    batchUpdateMetadata: (
        updates: Array<{
            id: string
            metadataUpdates: Partial<DocumentMetadata>
        }>
    ) => Promise<void>
    updateDocumentStructure: (updates: DocumentStructure[]) => Promise<void>
    deleteDocument: (id: string) => Promise<void>
}

export const useVaultStore = create<VaultState>((set, get) => ({
    documents: [],
    index: null,
    structure: null,
    currentDocument: null,
    isLoading: false,
    error: null,
    storage: null,

    setStorage: (storage: StorageProvider) => {
        set({ storage })
    },

    initializeVault: async (name: string, path: string) => {
        const { storage } = get()
        if (!storage)
            throw new Error(
                'Storage provider not initialized while initializing vault???'
            )

        try {
            set({ isLoading: true, error: null })
            await storage.initializeVault(path)

            // Add vault to config
            useConfigStore.getState().addVault(name, path)

            await get().buildIndex()
        } catch (error) {
            set({ error: String(error) })
            throw error
        } finally {
            set({ isLoading: false })
        }
    },

    loadVault: async () => {
        const vault = useConfigStore.getState().getCurrentVault()
        const { userId } = useConfigStore.getState()
        if (!vault) {
            set({
                documents: [],
                index: null,
                structure: null,
                currentDocument: null
            })
            return
        }

        await get().buildIndex()

        // Fetch batch metadata from server if vault is synced
        if (vault.syncEnabled && userId) {
            try {
                await vaultsApi.getDocumentsMetadata(vault.id)
            } catch (error) {
                console.error('Failed to fetch documents metadata:', error)
            }
        }
    },

    buildIndex: async () => {
        const { storage } = get()
        const vault = useConfigStore.getState().getCurrentVault()
        if (!vault || !storage) return

        try {
            set({ isLoading: true, error: null })
            const documents = await storage.readAllDocuments(vault.localPath)
            const structure = await storage.readVaultStructure(vault.localPath)
            const index = buildDocumentIndex(documents)
            set({ documents, index, structure })
        } catch (error) {
            set({ error: String(error) })
        } finally {
            set({ isLoading: false })
        }
    },

    createDocument: async (title: string) => {
        const { storage } = get()
        const vault = useConfigStore.getState().getCurrentVault()
        if (!vault) throw new Error('No vault selected')
        if (!storage) throw new Error('Storage provider not initialized')

        try {
            set({ isLoading: true, error: null })
            const document = await storage.createDocument(
                vault.localPath,
                title
            )
            await get().buildIndex()
            set({ currentDocument: document })
            return document
        } catch (error) {
            set({ error: String(error) })
            throw error
        } finally {
            set({ isLoading: false })
        }
    },

    openDocument: async (id: string) => {
        const { storage } = get()
        const vault = useConfigStore.getState().getCurrentVault()
        if (!vault) throw new Error('No vault selected')
        if (!storage)
            throw new Error(
                'Storage provider not initialized while opening doc'
            )

        try {
            set({ isLoading: true, error: null })
            const document = await storage.readDocument(vault.localPath, id)
            set({ currentDocument: document })
        } catch (error) {
            set({ error: String(error) })
        } finally {
            set({ isLoading: false })
        }
    },

    saveDocument: async (id: string, state: string) => {
        const { storage, currentDocument } = get()
        const vault = useConfigStore.getState().getCurrentVault()
        if (!vault || !currentDocument) return
        if (!storage)
            throw new Error('Storage provider not initialized while saving doc')

        try {
            const metadata = {
                ...currentDocument.metadata,
                modified: Date.now()
            }

            await storage.writeDocument(vault.localPath, id, metadata, state)

            // don't call buildIndex() here - it causes unnecessary re-renders
            // and the editor already has the state in memory
        } catch (error) {
            set({ error: String(error) })
            throw error
        }
    },

    updateMetadata: async (
        id: string,
        metadataUpdates: Partial<DocumentMetadata>
    ) => {
        const { storage, currentDocument, documents } = get()
        const vault = useConfigStore.getState().getCurrentVault()
        if (!vault) return
        if (!storage) throw new Error('Storage provider not initialized')

        try {
            // find the document to update
            const doc =
                currentDocument?.id === id
                    ? currentDocument
                    : documents.find((d) => d.id === id)

            if (!doc) return

            const metadata = {
                ...doc.metadata,
                ...metadataUpdates,
                modified: Date.now()
            }

            await storage.writeDocument(
                vault.localPath,
                id,
                metadata,
                doc.state
            )

            await get().buildIndex()

            // only update currentDocument if it's the one being modified
            // need to get fresh state after buildIndex
            const wasCurrentDocument = currentDocument?.id === id
            console.log('wasCurrentDocument', wasCurrentDocument)
            if (wasCurrentDocument) {
                const updatedDocuments = get().documents
                const freshDoc = updatedDocuments.find((d) => d.id === id)
                console.log('setting freshDoc', freshDoc)
                if (freshDoc) {
                    set({ currentDocument: freshDoc })
                }
            }
        } catch (error) {
            set({ error: String(error) })
            throw error
        }
    },

    batchUpdateMetadata: async (
        updates: Array<{
            id: string
            metadataUpdates: Partial<DocumentMetadata>
        }>
    ) => {
        const { storage, documents } = get()
        const vault = useConfigStore.getState().getCurrentVault()
        if (!vault) return
        if (!storage) throw new Error('Storage provider not initialized')

        console.log(
            '[batchUpdateMetadata] Starting batch update of',
            updates.length,
            'documents'
        )

        try {
            // update all documents
            await Promise.all(
                updates.map(async ({ id, metadataUpdates }) => {
                    const doc = documents.find((d) => d.id === id)
                    if (!doc) {
                        console.log('[batchUpdateMetadata] Doc not found:', id)
                        return
                    }

                    const metadata = {
                        ...doc.metadata,
                        ...metadataUpdates,
                        modified: Date.now()
                    }

                    console.log(
                        '[batchUpdateMetadata] Writing doc:',
                        doc.metadata.title,
                        'order:',
                        metadataUpdates.order
                    )

                    await storage.writeDocument(
                        vault.localPath,
                        id,
                        metadata,
                        doc.state
                    )
                })
            )

            console.log(
                '[batchUpdateMetadata] All writes complete, rebuilding index...'
            )

            // rebuild index once after all updates
            await get().buildIndex()

            console.log(
                '[batchUpdateMetadata] Index rebuilt, documents count:',
                get().documents.length
            )

            // log the order of documents after rebuild
            const rootDocs = get().documents.filter((d) => !d.metadata.parentId)
            console.log(
                '[batchUpdateMetadata] Root docs after rebuild:',
                rootDocs.map((d) => ({
                    title: d.metadata.title,
                    order: d.metadata.order
                }))
            )
        } catch (error) {
            console.error('[batchUpdateMetadata] Error:', error)
            set({ error: String(error) })
            throw error
        }
    },

    updateDocumentStructure: async (updates: DocumentStructure[]) => {
        const { storage, structure } = get()
        const vault = useConfigStore.getState().getCurrentVault()
        if (!vault || !storage) return

        console.log(
            '[updateDocumentStructure] Updating structure with',
            updates.length,
            'documents'
        )

        try {
            // merge updates into existing structure
            const existingDocs = structure?.documents || []
            const updateMap = new Map(updates.map((u) => [u.id, u]))

            // update existing entries or add new ones
            const updatedDocs = existingDocs.map((doc) =>
                updateMap.has(doc.id) ? updateMap.get(doc.id)! : doc
            )

            // add any new documents that weren't in the existing structure
            updates.forEach((update) => {
                if (!existingDocs.find((d) => d.id === update.id)) {
                    updatedDocs.push(update)
                }
            })

            const newStructure: VaultStructure = {
                documents: updatedDocs,
                version: 1
            }

            await storage.writeVaultStructure(vault.localPath, newStructure)
            set({ structure: newStructure })

            console.log(
                '[updateDocumentStructure] Structure updated successfully'
            )
        } catch (error) {
            console.error('[updateDocumentStructure] Error:', error)
            set({ error: String(error) })
            throw error
        }
    },

    deleteDocument: async (id: string) => {
        const { storage } = get()
        const vault = useConfigStore.getState().getCurrentVault()
        if (!vault) throw new Error('No vault selected')
        if (!storage) throw new Error('Storage provider not initialized')

        try {
            set({ isLoading: true, error: null })
            await storage.deleteDocument(vault.localPath, id)
            await get().buildIndex()
            if (get().currentDocument?.id === id) {
                set({ currentDocument: null })
            }
        } catch (error) {
            set({ error: String(error) })
            throw error
        } finally {
            set({ isLoading: false })
        }
    }
}))
