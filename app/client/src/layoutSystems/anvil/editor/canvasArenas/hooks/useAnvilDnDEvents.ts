import type React from "react";
import { useEffect, useRef } from "react";
import type { AnvilHighlightingCanvasProps } from "layoutSystems/anvil/editor/canvasArenas/AnvilHighlightingCanvas";
import type { AnvilHighlightInfo } from "layoutSystems/anvil/utils/anvilTypes";
import { getClosestHighlight } from "../utils/utils";
import { getCompensatingOffsetValues } from "../utils/dndCompensatorUtils";
import { useDispatch } from "react-redux";
import { throttle } from "lodash";
import { setHighlightsDrawnAction } from "layoutSystems/anvil/integrations/actions/draggingActions";
import { renderDisallowOnCanvas } from "../utils/utils";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";

/**
 *
 *  This hook is written to accumulate all logic that is needed to
 *  - initialize event listeners for canvas
 *  - adjust z-index of canvas
 *  - track mouse position on canvas
 *  - render highlights on the canvas
 *  - render warning to denote that a particular widget type is not allowed to drop on canvas
 *  - invoke onDrop callback as per the anvilDragStates
 */
export const useAnvilDnDEvents = (
  anvilDnDListenerRef: React.RefObject<HTMLDivElement>,
  props: AnvilHighlightingCanvasProps,
  setHighlightShown: (highlight: AnvilHighlightInfo | null) => void,
) => {
  const { anvilDragStates, deriveAllHighlightsFn, layoutId, onDrop } = props;
  const {
    activateOverlayWidgetDrop,
    allowToDrop,
    canActivate,
    draggedBlocks,
    edgeCompensatorValues,
    isCurrentDraggedCanvas,
    isDragging,
    layoutCompensatorValues,
    layoutElementPositions,
    mainCanvasLayoutId,
  } = anvilDragStates;
  const dispatch = useDispatch();
  const { setDraggingCanvas } = useWidgetDragResize();

  /**
   * Ref to store highlights derived in real time once dragging starts
   */
  const allHighlightsRef = useRef([] as AnvilHighlightInfo[]);
  const currentLayoutPositions = layoutElementPositions[layoutId];

  /**
   * Function to calculate and store highlights
   */
  const calculateHighlights = () => {
    if (activateOverlayWidgetDrop) {
      allHighlightsRef.current = [];
    } else {
      allHighlightsRef.current = deriveAllHighlightsFn(
        layoutElementPositions,
        draggedBlocks,
      )?.highlights;
    }
  };
  const canvasIsDragging = useRef(false);

  useEffect(() => {
    // Effect to handle changes in isCurrentDraggedCanvas
    if (anvilDnDListenerRef.current) {
      if (!isCurrentDraggedCanvas) {
        anvilDnDListenerRef.current.style.backgroundColor = "unset";
        anvilDnDListenerRef.current.style.color = "unset";
        anvilDnDListenerRef.current.innerText = "";
        canvasIsDragging.current = false;
        setHighlightShown(null);
      }
    }
  }, [isCurrentDraggedCanvas]);

  useEffect(() => {
    if (anvilDnDListenerRef.current && isDragging) {
      let currentRectanglesToDraw: AnvilHighlightInfo;
      const resetCanvasState = () => {
        // Resetting the canvas state when necessary
        if (anvilDnDListenerRef.current) {
          anvilDnDListenerRef.current.style.backgroundColor = "unset";
          anvilDnDListenerRef.current.style.color = "unset";
          anvilDnDListenerRef.current.innerText = "";
          canvasIsDragging.current = false;
          dispatch(setHighlightsDrawnAction());
          setHighlightShown(null);
        }
      };

      if (isDragging && canActivate) {
        const onMouseUp = () => {
          if (
            isDragging &&
            canvasIsDragging.current &&
            currentRectanglesToDraw &&
            !currentRectanglesToDraw.existingPositionHighlight &&
            allowToDrop
          ) {
            // Invoke onDrop callback with the appropriate highlight info
            onDrop(currentRectanglesToDraw);
          }
          resetCanvasState();
        };

        const onFirstMoveOnCanvas = (e: MouseEvent) => {
          if (
            isCurrentDraggedCanvas &&
            isDragging &&
            !canvasIsDragging.current &&
            anvilDnDListenerRef.current
          ) {
            // Calculate highlights when the mouse enters the canvas
            calculateHighlights();
            canvasIsDragging.current = true;
            requestAnimationFrame(() => onMouseMove(e));
          } else {
            onMouseOver(e);
          }
        };
        // make sure rendering highlights on canvas and highlighting cell happens once every 50ms
        const throttledRenderOnCanvas = throttle(
          () => {
            if (
              anvilDnDListenerRef.current &&
              canvasIsDragging.current &&
              isCurrentDraggedCanvas
            ) {
              const canvasGapAdjustedHighlight = {
                ...currentRectanglesToDraw,
                posX:
                  currentRectanglesToDraw.posX + layoutCompensatorValues.left,
                posY:
                  currentRectanglesToDraw.posY + layoutCompensatorValues.top,
              };
              const { posX: left, posY: top } = canvasGapAdjustedHighlight;
              const compensatingOffsetValues = getCompensatingOffsetValues(
                currentRectanglesToDraw,
                edgeCompensatorValues,
              );
              const positionUpdatedHighlightInfo = {
                ...canvasGapAdjustedHighlight,
                posX: left + compensatingOffsetValues.leftOffset,
                posY: top + compensatingOffsetValues.topOffset,
              };
              dispatch(setHighlightsDrawnAction(positionUpdatedHighlightInfo));
              setHighlightShown(positionUpdatedHighlightInfo);
            }
          },
          50,
          {
            leading: true,
            trailing: true,
          },
        );

        const onMouseMove = (e: any) => {
          if (
            isCurrentDraggedCanvas &&
            canActivate &&
            canvasIsDragging.current &&
            anvilDnDListenerRef.current
          ) {
            if (!allowToDrop) {
              // Render disallow message if dropping is not allowed
              renderDisallowOnCanvas(anvilDnDListenerRef.current);
              return;
            }
            // Get the closest highlight based on the mouse position
            const processedHighlight = getClosestHighlight(
              {
                x: e.offsetX - layoutCompensatorValues.left,
                y: e.offsetY - layoutCompensatorValues.top,
              },
              allHighlightsRef.current,
            );
            if (processedHighlight) {
              currentRectanglesToDraw = processedHighlight;
              throttledRenderOnCanvas();
            }
          } else {
            // Call onFirstMoveOnCanvas for the initial move on the canvas
            onFirstMoveOnCanvas(e);
          }
        };

        const onMouseOver = (e: any) => {
          if (canActivate) {
            setDraggingCanvas(layoutId);
            e.stopPropagation();
          }
        };

        const onMouseOut = () => {
          setDraggingCanvas("");
        };
        if (anvilDnDListenerRef.current) {
          anvilDnDListenerRef.current?.addEventListener(
            "mouseenter",
            onMouseOver,
          );
          anvilDnDListenerRef.current.addEventListener(
            "mouseover",
            onMouseOver,
          );
          anvilDnDListenerRef.current.addEventListener(
            "mouseleave",
            onMouseOut,
          );
          anvilDnDListenerRef.current.addEventListener("mouseout", onMouseOut);
          // Initialize listeners
          anvilDnDListenerRef.current?.addEventListener(
            "mousemove",
            onMouseMove,
            false,
          );
          anvilDnDListenerRef.current?.addEventListener(
            "mouseup",
            onMouseUp,
            false,
          );
          // To make sure drops on the main canvas boundary buffer are processed in the capturing phase.
          document.addEventListener("mouseup", onMouseUp, true);
        }

        return () => {
          anvilDnDListenerRef.current?.removeEventListener(
            "mouseover",
            onMouseOver,
          );
          anvilDnDListenerRef.current?.removeEventListener(
            "mouseenter",
            onMouseOver,
          );
          anvilDnDListenerRef.current?.removeEventListener(
            "mouseleave",
            onMouseOut,
          );
          anvilDnDListenerRef.current?.removeEventListener(
            "mouseout",
            onMouseOut,
          );
          // Cleanup listeners on component unmount
          anvilDnDListenerRef.current?.removeEventListener(
            "mousemove",
            onMouseMove,
          );
          anvilDnDListenerRef.current?.removeEventListener(
            "mouseup",
            onMouseUp,
          );
          document.removeEventListener("mouseup", onMouseUp, true);
        };
      } else {
        // Reset canvas state if not dragging
        resetCanvasState();
      }
    }
  }, [
    isDragging,
    allowToDrop,
    canActivate,
    draggedBlocks,
    isCurrentDraggedCanvas,
    isDragging,
    layoutElementPositions,
    mainCanvasLayoutId,
    currentLayoutPositions,
    layoutCompensatorValues,
    edgeCompensatorValues,
  ]);

  return {
    showDnDListener: isDragging && !activateOverlayWidgetDrop && canActivate,
  };
};
