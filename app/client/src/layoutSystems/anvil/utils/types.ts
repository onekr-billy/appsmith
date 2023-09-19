import type { ReactNode } from "react";
import type {
  FlexLayerAlignment,
  FlexVerticalAlignment,
  ResponsiveBehavior,
} from "./constants";
import type { WidgetType } from "WidgetProvider/factory";
import type { RenderMode } from "constants/WidgetConstants";

export interface DropZone {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export interface HighlightInfo {
  isNewLayer: boolean; // determines if a new layer / child has been added directly to the container.
  index: number; // index of the child in props.children.
  layerIndex: number; // index of layer in props.flexLayers.
  rowIndex: number; // index of highlight within a horizontal layer.
  alignment: FlexLayerAlignment; // alignment of the child in the layer.
  posX: number; // x position of the highlight.
  posY: number; // y position of the highlight.
  width: number; // width of the highlight.
  height: number; // height of the highlight.
  isVertical: boolean; // determines if the highlight is vertical or horizontal.
  canvasId: string; // widgetId of the canvas to which the highlight belongs.
  dropZone: DropZone; // size of the drop zone of this highlight.
}

export interface AnvilFlexComponentProps {
  alignment: FlexVerticalAlignment;
  children: ReactNode;
  componentHeight: number;
  componentWidth: number;
  hasAutoWidth: boolean;
  hasAutoHeight: boolean;
  isResizeDisabled?: boolean;
  flexVerticalAlignment: FlexVerticalAlignment;
  focused?: boolean;
  parentId?: string;
  renderMode?: RenderMode;
  responsiveBehavior?: ResponsiveBehavior;
  selected?: boolean;
  widgetId: string;
  widgetName: string;
  widgetSize?: { [key: string]: Record<string, string | number> };
  widgetType: WidgetType;
}
