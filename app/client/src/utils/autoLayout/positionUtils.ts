import { FlexLayerAlignment, ResponsiveBehavior } from "components/constants";
import { FlexLayer } from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
import { GridDefaults } from "constants/WidgetConstants";
import { isMobile } from "react-device-detect";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { WidgetProps } from "widgets/BaseWidget";

type Widget = WidgetProps & {
  children?: string[] | undefined;
};

interface AlignmentInfo {
  alignment: FlexLayerAlignment;
  columns: number;
  children: Widget[];
}

/**
 * Calculate widget position on canvas.
 */
export function updateWidgetPositions(
  allWidgets: CanvasWidgetsReduxState,
  parentId: string,
  isMobile?: boolean,
): CanvasWidgetsReduxState {
  let widgets = { ...allWidgets };
  try {
    const parent = widgets[parentId];
    if (!parent || !parent.flexLayers || !parent.flexLayers?.length)
      return widgets;

    let height = 0;
    for (const layer of parent.flexLayers) {
      const payload: {
        height: number;
        widgets: CanvasWidgetsReduxState;
      } = calculateWidgetPositions(widgets, layer, height, isMobile);
      widgets = payload.widgets;
      height += payload.height;
    }
    return widgets;
  } catch (e) {
    console.error(e);
    return widgets;
  }
}

function calculateWidgetPositions(
  allWidgets: CanvasWidgetsReduxState,
  layer: FlexLayer,
  topRow: number,
  isMobile = false,
): { height: number; widgets: CanvasWidgetsReduxState } {
  const {
    centerChildren,
    centerColumns,
    endChildren,
    endColumns,
    fillWidgetLength,
    startChildren,
    startColumns,
  } = getIndividualAlignmentInfo(allWidgets, layer, isMobile);

  const isFlexWrapped: boolean =
    isMobile &&
    startColumns + centerColumns + endColumns >
      GridDefaults.DEFAULT_GRID_COLUMNS;

  const arr: AlignmentInfo[] = [
    {
      alignment: FlexLayerAlignment.Start,
      columns: startColumns,
      children: startChildren,
    },
    {
      alignment: FlexLayerAlignment.Center,
      columns: centerColumns,
      children: centerChildren,
    },
    {
      alignment: FlexLayerAlignment.End,
      columns: endColumns,
      children: endChildren,
    },
  ];

  if (isFlexWrapped)
    return updatePositionsForFlexWrap({
      allWidgets,
      topRow,
      arr,
      centerChildren,
      centerColumns,
      endChildren,
      endColumns,
      fillWidgetLength,
      startChildren,
      isMobile,
    });

  return placeWidgetsWithoutWrap(
    allWidgets,
    arr,
    topRow,
    startChildren,
    centerChildren,
    endChildren,
    centerColumns,
    endColumns,
    fillWidgetLength,
    isMobile,
  );
}

function placeWidgetsWithoutWrap(
  allWidgets: CanvasWidgetsReduxState,
  arr: AlignmentInfo[],
  topRow: number,
  startChildren: Widget[],
  centerChildren: Widget[],
  endChildren: Widget[],
  centerColumns: number,
  endColumns: number,
  fillWidgetLength: number,
  isMobile = false,
): { height: number; widgets: CanvasWidgetsReduxState } {
  let widgets = { ...allWidgets };
  const { centerSize, endSize, startSize } = getAlignmentSizeInfo(
    arr.sort((a, b) => b.columns - a.columns),
    isMobile,
  );

  let maxHeight = 0;
  const input = [];
  if (startSize) input.push({ children: startChildren, leftColumn: 0 });
  if (centerSize)
    input.push({
      children: centerChildren,
      leftColumn: startSize + centerSize / 2 - centerColumns / 2,
    });
  if (endSize)
    input.push({
      children: endChildren,
      leftColumn: startSize + centerSize + endSize - endColumns,
    });
  input.forEach((each) => {
    let left = each.leftColumn;
    for (const widget of each.children) {
      const height = widget.bottomRow - widget.topRow;
      const width =
        widget.responsiveBehavior === ResponsiveBehavior.Fill
          ? fillWidgetLength
          : getRightColumn(widget, isMobile) - getLeftColumn(widget, isMobile);
      maxHeight = Math.max(maxHeight, height);
      const widgetAfterLeftUpdate = setLeftColumn(widget, left, isMobile);
      const widgetAfterRightUpdate = setRightColumn(
        widgetAfterLeftUpdate,
        left + width,
        isMobile,
      );
      widgets = {
        ...widgets,
        [widget.widgetId]: {
          ...widgetAfterRightUpdate,
          topRow,
          bottomRow: topRow + height,
        },
      };
      left += width;
    }
  });

  return { height: maxHeight, widgets };
}

// TODO: update this function to measure height as well.
function getAlignmentSizes(
  arr: AlignmentInfo[],
  space: number,
  sizes: AlignmentInfo[] = [],
): { alignment: FlexLayerAlignment; columns: number }[] {
  if (arr.length === 0) return sizes;
  if (arr[0].columns > space / arr.length) {
    sizes.push(arr[0]);
    arr.shift();
    return getAlignmentSizes(
      arr,
      space - sizes[sizes.length - 1].columns,
      sizes,
    );
  } else {
    for (let i = 0; i < arr.length; i++) {
      sizes.push({ ...arr[i], columns: space / arr.length });
    }
  }
  return sizes;
}

function getIndividualAlignmentInfo(
  widgets: CanvasWidgetsReduxState,
  layer: FlexLayer,
  isMobile: boolean,
) {
  const startChildren = [],
    centerChildren = [],
    endChildren = [],
    fillChildren = [];
  let startColumns = 0,
    centerColumns = 0,
    endColumns = 0;
  // Calculate the number of columns occupied by hug widgets in each alignment.
  for (const child of layer.children) {
    const widget = widgets[child.id];
    const isFillWidget = widget.responsiveBehavior === ResponsiveBehavior.Fill;
    if (isFillWidget) fillChildren.push(child);
    if (child.align === FlexLayerAlignment.Start) {
      startChildren.push(widget);
      if (!isFillWidget)
        startColumns +=
          getRightColumn(widget, isMobile) - getLeftColumn(widget, isMobile);
    } else if (child.align === FlexLayerAlignment.Center) {
      centerChildren.push(widget);
      if (!isFillWidget)
        centerColumns +=
          getRightColumn(widget, isMobile) - getLeftColumn(widget, isMobile);
    } else if (child.align === FlexLayerAlignment.End) {
      endChildren.push(widget);
      if (!isFillWidget)
        endColumns +=
          getRightColumn(widget, isMobile) - getLeftColumn(widget, isMobile);
    }
  }

  const availableColumns: number =
    GridDefaults.DEFAULT_GRID_COLUMNS -
    startColumns -
    centerColumns -
    endColumns;
  const fillWidgetLength: number = isMobile
    ? GridDefaults.DEFAULT_GRID_COLUMNS
    : availableColumns / fillChildren.length;
  for (const child of fillChildren) {
    if (child.align === FlexLayerAlignment.Start) {
      startColumns += fillWidgetLength;
    } else if (child.align === FlexLayerAlignment.Center) {
      centerColumns += fillWidgetLength;
    } else if (child.align === FlexLayerAlignment.End) {
      endColumns += fillWidgetLength;
    }
  }

  return {
    startChildren,
    centerChildren,
    endChildren,
    fillChildren,
    fillWidgetLength,
    startColumns,
    centerColumns,
    endColumns,
  };
}

function getAlignmentSizeInfo(
  arr: AlignmentInfo[],
  isMobile: boolean,
): { startSize: number; centerSize: number; endSize: number } {
  let startSize = 0,
    centerSize = 0,
    endSize = 0;
  const sizes: {
    alignment: FlexLayerAlignment;
    columns: number;
  }[] = getAlignmentSizes(arr, GridDefaults.DEFAULT_GRID_COLUMNS, []);

  for (const each of sizes) {
    if (each.alignment === FlexLayerAlignment.Start) {
      startSize = each.columns;
    } else if (each.alignment === FlexLayerAlignment.Center) {
      centerSize = each.columns;
    } else if (each.alignment === FlexLayerAlignment.End) {
      endSize = each.columns;
    }
  }
  return { startSize, centerSize, endSize };
}

function getWrappedAlignmentSize(
  arr: AlignmentInfo[],
  res: AlignmentInfo[][] = [[], [], []],
  resIndex = 0,
): AlignmentInfo[][] {
  if (arr.length === 1) {
    res[resIndex].push(arr[0]);
    return res;
  }
  let index = 0;
  let total = 0;
  for (const each of arr) {
    if (total + each.columns >= GridDefaults.DEFAULT_GRID_COLUMNS) {
      let x = index;
      if (!res[resIndex].length) {
        res[resIndex].push(each);
        x += 1;
      }
      return getWrappedAlignmentSize([...arr.slice(x)], res, resIndex + 1);
    }
    total += each.columns;
    index += 1;
    res[resIndex].push(each);
  }
  return res;
}

export function getRightColumn(widget: any, isMobile: boolean): number {
  return isMobile && widget.mobileRightColumn !== undefined
    ? widget.mobileRightColumn
    : widget.rightColumn;
}

export function setRightColumn(
  widget: any,
  val: number,
  isMobile: boolean,
): any {
  return isMobile && widget.mobileRightColumn !== undefined
    ? { ...widget, mobileRightColumn: val }
    : { ...widget, rightColumn: val };
}

export function getLeftColumn(widget: any, isMobile: boolean): number {
  return isMobile && widget.mobileLeftColumn !== undefined
    ? widget.mobileLeftColumn
    : widget.leftColumn;
}

export function setLeftColumn(
  widget: any,
  val: number,
  isMobile: boolean,
): any {
  return isMobile && widget.mobileLeftColumn !== undefined
    ? { ...widget, mobileLeftColumn: val }
    : { ...widget, leftColumn: val };
}

export function setColumns(
  widget: any,
  left: number,
  right: number,
  isMobile: boolean,
) {
  return setRightColumn(setLeftColumn(widget, left, isMobile), right, isMobile);
}

function updatePositionsForFlexWrap(data: {
  allWidgets: CanvasWidgetsReduxState;
  topRow: number;
  arr: AlignmentInfo[];
  centerChildren: Widget[];
  centerColumns: number;
  endChildren: Widget[];
  endColumns: number;
  fillWidgetLength: number;
  startChildren: Widget[];
  isMobile: boolean;
}): { height: number; widgets: CanvasWidgetsReduxState } {
  const {
    allWidgets,
    arr,
    centerChildren,
    centerColumns,
    endChildren,
    endColumns,
    fillWidgetLength,
    isMobile,
    startChildren,
    topRow,
  } = data;
  let widgets = { ...allWidgets };

  /**
   * Find the order in which the alignments are wrapped.
   * if res.length === 1 => no wrapping.
   * else for each row, fit in widgets in GridDefaults.DEFAULT_GRID_COLUMNS columns
   */
  const wrappedAlignments: AlignmentInfo[][] = getWrappedAlignmentSize(arr);

  let top = topRow;
  for (const each of wrappedAlignments) {
    if (!each.length) break;
    const payload =
      each.length === 1
        ? placeWrappedWidgets(widgets, each, top, fillWidgetLength, isMobile)
        : placeWidgetsWithoutWrap(
            widgets,
            each,
            top,
            startChildren,
            centerChildren,
            endChildren,
            centerColumns,
            endColumns,
            fillWidgetLength,
            isMobile,
          );
    widgets = payload.widgets;
    top += payload.height;
    continue;
  }
  return { height: top - topRow, widgets };
}

function getStartingPosition(
  alignment: FlexLayerAlignment,
  startSize: number,
  centerSize: number,
  endSize: number,
  centerColumns: number,
  endColumns: number,
): number {
  if (alignment === FlexLayerAlignment.Start) {
    return 0;
  } else if (alignment === FlexLayerAlignment.Center) {
    return startSize + centerSize / 2 - centerColumns / 2;
  } else if (alignment === FlexLayerAlignment.End) {
    return startSize + centerSize + endSize - endColumns;
  }
  return 0;
}

function placeWrappedWidgets(
  allWidgets: CanvasWidgetsReduxState,
  arr: AlignmentInfo[],
  topRow: number,
  fillWidgetLength: number,
  isMobile = false,
): { height: number; widgets: CanvasWidgetsReduxState } {
  let widgets = { ...allWidgets };
  /**
   * arr could contain multiple alignments.
   * More rows are needed only if it contains a single alignment,
   *  and it needs more than GridDefaults.DEFAULT_GRID_COLUMNS columns.
   */
  let startRow = topRow;
  if (arr.length === 1) {
    // wrapped alignment
    const rows: Row[] = getWrappedRows(arr[0], [], isMobile);
    for (const row of rows) {
      const { alignment, children, columns, height } = row;
      const { centerSize, endSize, startSize } = getAlignmentSizeInfo(
        [{ alignment, children, columns }],
        isMobile,
      );
      let left: number = getStartingPosition(
        alignment,
        startSize,
        centerSize,
        endSize,
        alignment === FlexLayerAlignment.Center ? columns : 0,
        alignment === FlexLayerAlignment.End ? columns : 0,
      );
      for (const child of children) {
        const height = child.bottomRow - child.topRow;
        const width =
          child.responsiveBehavior === ResponsiveBehavior.Fill
            ? fillWidgetLength
            : getRightColumn(child, isMobile) - getLeftColumn(child, isMobile);
        const widgetAfterColumnUpdate = setColumns(
          child,
          left,
          left + width,
          isMobile,
        );
        widgets = {
          ...widgets,
          [child.widgetId]: {
            ...widgetAfterColumnUpdate,
            topRow: startRow,
            bottomRow: startRow + height,
          },
        };
        left += width;
      }
      startRow += height;
    }
  }
  return { height: startRow - topRow, widgets };
}

interface Row {
  alignment: FlexLayerAlignment;
  children: Widget[];
  columns: number;
  height: number;
}

function getWrappedRows(
  arr: AlignmentInfo,
  rows: Row[],
  isMobile = false,
): Row[] {
  const row: Row = {
    alignment: arr.alignment,
    children: [],
    columns: 0,
    height: 0,
  };
  const space = GridDefaults.DEFAULT_GRID_COLUMNS;
  const temp: Widget[] = [];
  let columns = 0,
    index = 0,
    maxHeight = 0;
  for (const child of arr.children) {
    const width =
      getRightColumn(child, isMobile) - getLeftColumn(child, isMobile);
    if (columns + width > space) {
      row.children.push(...temp);
      row.height = maxHeight;
      row.columns = columns;
      rows.push(row);
      return getWrappedRows(
        {
          ...arr,
          children: [...arr.children.slice(index)],
        },
        [...rows],
        isMobile,
      );
    }
    temp.push(child);
    maxHeight = Math.max(maxHeight, child.bottomRow - child.topRow);
    columns += width;
    index += 1;
  }
  if (temp.length) {
    row.children.push(...temp);
    row.height = maxHeight;
    row.columns = columns;
    rows.push(row);
  }
  return rows;
}
