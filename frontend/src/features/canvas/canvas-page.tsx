import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { CanvasYDoc } from './yjs-canvas'
import { CanvasService } from './canvas-service'
import { CanvasRenderer } from './canvas-renderer'
import { CanvasToolbar } from './canvas-toolbar'
import { useConfigStore } from '@/features/vault/stores/configStore'

interface CanvasPageProps {
    canvasGuid: string
    vaultId: string
}

export function CanvasPage({ canvasGuid, vaultId }: CanvasPageProps) {
    const authToken = useConfigStore((state) => state.authToken)
    const [service, setService] = useState<CanvasService | null>(null)
    const [ydoc, setYdoc] = useState<CanvasYDoc | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

    const containerRef = useRef<HTMLDivElement>(null)
    const wsProviderRef = useRef<WebsocketProvider | null>(null)

    // Initialize Yjs and WebSocket
    useEffect(() => {
        const doc = new Y.Doc()
        const canvasYDoc = new CanvasYDoc(doc)
        const canvasService = new CanvasService(canvasYDoc)

        setYdoc(canvasYDoc)
        setService(canvasService)

        // Connect to WebSocket
        const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:4000/ws'
        const params: Record<string, string> = {
            doc: canvasGuid
        }
        if (authToken) {
            params.token = authToken
        }
        if (vaultId) {
            params.vaultId = vaultId
        }

        const provider = new WebsocketProvider(wsUrl, canvasGuid, doc, {
            connect: true,
            params,
            disableBc: true // disable broadcast channel
        })

        // Disable IndexedDB persistence - causes state vector issues
        provider.shouldConnect = false
        provider.shouldConnect = true

        wsProviderRef.current = provider

        provider.on('status', (event: { status: string }) => {
            console.log('WebSocket status:', event.status)
            setIsConnected(event.status === 'connected')
        })

        provider.on('sync', (synced: boolean) => {
            console.log('WebSocket synced:', synced)
            if (synced) {
                // Re-initialize CanvasYDoc after sync to get server structure
                const newCanvasYDoc = new CanvasYDoc(doc)
                const newService = new CanvasService(newCanvasYDoc)
                setYdoc(newCanvasYDoc)
                setService(newService)
                console.log(
                    'Re-initialized canvas after sync, elements:',
                    newCanvasYDoc.getElements().length
                )
            }
        })

        doc.on('update', (update: Uint8Array) => {
            console.log('Yjs doc update event:', update.length, 'bytes')
        })

        return () => {
            provider.destroy()
            doc.destroy()
        }
    }, [canvasGuid, authToken, vaultId])

    // Handle window resize
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const newDimensions = {
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                }
                console.log('Canvas dimensions:', newDimensions)
                setDimensions(newDimensions)
            }
        }

        updateDimensions()
        window.addEventListener('resize', updateDimensions)
        return () => window.removeEventListener('resize', updateDimensions)
    }, [])

    // Keyboard shortcuts
    useEffect(() => {
        if (!service) return

        const handleKeyDown = (e: KeyboardEvent) => {
            // Delete selected elements
            if (
                (e.key === 'Delete' || e.key === 'Backspace') &&
                !e.metaKey &&
                !e.ctrlKey
            ) {
                service.deleteSelected()
                e.preventDefault()
            }

            // Tool shortcuts
            if (e.key === 'v') {
                service.setTool('select')
            } else if (e.key === 'r') {
                service.setTool('rect')
            } else if (e.key === 'o') {
                service.setTool('ellipse')
            } else if (e.key === 't') {
                service.setTool('text')
            } else if (e.key === 'h' || e.key === ' ') {
                service.setTool('pan')
            }

            // Escape to deselect
            if (e.key === 'Escape') {
                service.clearSelection()
                service.setTool('select')
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [service])

    const isLoading = !service || !ydoc || dimensions.width === 0

    return (
        <div ref={containerRef} className="relative w-full h-full">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-50">
                    <div className="text-gray-500">Loading canvas...</div>
                </div>
            )}
            {/* Connection indicator */}
            <div className="absolute top-4 right-4 z-10">
                <div
                    className={`px-3 py-1 rounded-full text-sm ${
                        isConnected
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                    }`}
                >
                    {isConnected ? '● Connected' : '○ Connecting...'}
                </div>
            </div>

            {/* Toolbar */}
            {!isLoading && <CanvasToolbar service={service} />}

            {/* Canvas renderer */}
            {!isLoading && (
                <CanvasRenderer
                    service={service}
                    ydoc={ydoc}
                    width={dimensions.width}
                    height={dimensions.height}
                />
            )}

            {/* Help text */}
            <div className="absolute bottom-4 left-4 rounded-lg shadow-lg border bg-card p-3 text-sm z-10">
                <div className="font-medium mb-1">Keyboard shortcuts:</div>
                <div className="space-y-0.5">
                    <div>
                        <kbd className="px-1 py-0.5 rounded text-xs bg-muted">
                            V
                        </kbd>{' '}
                        Select
                    </div>
                    <div>
                        <kbd className="px-1 py-0.5 rounded text-xs bg-muted">
                            R
                        </kbd>{' '}
                        Rectangle
                    </div>
                    <div>
                        <kbd className="px-1 py-0.5 rounded text-xs bg-muted">
                            O
                        </kbd>{' '}
                        Ellipse
                    </div>
                    <div>
                        <kbd className="px-1 py-0.5 rounded text-xs bg-muted">
                            T
                        </kbd>{' '}
                        Text
                    </div>
                    <div>
                        <kbd className="px-1 py-0.5 rounded text-xs bg-muted">
                            H
                        </kbd>{' '}
                        Pan
                    </div>
                    <div>
                        <kbd className="px-1 py-0.5 rounded text-xs bg-muted">
                            Del
                        </kbd>{' '}
                        Delete
                    </div>
                    <div>
                        <kbd className="px-1 py-0.5 rounded text-xs bg-muted">
                            Esc
                        </kbd>{' '}
                        Deselect
                    </div>
                </div>
            </div>
        </div>
    )
}
