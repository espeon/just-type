import { v4 as uuidv4 } from 'uuid'
import { CanvasYDoc } from './yjs-canvas'
import { CanvasElement, Tool, ViewportState } from './types'

/**
 * CanvasService - Central controller for canvas operations
 * Inspired by affine's EdgelessRootService
 *
 * Manages:
 * - Viewport (pan/zoom)
 * - Selection
 * - Tools
 * - Element creation/manipulation
 */
export class CanvasService {
    private ydoc: CanvasYDoc
    private selectedIds: Set<string> = new Set()
    private activeTool: Tool = 'select'
    private viewport: ViewportState = { x: 0, y: 0, zoom: 1 }

    // Callbacks for external updates
    private onViewportChangeCallbacks: Array<
        (viewport: ViewportState) => void
    > = []
    private onSelectionChangeCallbacks: Array<(ids: string[]) => void> = []
    private onToolChangeCallbacks: Array<(tool: Tool) => void> = []

    constructor(ydoc: CanvasYDoc) {
        this.ydoc = ydoc

        // Initialize viewport from yjs
        this.viewport = ydoc.getViewport()

        // Observe yjs changes (for collaboration)
        ydoc.observeViewport(() => {
            this.viewport = ydoc.getViewport()
            this.notifyViewportChange()
        })
    }

    // ============== Viewport Management ==============

    getViewport(): ViewportState {
        return { ...this.viewport }
    }

    setViewport(viewport: Partial<ViewportState>): void {
        this.viewport = { ...this.viewport, ...viewport }
        this.notifyViewportChange()

        // Optionally sync viewport to yjs (for collaborative viewport)
        // Commented out to avoid syncing every pan/zoom
        // this.ydoc.setViewport(this.viewport);
    }

    pan(dx: number, dy: number): void {
        this.viewport.x += dx
        this.viewport.y += dy
        this.notifyViewportChange()
    }

    zoom(factor: number, origin?: { x: number; y: number }): void {
        if (origin) {
            // Zoom towards a specific point
            const worldOrigin = this.screenToWorld(origin.x, origin.y)
            this.viewport.zoom *= factor
            const newScreenOrigin = this.worldToScreen(
                worldOrigin.x,
                worldOrigin.y
            )
            this.viewport.x += origin.x - newScreenOrigin.x
            this.viewport.y += origin.y - newScreenOrigin.y
        } else {
            // Zoom towards center
            this.viewport.zoom *= factor
        }

        // Clamp zoom
        this.viewport.zoom = Math.max(0.1, Math.min(10, this.viewport.zoom))
        this.notifyViewportChange()
    }

    screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
        return {
            x: (screenX - this.viewport.x) / this.viewport.zoom,
            y: (screenY - this.viewport.y) / this.viewport.zoom
        }
    }

    worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
        return {
            x: worldX * this.viewport.zoom + this.viewport.x,
            y: worldY * this.viewport.zoom + this.viewport.y
        }
    }

    // ============== Selection Management ==============

    getSelectedIds(): string[] {
        return Array.from(this.selectedIds)
    }

    select(ids: string | string[]): void {
        const idsArray = Array.isArray(ids) ? ids : [ids]
        this.selectedIds = new Set(idsArray)
        this.notifySelectionChange()
    }

    addToSelection(ids: string | string[]): void {
        const idsArray = Array.isArray(ids) ? ids : [ids]
        idsArray.forEach((id) => this.selectedIds.add(id))
        this.notifySelectionChange()
    }

    removeFromSelection(ids: string | string[]): void {
        const idsArray = Array.isArray(ids) ? ids : [ids]
        idsArray.forEach((id) => this.selectedIds.delete(id))
        this.notifySelectionChange()
    }

    clearSelection(): void {
        this.selectedIds.clear()
        this.notifySelectionChange()
    }

    // ============== Tool Management ==============

    getActiveTool(): Tool {
        return this.activeTool
    }

    setTool(tool: Tool): void {
        this.activeTool = tool
        this.clearSelection()
        this.notifyToolChange()
    }

    // ============== Element Operations ==============

    createElement(
        type: CanvasElement['type'],
        x: number,
        y: number,
        width: number,
        height: number,
        props: CanvasElement['props']
    ): string {
        const maxZ = this.getMaxZIndex()
        const element: CanvasElement = {
            id: uuidv4(),
            type,
            x,
            y,
            width,
            height,
            rotation: 0,
            zIndex: maxZ + 1,
            props
        }

        console.log('Creating element:', element)
        this.ydoc.addElement(element)
        console.log('Elements after add:', this.ydoc.getElements().length)
        return element.id
    }

    updateElement(id: string, updates: Partial<CanvasElement>): void {
        this.ydoc.updateElement(id, updates)
    }

    deleteSelected(): void {
        if (this.selectedIds.size > 0) {
            this.ydoc.deleteElements(Array.from(this.selectedIds))
            this.clearSelection()
        }
    }

    moveSelected(dx: number, dy: number): void {
        this.selectedIds.forEach((id) => {
            const element = this.ydoc.getElementById(id)
            if (element) {
                this.ydoc.updateElement(id, {
                    x: element.x + dx,
                    y: element.y + dy
                })
            }
        })
    }

    bringToFront(id: string): void {
        const maxZ = this.getMaxZIndex()
        this.ydoc.updateElement(id, { zIndex: maxZ + 1 })
    }

    sendToBack(id: string): void {
        const minZ = this.getMinZIndex()
        this.ydoc.updateElement(id, { zIndex: minZ - 1 })
    }

    private getMaxZIndex(): number {
        const elements = this.ydoc.getElements()
        return elements.reduce((max, el) => Math.max(max, el.zIndex), 0)
    }

    private getMinZIndex(): number {
        const elements = this.ydoc.getElements()
        return elements.reduce((min, el) => Math.min(min, el.zIndex), 0)
    }

    // ============== Event Subscriptions ==============

    onViewportChange(callback: (viewport: ViewportState) => void): () => void {
        this.onViewportChangeCallbacks.push(callback)
        return () => {
            this.onViewportChangeCallbacks =
                this.onViewportChangeCallbacks.filter((cb) => cb !== callback)
        }
    }

    onSelectionChange(callback: (ids: string[]) => void): () => void {
        this.onSelectionChangeCallbacks.push(callback)
        return () => {
            this.onSelectionChangeCallbacks =
                this.onSelectionChangeCallbacks.filter((cb) => cb !== callback)
        }
    }

    onToolChange(callback: (tool: Tool) => void): () => void {
        this.onToolChangeCallbacks.push(callback)
        return () => {
            this.onToolChangeCallbacks = this.onToolChangeCallbacks.filter(
                (cb) => cb !== callback
            )
        }
    }

    private notifyViewportChange(): void {
        this.onViewportChangeCallbacks.forEach((cb) => cb(this.viewport))
    }

    private notifySelectionChange(): void {
        this.onSelectionChangeCallbacks.forEach((cb) =>
            cb(Array.from(this.selectedIds))
        )
    }

    private notifyToolChange(): void {
        this.onToolChangeCallbacks.forEach((cb) => cb(this.activeTool))
    }
}
