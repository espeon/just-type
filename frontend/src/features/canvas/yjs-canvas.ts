import * as Y from 'yjs'
import { CanvasElement, ViewportState } from './types'

/**
 * Yjs canvas document structure
 * Following affine's surface block pattern:
 * - surface (Y.Map) contains all canvas data
 *   - elements (Y.Array) contains all canvas elements
 *   - viewport (Y.Map) optional synced viewport state
 *   - metadata (Y.Map) canvas metadata (title, etc)
 */

export class CanvasYDoc {
    doc: Y.Doc
    surface: Y.Map<any>
    elements: Y.Array<any>
    viewport: Y.Map<any>
    metadata: Y.Map<any>

    constructor(doc: Y.Doc) {
        this.doc = doc
        this.surface = doc.getMap('surface')

        console.log(
            'CanvasYDoc constructor - surface keys:',
            Array.from(this.surface.keys())
        )

        // Get or create sub-structures
        this.elements = this.surface.get('elements') as Y.Array<any>
        console.log(
            'Got elements from surface:',
            this.elements,
            'length:',
            this.elements?.length
        )
        if (!this.elements) {
            console.log('Creating new elements array')
            this.elements = new Y.Array()
            this.surface.set('elements', this.elements)
        }

        this.viewport = this.surface.get('viewport') as Y.Map<any>
        if (!this.viewport) {
            this.viewport = new Y.Map()
            this.surface.set('viewport', this.viewport)
        }

        this.metadata = this.surface.get('metadata') as Y.Map<any>
        if (!this.metadata) {
            this.metadata = new Y.Map()
            this.surface.set('metadata', this.metadata)
        }

        console.log(
            'CanvasYDoc initialized - elements length:',
            this.elements.length
        )
    }

    /**
     * Add an element to the canvas
     */
    addElement(element: CanvasElement): void {
        console.log('CanvasYDoc.addElement called, doc transact starting')
        this.doc.transact(() => {
            this.elements.push([element])
            console.log('Element pushed to Y.Array, transaction ending')
        })
        console.log('Transaction complete, update should fire')
    }

    /**
     * Update an element by id
     */
    updateElement(id: string, updates: Partial<CanvasElement>): void {
        this.doc.transact(() => {
            const index = this.findElementIndex(id)
            if (index !== -1) {
                const element = this.elements.get(index)
                this.elements.delete(index, 1)
                this.elements.insert(index, [{ ...element, ...updates }])
            }
        })
    }

    /**
     * Delete an element by id
     */
    deleteElement(id: string): void {
        this.doc.transact(() => {
            const index = this.findElementIndex(id)
            if (index !== -1) {
                this.elements.delete(index, 1)
            }
        })
    }

    /**
     * Delete multiple elements by ids
     */
    deleteElements(ids: string[]): void {
        this.doc.transact(() => {
            const idsSet = new Set(ids)
            for (let i = this.elements.length - 1; i >= 0; i--) {
                const element = this.elements.get(i)
                if (idsSet.has(element.id)) {
                    this.elements.delete(i, 1)
                }
            }
        })
    }

    /**
     * Get all elements as plain objects
     */
    getElements(): CanvasElement[] {
        return this.elements.toArray()
    }

    /**
     * Get element by id
     */
    getElementById(id: string): CanvasElement | undefined {
        return this.elements.toArray().find((el) => el.id === id)
    }

    /**
     * Find element index by id
     */
    private findElementIndex(id: string): number {
        const elements = this.elements.toArray()
        return elements.findIndex((el) => el.id === id)
    }

    /**
     * Update viewport state
     */
    setViewport(viewport: ViewportState): void {
        this.doc.transact(() => {
            this.viewport.set('x', viewport.x)
            this.viewport.set('y', viewport.y)
            this.viewport.set('zoom', viewport.zoom)
        })
    }

    /**
     * Get viewport state
     */
    getViewport(): ViewportState {
        return {
            x: this.viewport.get('x') ?? 0,
            y: this.viewport.get('y') ?? 0,
            zoom: this.viewport.get('zoom') ?? 1
        }
    }

    /**
     * Set canvas title
     */
    setTitle(title: string): void {
        this.metadata.set('title', title)
    }

    /**
     * Get canvas title
     */
    getTitle(): string {
        return this.metadata.get('title') ?? 'Untitled Canvas'
    }

    /**
     * Subscribe to element changes
     */
    observeElements(callback: () => void): () => void {
        this.elements.observe(callback)
        return () => this.elements.unobserve(callback)
    }

    /**
     * Subscribe to viewport changes
     */
    observeViewport(callback: () => void): () => void {
        this.viewport.observe(callback)
        return () => this.viewport.unobserve(callback)
    }
}
