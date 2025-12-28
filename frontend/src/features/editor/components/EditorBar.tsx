import {
    ChevronRight,
    Cloud,
    CloudOff,
    Ellipsis,
    FileText,
    History,
    Users,
    Wifi,
    WifiOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EditorPathElement {
    path: string
    uuid: string
    imagePath?: string
}

function PathView({ path }: { path: EditorPathElement }) {
    return (
        <div className="flex items-center gap-2">
            {path.imagePath ? (
                <img
                    src={path.imagePath}
                    alt={path.path}
                    className="h-6 w-6 rounded bg-muted border border-border"
                />
            ) : (
                <div className="h-6 w-6 rounded bg-muted border border-border">
                    <FileText className="h-4 w-4 m-0.75 text-muted-foreground" />
                </div>
            )}
            <span>{path.path}</span>
        </div>
    )
}

interface EditorBarProps {
    editorPath: EditorPathElement[]
    connected: boolean
    peerCount: number
    onToggle: () => void
    serverSyncEnabled?: boolean
    serverConnected?: boolean
    serverSynced?: boolean
    onServerSyncRetry?: () => void
    onHistoryToggle?: () => void
    showHistory?: boolean
}

export function EditorBar({
    editorPath,
    connected,
    peerCount,
    onToggle,
    serverSyncEnabled,
    serverConnected,
    serverSynced,
    onServerSyncRetry,
    onHistoryToggle,
    showHistory
}: EditorBarProps) {
    return (
        <div className="flex items-center h-14 justify-between gap-2 px-4 py-1.5 border-b sticky top-0 left-0 z-10 pl-10 bg-background">
            <div className="flex items-center text-sm font-medium overflow-hidden">
                <ChevronRight className="inline-block mr-2 h-6 text-muted-foreground" />
                {editorPath.length > 2 ? (
                    <>
                        <PathView path={editorPath[0]} />
                        <span className="mx-1">/</span>
                        <Ellipsis className="inline-block mx-1 h-4 text-muted-foreground" />
                        <span className="mx-1">/</span>
                        <PathView path={editorPath[editorPath.length - 1]} />
                    </>
                ) : (
                    editorPath.map((el, index) => (
                        <span key={el.uuid}>
                            <PathView path={el} />
                            {index < editorPath.length - 1 && (
                                <span className="mx-1">/</span>
                            )}
                        </span>
                    ))
                )}
            </div>
            <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="gap-2"
            >
                {connected ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                    <WifiOff className="h-4 w-4 text-muted-foreground" />
                )}
                {connected ? 'Connected' : 'Collaborate'}
            </Button>

            {connected && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{peerCount + 1}</span>
                </div>
            )}

            {serverSyncEnabled && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onServerSyncRetry}
                    className="gap-1"
                    disabled={serverConnected}
                >
                    {serverConnected ? (
                        <Cloud
                            className={`h-4 w-4 ${serverSynced ? 'text-green-500' : 'text-yellow-500'}`}
                        />
                    ) : (
                        <CloudOff className="h-4 w-4" />
                    )}
                    <span className="text-sm text-muted-foreground">
                        {serverConnected
                            ? serverSynced
                                ? 'Synced'
                                : 'Syncing...'
                            : 'Offline'}
                    </span>
                </Button>
            )}

            {onHistoryToggle && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onHistoryToggle}
                    className="gap-2"
                >
                    <History className="h-4 w-4" />
                    {showHistory ? 'Hide' : 'History'}
                </Button>
            )}
        </div>
    )
}
