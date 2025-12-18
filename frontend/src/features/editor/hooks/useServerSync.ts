/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

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

        const updateState = (_state: any) => {
            setState({
                connected: provider.wsconnected,
                synced: provider.synced
            })

            // Only treat disconnection as error if we had a successful connection before
            // (indicating permission was granted, so a disconnect is unexpected)
            // Otherwise let y-websocket auto-reconnect
        }

        // Handle document updates
        const updateHandler = (_update: Uint8Array, _origin: any) => {
            // Document was updated
        }

        // Handle connection errors (like auth failures)
        const connectionErrorHandler = (error: Event) => {
            const wsError = error as unknown as { code: number; reason: string }
            // Check if it's an auth/permission error (4000+ are custom close codes)
            // 4003 = permission denied, 4001 = unauthorized, etc.
            if (wsError.code >= 4000) {
                if (onError) {
                    onError(
                        'Connection failed - you may not have permission to access this vault'
                    )
                }
                provider.destroy()
                providerRef.current = null
            }
        }

        provider.on('status', updateState)
        provider.on('sync', updateState)
        provider.on('connection-error', connectionErrorHandler)
        ydoc.on('update', updateHandler)

        providerRef.current = provider

        return () => {
            provider.off('connection-error', connectionErrorHandler)
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
