import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'

export interface DocumentMetadata {
    title: string
    created: number
    modified: number
    tags: string[]
    backlinks: string[]
    icon?: string
    description?: string
    parentId?: string
    type?: 'document' | 'folder'
    order?: number
}

export interface Document {
    version: number
    id: string
    metadata: DocumentMetadata
    state: string
}

export interface DocumentStructure {
    id: string
    parentId?: string
    order: number
}

export interface VaultStructure {
    documents: DocumentStructure[]
    version: number
}

export const vaultCommands = {
    async chooseVaultLocation(): Promise<string | null> {
        const selected = await open({
            directory: true,
            multiple: false,
            title: 'Choose Vault Location'
        })
        return selected
    },

    async initializeVault(path: string): Promise<void> {
        await invoke('initialize_vault', { path })
    },

    async listDocuments(vaultPath: string): Promise<string[]> {
        return await invoke('list_documents', { vaultPath })
    },

    async readAllDocuments(vaultPath: string): Promise<Document[]> {
        return await invoke('read_all_documents', { vaultPath })
    },

    async readDocument(vaultPath: string, id: string): Promise<Document> {
        return await invoke('read_document', { vaultPath, id })
    },

    async writeDocument(
        vaultPath: string,
        id: string,
        metadata: DocumentMetadata,
        state: string
    ): Promise<void> {
        await invoke('write_document', { vaultPath, id, metadata, state })
    },

    async deleteDocument(vaultPath: string, id: string): Promise<void> {
        await invoke('delete_document', { vaultPath, id })
    },

    async createDocument(vaultPath: string, title: string): Promise<Document> {
        return await invoke('create_document', { vaultPath, title })
    },

    async readVaultStructure(vaultPath: string): Promise<VaultStructure> {
        return await invoke('read_vault_structure', { vaultPath })
    },

    async writeVaultStructure(
        vaultPath: string,
        structure: VaultStructure
    ): Promise<void> {
        await invoke('write_vault_structure', { vaultPath, structure })
    }
}
