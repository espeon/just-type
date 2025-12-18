import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

// Helper functions to decode variable-length unsigned integers (varuint)
function readVarUint(data: Uint8Array, offset: number): number {
    let value = 0
    let shift = 0
    let pos = offset

    while (pos < data.length) {
        const byte = data[pos]
        value |= (byte & 0x7f) << shift
        pos++

        if ((byte & 0x80) === 0) {
            break
        }

        shift += 7
    }

    return value
}

function getVarUintByteLength(data: Uint8Array, offset: number): number {
    let pos = offset

    while (pos < data.length) {
        if ((data[pos] & 0x80) === 0) {
            return pos - offset + 1
        }
        pos++
    }

    return pos - offset
}

interface UseServerSyncOptions {
    ydoc: Y.Doc
    documentId: string
    vaultId?: string
    enabled: boolean
    serverUrl?: string
    authToken?: string | null
    userName?: string
    onMetadataReceived?: (metadata: DocumentMetadata) => void
    onError?: (error: string) => void
    key?: number
}

interface DocumentMetadata {
    guid: string
    vault_id: string
    title: string
    doc_type: string
    icon?: string
    description?: string
    tags: string[]
    parent_guid?: string
    created_at: number
    modified_at: number
}

interface SyncState {
    connected: boolean
    synced: boolean
}

export function useServerSync({
    ydoc,
    documentId,
    vaultId,
    enabled,
    serverUrl = 'ws://localhost:4000/ws',
    authToken,
    userName = 'Anonymous',
    onMetadataReceived,
    onError,
    key = 0
}: UseServerSyncOptions) {
    const providerRef = useRef<WebsocketProvider | null>(null)
    const [state, setState] = useState<SyncState>({
        connected: false,
        synced: false
    })

    useEffect(() => {
        if (!enabled || !authToken) {
            if (providerRef.current) {
                providerRef.current.destroy()
                providerRef.current = null
                setState({ connected: false, synced: false })
            }
            return
        }

        const params: Record<string, string> = {
            token: authToken || '',
            doc: documentId
        }
        if (vaultId) {
            params.vaultId = vaultId
        }

        const provider = new WebsocketProvider(serverUrl, documentId, ydoc, {
            connect: true,
            params
        })

        provider.awareness.setLocalStateField('user', {
            name: userName,
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`
        })

        const updateState = (state: any) => {
            setState({
                connected: provider.wsconnected,
                synced: provider.synced
            })

            // If connection was lost, it might be a permission error
            if (state.status === 'disconnected' && onError) {
                onError(
                    'Connection lost - you may not have permission to access this vault'
                )
                // Destroy provider to stop reconnection attempts
                provider.destroy()
                providerRef.current = null
            }
        }

        // Handle document updates
        const updateHandler = (update: Uint8Array, origin: any) => {
            // Document was updated
        }

        // Handle metadata messages from server (protocol type 2)
        const messageHandler = (message: Uint8Array) => {
            if (message.length < 1) return

            // Check if it's a metadata message (starts with 2)
            if (message[0] !== 2) {
                // Not a metadata message, ignore
                return
            }

            if (message.length < 2) return

            let offset = 0
            // Read protocol type (varuint)
            const protocolType = readVarUint(message, offset)
            offset += getVarUintByteLength(message, 0)

            if (protocolType !== 2) {
                // Not a metadata message
                return
            }

            // Read message type (varuint)
            const msgType = readVarUint(message, offset)
            offset += getVarUintByteLength(message, offset)

            // Read payload length (varuint)
            const payloadLen = readVarUint(message, offset)
            offset += getVarUintByteLength(message, offset)

            if (message.length < offset + payloadLen) {
                console.warn('Metadata message truncated')
                return
            }

            // Read JSON payload
            const payloadBytes = message.slice(offset, offset + payloadLen)
            const payloadStr = new TextDecoder().decode(payloadBytes)

            try {
                const metadata = JSON.parse(payloadStr) as DocumentMetadata
                console.log('Received metadata:', metadata)
                if (onMetadataReceived) {
                    onMetadataReceived(metadata)
                }
            } catch (e) {
                console.error('Failed to parse metadata:', e)
            }
        }

        provider.on('message', messageHandler)
        provider.on('status', updateState)
        provider.on('sync', updateState)
        ydoc.on('update', updateHandler)

        providerRef.current = provider

        return () => {
            provider.off('message', messageHandler)
            ydoc.off('update', updateHandler)
            provider.destroy()
            providerRef.current = null
        }
    }, [
        ydoc,
        documentId,
        enabled,
        serverUrl,
        authToken,
        userName,
        onMetadataReceived,
        onError,
        key
    ])

    return {
        provider: providerRef.current,
        ...state
    }
}
