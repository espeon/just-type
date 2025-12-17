// src/features/graph/components/BacklinksPanel.tsx
import { useBacklinks } from '@/features/vault/hooks/useBacklinks'
import { useNavigate } from '@tanstack/react-router'

interface BacklinksPanelProps {
    documentId: string | undefined
}

export function BacklinksPanel({ documentId }: BacklinksPanelProps) {
    const backlinks = useBacklinks(documentId)
    const navigate = useNavigate()

    const handleLinkClick = (id: string) => {
        navigate({ to: `/editor/${id}` })
    }

    return (
        <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">Linked Mentions</h2>
            {backlinks.length > 0 ? (
                <ul className="space-y-2">
                    {backlinks.map((link) => (
                        <li key={link.id}>
                            <button
                                type="button"
                                onClick={() => handleLinkClick(link.id)}
                                className="text-sm text-foreground hover:underline text-left"
                            >
                                {link.title}
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground">
                    No linked mentions found.
                </p>
            )}
        </div>
    )
}
