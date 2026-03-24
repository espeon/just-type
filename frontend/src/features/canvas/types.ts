/**
 * Canvas element types - basic shapes and text for v1
 */
export type ElementType = 'rect' | 'ellipse' | 'text';

/**
 * Base canvas element structure
 * Mirrors affine's surface block element model
 */
export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  props: ElementProps;
}

/**
 * Type-specific properties for elements
 */
export type ElementProps = RectProps | EllipseProps | TextProps;

export interface RectProps {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
}

export interface EllipseProps {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface TextProps {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Viewport state for pan/zoom
 */
export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

/**
 * Tool types for canvas interaction
 */
export type Tool = 'select' | 'rect' | 'ellipse' | 'text' | 'pan';

/**
 * Selection state
 */
export interface SelectionState {
  selectedIds: Set<string>;
}
