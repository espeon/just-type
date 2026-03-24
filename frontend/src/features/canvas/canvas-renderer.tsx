import { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Rect, Ellipse, Text, Transformer } from 'react-konva'
import Konva from 'konva'
import { CanvasService } from './canvas-service'
import { CanvasYDoc } from './yjs-canvas'
import {
    CanvasElement,
    ViewportState,
    RectProps,
    EllipseProps,
    TextProps
} from './types'

interface CanvasRendererProps {
    service: CanvasService
    ydoc: CanvasYDoc
    width: number
    height: number
}

export function CanvasRenderer({
    service,
    ydoc,
    width,
    height
}: CanvasRendererProps) {
    const [elements, setElements] = useState<CanvasElement[]>([])
    const [viewport, setViewport] = useState<ViewportState>(
        service.getViewport()
    )
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [activeTool, setActiveTool] = useState(service.getActiveTool())

    const stageRef = useRef<Konva.Stage>(null)
    const transformerRef = useRef<Konva.Transformer>(null)

    // Drawing state for shape creation
    const [isDrawing, setIsDrawing] = useState(false)
    const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(
        null
    )

    // Subscribe to yjs element changes
    useEffect(() => {
        const updateElements = () => {
            setElements(ydoc.getElements())
        }

        updateElements()
        return ydoc.observeElements(updateElements)
    }, [ydoc])

    // Subscribe to service changes
    useEffect(() => {
        const unsubViewport = service.onViewportChange(setViewport)
        const unsubSelection = service.onSelectionChange(setSelectedIds)
        const unsubTool = service.onToolChange(setActiveTool)

        return () => {
            unsubViewport()
            unsubSelection()
            unsubTool()
        }
    }, [service])

    // Update transformer when selection changes
    useEffect(() => {
        if (transformerRef.current && stageRef.current) {
            const selectedNodes = selectedIds
                .map((id) => stageRef.current?.findOne(`#${id}`))
                .filter(
                    (node): node is Konva.Node =>
                        node !== null && node !== undefined
                )

            transformerRef.current.nodes(selectedNodes)
            transformerRef.current.getLayer()?.batchDraw()
        }
    }, [selectedIds])

    // Handle mouse down
    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (activeTool === 'pan') return

        const stage = e.target.getStage()
        if (!stage) return

        const pointerPos = stage.getPointerPosition()
        if (!pointerPos) return

        const worldPos = service.screenToWorld(pointerPos.x, pointerPos.y)

        if (activeTool === 'select') {
            // Handle selection
            const clickedOnEmpty = e.target === stage
            if (clickedOnEmpty) {
                service.clearSelection()
            }
        } else if (activeTool === 'rect' || activeTool === 'ellipse') {
            // Start drawing shape
            setIsDrawing(true)
            setDrawStart(worldPos)
        } else if (activeTool === 'text') {
            // Create text element
            service.createElement('text', worldPos.x, worldPos.y, 200, 40, {
                text: 'Double click to edit',
                fontSize: 16,
                fill: '#000000'
            })
        }
    }

    // Handle mouse move
    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!isDrawing || !drawStart) return

        const stage = e.target.getStage()
        if (!stage) return

        const pointerPos = stage.getPointerPosition()
        if (!pointerPos) return

        // const worldPos = service.screenToWorld(pointerPos.x, pointerPos.y);

        // Update preview (we could add a preview shape here)
    }

    // Handle mouse up
    const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!isDrawing || !drawStart) return

        const stage = e.target.getStage()
        if (!stage) return

        const pointerPos = stage.getPointerPosition()
        if (!pointerPos) return

        const worldPos = service.screenToWorld(pointerPos.x, pointerPos.y)

        const width = Math.abs(worldPos.x - drawStart.x)
        const height = Math.abs(worldPos.y - drawStart.y)
        const x = Math.min(drawStart.x, worldPos.x)
        const y = Math.min(drawStart.y, worldPos.y)

        // Only create if dragged significantly
        if (width > 10 && height > 10) {
            if (activeTool === 'rect') {
                service.createElement('rect', x, y, width, height, {
                    fill: '#3b82f6',
                    stroke: '#1e40af',
                    strokeWidth: 2
                })
            } else if (activeTool === 'ellipse') {
                service.createElement('ellipse', x, y, width, height, {
                    fill: '#10b981',
                    stroke: '#047857',
                    strokeWidth: 2
                })
            }
        }

        setIsDrawing(false)
        setDrawStart(null)
    }

    // Handle wheel for zoom
    const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault()

        const stage = e.target.getStage()
        if (!stage) return

        const pointer = stage.getPointerPosition()
        if (!pointer) return

        const zoomFactor = e.evt.deltaY > 0 ? 0.9 : 1.1
        service.zoom(zoomFactor, pointer)
    }

    // Handle element click
    const handleElementClick = (
        e: Konva.KonvaEventObject<MouseEvent>,
        id: string
    ) => {
        if (activeTool !== 'select') return

        const isSelected = selectedIds.includes(id)

        if (e.evt.shiftKey) {
            if (isSelected) {
                service.removeFromSelection(id)
            } else {
                service.addToSelection(id)
            }
        } else {
            service.select(id)
        }
    }

    // Handle element drag
    const handleElementDragEnd = (
        e: Konva.KonvaEventObject<DragEvent>,
        id: string
    ) => {
        const node = e.target
        const element = ydoc.getElementById(id)

        if (element) {
            const worldPos = service.screenToWorld(node.x(), node.y())
            service.updateElement(id, {
                x: worldPos.x,
                y: worldPos.y
            })
        }
    }

    // Handle transformer transform end
    const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
        const node = e.target
        const id = node.id()
        const element = ydoc.getElementById(id)

        if (element) {
            const scaleX = node.scaleX()
            const scaleY = node.scaleY()

            service.updateElement(id, {
                x: node.x() / viewport.zoom,
                y: node.y() / viewport.zoom,
                width: (node.width() * scaleX) / viewport.zoom,
                height: (node.height() * scaleY) / viewport.zoom,
                rotation: node.rotation()
            })

            // Reset scale after applying to dimensions
            node.scaleX(1)
            node.scaleY(1)
        }
    }

    return (
        <div className="w-full h-full">
            <Stage
                ref={stageRef}
                width={width}
                height={height}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
                scaleX={viewport.zoom}
                scaleY={viewport.zoom}
                x={viewport.x}
                y={viewport.y}
            >
                {/* Static layer - canvas elements */}
                <Layer>
                    {elements
                        .sort((a, b) => a.zIndex - b.zIndex)
                        .map((element) => {
                            if (element.type === 'rect') {
                                const props = element.props as RectProps
                                return (
                                    <Rect
                                        key={element.id}
                                        id={element.id}
                                        x={element.x}
                                        y={element.y}
                                        width={element.width}
                                        height={element.height}
                                        rotation={element.rotation}
                                        fill={props.fill}
                                        stroke={props.stroke}
                                        strokeWidth={props.strokeWidth}
                                        cornerRadius={
                                            'cornerRadius' in props
                                                ? props.cornerRadius
                                                : 0
                                        }
                                        draggable={activeTool === 'select'}
                                        onClick={(e) =>
                                            handleElementClick(e, element.id)
                                        }
                                        onDragEnd={(e) =>
                                            handleElementDragEnd(e, element.id)
                                        }
                                        onTransformEnd={handleTransformEnd}
                                    />
                                )
                            } else if (element.type === 'ellipse') {
                                const props = element.props as EllipseProps
                                return (
                                    <Ellipse
                                        key={element.id}
                                        id={element.id}
                                        x={element.x + element.width / 2}
                                        y={element.y + element.height / 2}
                                        radiusX={element.width / 2}
                                        radiusY={element.height / 2}
                                        rotation={element.rotation}
                                        fill={props.fill}
                                        stroke={props.stroke}
                                        strokeWidth={props.strokeWidth}
                                        draggable={activeTool === 'select'}
                                        onClick={(e) =>
                                            handleElementClick(e, element.id)
                                        }
                                        onDragEnd={(e) =>
                                            handleElementDragEnd(e, element.id)
                                        }
                                        onTransformEnd={handleTransformEnd}
                                    />
                                )
                            } else if (element.type === 'text') {
                                const props = element.props as TextProps
                                return (
                                    <Text
                                        key={element.id}
                                        id={element.id}
                                        x={element.x}
                                        y={element.y}
                                        width={element.width}
                                        height={element.height}
                                        text={props.text}
                                        fontSize={props.fontSize}
                                        fontFamily={props.fontFamily}
                                        fill={props.fill}
                                        align={props.align}
                                        rotation={element.rotation}
                                        draggable={activeTool === 'select'}
                                        onClick={(e) =>
                                            handleElementClick(e, element.id)
                                        }
                                        onDragEnd={(e) =>
                                            handleElementDragEnd(e, element.id)
                                        }
                                        onTransformEnd={handleTransformEnd}
                                    />
                                )
                            }

                            return null
                        })}
                </Layer>

                {/* Interactive layer - selection handles */}
                <Layer>
                    <Transformer
                        ref={transformerRef}
                        boundBoxFunc={(oldBox, newBox) => {
                            // Limit resize
                            if (newBox.width < 10 || newBox.height < 10) {
                                return oldBox
                            }
                            return newBox
                        }}
                    />
                </Layer>
            </Stage>
        </div>
    )
}
