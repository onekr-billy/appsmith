import type { AppState } from "@appsmith/reducers";
import { getColorWithOpacity } from "constants/DefaultTheme";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import type { CSSProperties } from "react";
import React, { useMemo, useRef } from "react";
import styled from "styled-components";
import type { WidgetProps } from "widgets/BaseWidget";
import { useSelector } from "react-redux";
import {
  getIsAutoLayout,
  previewModeSelector,
  snipingModeSelector,
} from "selectors/editorSelectors";
import {
  isCurrentWidgetFocused,
  isWidgetSelected,
} from "selectors/widgetSelectors";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import {
  useShowTableFilterPane,
  useWidgetDragResize,
} from "utils/hooks/dragResizeHooks";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";
import { useDragImageGenerator } from "pages/Editor/useDragImageGenerator";

const DraggableWrapper = styled.div`
  display: block;
  flex-direction: column;
  width: 100%;
  height: 100%;
  user-select: none;
  cursor: grab;
`;

type DraggableComponentProps = WidgetProps;

// Widget Boundaries which is shown to indicate the boundaries of the widget
const WidgetBoundaries = styled.div`
  z-index: 0;
  width: calc(100% + ${WIDGET_PADDING - 2}px);
  height: calc(100% + ${WIDGET_PADDING - 2}px);
  position: absolute;
  border: 1px dashed
    ${(props) => getColorWithOpacity(props.theme.colors.textAnchor, 0.5)};
  pointer-events: none;
  top: 0;
  position: absolute;
  left: 0;
`;

/**
 * can drag helper function to know if drag and drop should apply
 *
 * @param isResizingOrDragging
 * @param isDraggingDisabled
 * @param props
 * @param isSnipingMode
 * @param isPreviewMode
 * @returns
 */
export const canDrag = (
  isResizingOrDragging: boolean,
  isDraggingDisabled: boolean,
  props: any,
  isSnipingMode: boolean,
  isPreviewMode: boolean,
  isAppSettingsPaneWithNavigationTabOpen: boolean,
) => {
  return (
    !isResizingOrDragging &&
    !isDraggingDisabled &&
    !props?.dragDisabled &&
    !isSnipingMode &&
    !isPreviewMode &&
    !isAppSettingsPaneWithNavigationTabOpen
  );
};

function DraggableComponent(props: DraggableComponentProps) {
  // Dispatch hook handy to set a widget as focused/selected
  const { focusWidget, selectWidget } = useWidgetSelection();
  const isAutoLayout = useSelector(getIsAutoLayout);
  const isSnipingMode = useSelector(snipingModeSelector);
  const isPreviewMode = useSelector(previewModeSelector);
  const isAppSettingsPaneWithNavigationTabOpen = useSelector(
    getIsAppSettingsPaneWithNavigationTabOpen,
  );
  // Dispatch hook handy to set any `DraggableComponent` as dragging/ not dragging
  // The value is boolean
  const { setDraggingState } = useWidgetDragResize();
  const showTableFilterPane = useShowTableFilterPane();

  const isSelected = useSelector(isWidgetSelected(props.widgetId));
  // This state tels us which widget is focused
  // The value is the widgetId of the focused widget.
  const isFocused = useSelector(isCurrentWidgetFocused(props.widgetId));

  // This state tells us whether a `ResizableComponent` is resizing
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );

  // This state tells us whether a `DraggableComponent` is dragging
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );

  const isDraggingSibling = useSelector(
    (state) =>
      state.ui.widgetDragResize?.dragDetails?.draggedOn === props.parentId,
  );

  // This state tells us to disable dragging,
  // This is usually true when widgets themselves implement drag/drop
  // This flag resolves conflicting drag/drop triggers.
  const isDraggingDisabled: boolean = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDraggingDisabled,
  );

  // True when any widget is dragging or resizing, including this one
  const isResizingOrDragging = !!isResizing || !!isDragging;
  const isCurrentWidgetDragging = isDragging && isSelected;
  const isCurrentWidgetResizing = isResizing && isSelected;
  const showBoundary =
    !props.isFlexChild && (isCurrentWidgetDragging || isDraggingSibling);
  const { getWidgetDragImage, resetCanvas } = useDragImageGenerator();

  // When mouse is over this draggable
  const handleMouseOver = (e: any) => {
    focusWidget &&
      !isResizingOrDragging &&
      !isFocused &&
      !props.resizeDisabled &&
      focusWidget(props.widgetId);
    e.stopPropagation();
  };
  const shouldRenderComponent =
    props.isFlexChild || !(isSelected && isDragging);
  // Display this draggable based on the current drag state
  const dragWrapperStyle: CSSProperties = {
    display: !props.isFlexChild && isCurrentWidgetDragging ? "none" : "block",
  };
  const dragBoundariesStyle: React.CSSProperties = useMemo(() => {
    return {
      opacity: !isResizingOrDragging || isCurrentWidgetResizing ? 0 : 1,
    };
  }, [isResizingOrDragging, isCurrentWidgetResizing]);

  const classNameForTesting = `t--draggable-${props.type
    .split("_")
    .join("")
    .toLowerCase()}`;

  const allowDrag = canDrag(
    isResizingOrDragging,
    isDraggingDisabled,
    props,
    isSnipingMode,
    isPreviewMode,
    isAppSettingsPaneWithNavigationTabOpen,
  );
  const className = `${classNameForTesting}`;
  const draggableRef = useRef<HTMLDivElement>(null);
  const onDragStart = (e: any) => {
    e.stopPropagation();
    // allowDrag check is added as react jest test simulation is not respecting default behaviour
    // of draggable=false and triggering onDragStart. allowDrag condition check is purely for the test cases.
    if (allowDrag && draggableRef.current && !(e.metaKey || e.ctrlKey)) {
      if (!isFocused) return;

      if (!isSelected) {
        selectWidget(SelectionRequestType.One, [props.widgetId]);
      }

      const widgetHeight = props.bottomRow - props.topRow;
      const widgetWidth = props.rightColumn - props.leftColumn;
      const bounds = draggableRef.current.getBoundingClientRect();
      const startPoints = {
        top: Math.min(
          Math.max((e.clientY - bounds.top) / props.parentRowSpace, 0),
          widgetHeight - 1,
        ),
        left: Math.min(
          Math.max((e.clientX - bounds.left) / props.parentColumnSpace, 0),
          widgetWidth - 1,
        ),
      };
      showTableFilterPane();
      setDraggingState({
        isDragging: true,
        dragGroupActualParent: props.parentId || "",
        draggingGroupCenter: { widgetId: props.widgetId },
        startPoints,
        draggedOn: props.parentId,
      });
      if (isAutoLayout) {
        e.dataTransfer.setData(
          "text",
          JSON.stringify(props.widgetId || "widget"),
        );
        const canvas = getWidgetDragImage(props.widgetName);
        e.dataTransfer.setDragImage(canvas, 0, 0);

        setTimeout(() => {
          resetCanvas();
        }, 100);
      } else {
        e.preventDefault();
      }
    }
  };

  return (
    <DraggableWrapper
      className={className}
      data-testid={isSelected ? "t--selected" : ""}
      draggable
      onDragStart={onDragStart}
      onMouseOver={handleMouseOver}
      ref={draggableRef}
      style={dragWrapperStyle}
    >
      {shouldRenderComponent && props.children}
      {showBoundary && (
        <WidgetBoundaries
          className={`widget-boundary-${props.widgetId}`}
          style={dragBoundariesStyle}
        />
      )}
    </DraggableWrapper>
  );
}

export default DraggableComponent;
