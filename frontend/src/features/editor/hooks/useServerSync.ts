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
    userName = 'Anonymous'
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
            console.log('WebSocket status update:', state)
            console.log('Provider state:', {
                wsconnected: provider.wsconnected,
                synced: provider.synced,
                url: provider.url,
                room: provider.room
            })
            setState({
                connected: provider.wsconnected,
                synced: provider.synced
            })
        }

        // Log initial provider state
        console.log('Initial provider state:', {
            wsconnected: provider.wsconnected,
            synced: provider.synced,
            url: provider.url,
            room: provider.room
        })

        // Log document updates
        const updateHandler = (update: Uint8Array, origin: any) => {
            console.log('Ydoc update fired:', {
                updateSize: update.length,
                origin
            })
        }

        provider.on('status', updateState)
        provider.on('sync', updateState)
        ydoc.on('update', updateHandler)

        providerRef.current = provider

        return () => {
            ydoc.off('update', updateHandler)
            provider.destroy()
            providerRef.current = null
        }
    }, [ydoc, documentId, enabled, serverUrl, authToken, userName])

    return {
        provider: providerRef.current,
        ...state
    }
}
