import * as Y from 'yjs'
import { decodeYjsState } from '@/lib/yjs/serializer'
import { Document } from '../api/vaultCommands'
import { DocumentHeader, DocumentIndex, VaultIndex } from '../types'

// Basic slugify function
function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w-]+/g, '') // Remove all non-word chars
        .replace(/--+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, '') // Trim - from end of text
}

interface InlineContent {
    text: string
}

/**
 * Extract headers from a Yjs document.
 * Assumes BlockNote's structure where content is a Y.XmlFragment
 * containing a Y.XmlText with a JSON string of blocks.
 */
function extractHeaders(doc: Y.Doc): DocumentHeader[] {
    const headers: DocumentHeader[] = []
    const content = doc.get('content', Y.XmlFragment)
    if (!content) return headers

    // The content is stored as a JSON string inside an XML text node
    const yText = content.get(0)
    if (!(yText instanceof Y.XmlText)) return headers

    try {
        const blocks = JSON.parse(yText.toString())
        if (!Array.isArray(blocks)) return headers

        for (const block of blocks) {
            if (block.type === 'heading') {
                const level = (block.props.level || '1') as '1' | '2' | '3'
                const text = block.content
                    .map((inline: InlineContent) => inline.text)
                    .join('')
                if (text) {
                    headers.push({
                        level: parseInt(level, 10) as DocumentHeader['level'],
                        text,
                        slug: slugify(text)
                    })
                }
            }
        }
    } catch (e) {
        console.error('Failed to parse block content for indexing:', e)
    }

    return headers
}

/**
 * Extract wiki links from text content.
 * Matches [[document-id]] or [[document-id#header-slug]]
 */
export function extractWikiLinks(content: string): string[] {
    const linkRegex = /\[\[([a-zA-Z0-9-]+)(?:#[^\]]+)?\]\]/g
    const links: string[] = []
    let match

    while ((match = linkRegex.exec(content)) !== null) {
        links.push(match[1])
    }

    return links
}

/**
 * Get the full text content from a Yjs document.
 */
function getDocText(doc: Y.Doc): string {
    const content = doc.get('content', Y.XmlFragment)
    if (!content) return ''

    const yText = content.get(0)
    if (!(yText instanceof Y.XmlText)) return ''

    try {
        const blocks = JSON.parse(yText.toString())
        if (!Array.isArray(blocks)) return ''

        return blocks
            .map((block) =>
                (block.content || [])
                    .map((inline: InlineContent) => inline.text)
                    .join('')
            )
            .join('\n')
    } catch {
        return ''
    }
}

/**
 * Build document index from all documents
 */
export function buildDocumentIndex(documents: Document[]): VaultIndex {
    const docMap = new Map<string, DocumentIndex>()

    // First pass: create index entries and extract links/headers
    for (const doc of documents) {
        const ydoc = new Y.Doc()
        decodeYjsState(doc.state, ydoc)

        const textContent = getDocText(ydoc)
        const links = extractWikiLinks(textContent)
        const headers = extractHeaders(ydoc)

        docMap.set(doc.id, {
            id: doc.id,
            title: doc.metadata.title,
            links,
            backlinks: [],
            headers
        })

        // Clean up the Y.Doc instance
        ydoc.destroy()
    }

    // Second pass: build backlinks
    for (const [docId, docIndex] of docMap.entries()) {
        for (const linkedId of docIndex.links) {
            const linkedIndex = docMap.get(linkedId)
            if (linkedIndex) {
                linkedIndex.backlinks.push(docId)
            }
        }
    }

    return {
        documents: docMap,
        lastUpdated: Date.now()
    }
}

/**
 * Search documents by title (fuzzy)
 */
export function searchDocuments(
    index: VaultIndex,
    query: string
): DocumentIndex[] {
    const lowerQuery = query.toLowerCase()
    const results: DocumentIndex[] = []

    for (const docIndex of index.documents.values()) {
        if (docIndex.title.toLowerCase().includes(lowerQuery)) {
            results.push(docIndex)
        }
    }

    return results.sort((a, b) => a.title.localeCompare(b.title))
}
