import { open } from '@tauri-apps/plugin-dialog'
import {
    vaultCommands,
    Document,
    DocumentMetadata,
    VaultStructure
} from '../api/vaultCommands'
import { StorageProvider } from './types'

export class TauriStorageProvider implements StorageProvider {
    async chooseVaultLocation(): Promise<string | null> {
        try {
            console.log('About to call tauri open dialog...')
            const result = await open({
                directory: true,
                multiple: false,
                title: 'Select Vault Folder'
            })

            console.log('Tauri dialog result:', result, 'type:', typeof result)
            return result
        } catch (error) {
            console.error('Error opening dialog:', error)
            throw error
        }
    }

    async initializeVault(path: string): Promise<void> {
        return vaultCommands.initializeVault(path)
    }

    async listDocuments(vaultPath: string): Promise<string[]> {
        // TODO: implement if needed
        const docs = await this.readAllDocuments(vaultPath)
        return docs.map((d) => d.id)
    }

    async readAllDocuments(vaultPath: string): Promise<Document[]> {
        return vaultCommands.readAllDocuments(vaultPath)
    }

    async readDocument(vaultPath: string, id: string): Promise<Document> {
        return vaultCommands.readDocument(vaultPath, id)
    }

    async writeDocument(
        vaultPath: string,
        id: string,
        metadata: DocumentMetadata,
        state: string
    ): Promise<void> {
        return vaultCommands.writeDocument(vaultPath, id, metadata, state)
    }

    async createDocument(vaultPath: string, title: string): Promise<Document> {
        return vaultCommands.createDocument(vaultPath, title)
    }

    async deleteDocument(vaultPath: string, id: string): Promise<void> {
        return vaultCommands.deleteDocument(vaultPath, id)
    }

    async readVaultStructure(vaultPath: string): Promise<VaultStructure> {
        return vaultCommands.readVaultStructure(vaultPath)
    }

    async writeVaultStructure(
        vaultPath: string,
        structure: VaultStructure
    ): Promise<void> {
        return vaultCommands.writeVaultStructure(vaultPath, structure)
    }
}
