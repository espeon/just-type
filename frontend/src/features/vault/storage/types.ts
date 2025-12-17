import {
    Document,
    DocumentMetadata,
    VaultStructure
} from '../api/vaultCommands'

export interface StorageProvider {
    /**
     * Platform-specific vault location picker
     * Returns path/identifier for the vault
     */
    chooseVaultLocation(): Promise<string | null>

    /**
     * Initialize a new vault at the given location
     */
    initializeVault(path: string): Promise<void>

    /**
     * List all document IDs in the vault
     */
    listDocuments(vaultPath: string): Promise<string[]>

    /**
     * Read all documents with metadata and state
     */
    readAllDocuments(vaultPath: string): Promise<Document[]>

    /**
     * Read a single document by ID
     */
    readDocument(vaultPath: string, id: string): Promise<Document>

    /**
     * Write/update a document
     */
    writeDocument(
        vaultPath: string,
        id: string,
        metadata: DocumentMetadata,
        state: string
    ): Promise<void>

    /**
     * Create a new document with title
     */
    createDocument(vaultPath: string, title: string): Promise<Document>

    /**
     * Delete a document by ID
     */
    deleteDocument(vaultPath: string, id: string): Promise<void>

    /**
     * Read vault structure (document ordering and hierarchy)
     */
    readVaultStructure(vaultPath: string): Promise<VaultStructure>

    /**
     * Write vault structure
     */
    writeVaultStructure(
        vaultPath: string,
        structure: VaultStructure
    ): Promise<void>
}

export type StorageProviderType = 'tauri' | 'indexeddb' | 'server'
