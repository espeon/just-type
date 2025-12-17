/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    Document,
    DocumentMetadata,
    VaultStructure
} from '../api/vaultCommands'
import { StorageProvider } from './types'

/**
 * Browser-based storage using IndexedDB
 * TODO: Implement for web version
 */
export class IndexedDBStorageProvider implements StorageProvider {
    async chooseVaultLocation(): Promise<string | null> {
        // For browser, vault "path" is just a name/id
        const name = prompt('Enter vault name:')
        return name
    }

    async initializeVault(_path: string): Promise<void> {
        // Create IndexedDB database for this vault
        throw new Error('IndexedDB storage not yet implemented')
    }

    async listDocuments(_vaultPath: string): Promise<string[]> {
        throw new Error('IndexedDB storage not yet implemented')
    }

    async readAllDocuments(_vaultPath: string): Promise<Document[]> {
        throw new Error('IndexedDB storage not yet implemented')
    }

    async readDocument(_vaultPath: string, _id: string): Promise<Document> {
        throw new Error('IndexedDB storage not yet implemented')
    }

    async writeDocument(
        _vaultPath: string,
        _id: string,
        _metadata: DocumentMetadata,
        _state: string
    ): Promise<void> {
        throw new Error('IndexedDB storage not yet implemented')
    }

    async createDocument(
        _vaultPath: string,
        _title: string
    ): Promise<Document> {
        throw new Error('IndexedDB storage not yet implemented')
    }

    async deleteDocument(_vaultPath: string, _id: string): Promise<void> {
        throw new Error('IndexedDB storage not yet implemented')
    }

    readVaultStructure(_vaultPath: string): Promise<VaultStructure> {
        throw new Error('IndexedDB storage not yet implemented')
    }

    writeVaultStructure(
        _vaultPath: string,
        _structure: VaultStructure
    ): Promise<void> {
        throw new Error('IndexedDB storage not yet implemented')
    }
}
