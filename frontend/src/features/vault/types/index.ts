export interface DocumentHeader {
    level: 1 | 2 | 3 | 4 | 5 | 6
    text: string
    slug: string
}

export interface DocumentIndex {
    id: string
    title: string
    links: string[] // Document IDs this doc links to
    backlinks: string[] // Document IDs that link to this doc
    headers: DocumentHeader[]
}

export interface VaultIndex {
    documents: Map<string, DocumentIndex>
    lastUpdated: number
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
