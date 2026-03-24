import { useEffect, useState } from 'react'
import { MousePointer2, Square, Circle, Type, Hand, Trash2 } from 'lucide-react'
import { CanvasService } from './canvas-service'
import { Tool } from './types'
import { cn } from '@/lib/utils'

interface CanvasToolbarProps {
    service: CanvasService
}

export function CanvasToolbar({ service }: CanvasToolbarProps) {
    const [activeTool, setActiveTool] = useState<Tool>(service.getActiveTool())
    const [selectedCount, setSelectedCount] = useState(0)

    useEffect(() => {
        const unsubTool = service.onToolChange(setActiveTool)
        const unsubSelection = service.onSelectionChange((ids) => {
            setSelectedCount(ids.length)
        })

        return () => {
            unsubTool()
            unsubSelection()
        }
    }, [service])

    const tools: Array<{
        id: Tool
        icon: React.ComponentType<{ className?: string }>
        label: string
    }> = [
        { id: 'select', icon: MousePointer2, label: 'Select' },
        { id: 'rect', icon: Square, label: 'Rectangle' },
        { id: 'ellipse', icon: Circle, label: 'Ellipse' },
        { id: 'text', icon: Type, label: 'Text' },
        { id: 'pan', icon: Hand, label: 'Pan' }
    ]

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-lg shadow-lg border border-gray-200 p-2 flex gap-1 z-10">
            {tools.map(({ id, icon: Icon, label }) => (
                <button
                    key={id}
                    onClick={() => service.setTool(id)}
                    className={cn(
                        'p-2 rounded hover:bg-gray-100 transition-colors',
                        activeTool === id && 'bg-blue-100 text-blue-600'
                    )}
                    title={label}
                >
                    <Icon className="w-5 h-5" />
                </button>
            ))}

            {selectedCount > 0 && (
                <>
                    <div className="w-px bg-gray-300 mx-1" />
                    <button
                        onClick={() => service.deleteSelected()}
                        className="p-2 rounded hover:bg-red-100 hover:text-red-600 transition-colors"
                        title="Delete selected"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                    <span className="px-2 py-2 text-sm text-gray-600">
                        {selectedCount} selected
                    </span>
                </>
            )}
        </div>
    )
}
