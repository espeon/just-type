import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'

interface UseCollaborationOptions {
    ydoc: Y.Doc
    documentId: string
    enabled: boolean
    roomPassword?: string
    userName?: string
}

interface CollaborationState {
    connected: boolean
    peerCount: number
}

export function useCollaboration({
    ydoc,
    documentId,
    enabled,
    roomPassword,
    userName = 'Anonymous'
}: UseCollaborationOptions) {
    const providerRef = useRef<WebrtcProvider | null>(null)
    const [state, setState] = useState<CollaborationState>({
        connected: false,
        peerCount: 0
    })

    useEffect(() => {
        if (!enabled || !roomPassword) {
            if (providerRef.current) {
                providerRef.current.destroy()
                providerRef.current = null
                setState({ connected: false, peerCount: 0 })
            }
            return
        }

        const provider = new WebrtcProvider(documentId, ydoc, {
            password: roomPassword,
            signaling: [
                'wss://signaling.yjs.dev',
                'wss://y-webrtc-signaling-eu.herokuapp.com',
                'wss://y-webrtc-signaling-us.herokuapp.com'
            ],
            maxConns: 20,
            filterBcConns: true,
            peerOpts: {}
        })

        provider.awareness.setLocalStateField('user', {
            name: userName,
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`
        })

        const updateState = () => {
            setState({
                connected: provider.connected,
                peerCount: provider.awareness.getStates().size - 1
            })
        }

        provider.on('status', updateState)
        provider.on('peers', updateState)

        providerRef.current = provider

        return () => {
            provider.destroy()
            providerRef.current = null
        }
    }, [ydoc, documentId, enabled, roomPassword, userName])

    return {
        provider: providerRef.current,
        ...state
    }
}
