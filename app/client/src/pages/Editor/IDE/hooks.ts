import { useCallback, useEffect, useState } from "react";
import type { EntityItem } from "@appsmith/entities/IDE/constants";
import {
  EditorEntityTab,
  EditorEntityTabState,
  EditorState,
  EditorViewMode,
} from "@appsmith/entities/IDE/constants";
import { useLocation } from "react-router";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { useDispatch, useSelector } from "react-redux";
import { getIDEViewMode, getIsSideBySideEnabled } from "selectors/ideSelectors";
import { getPropertyPaneWidth } from "selectors/propertyPaneSelectors";
import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";
import history, { NavigationMethod } from "utils/history";
import {
  builderURL,
  jsCollectionListURL,
  queryListURL,
  widgetListURL,
} from "@appsmith/RouteBuilder";
import isEmpty from "lodash/isEmpty";
import pickBy from "lodash/pickBy";
import { getFocusInfo } from "selectors/focusHistorySelectors";
import { getCurrentGitBranch } from "selectors/gitSyncSelectors";
import {
  APP_SIDEBAR_WIDTH,
  DEFAULT_EDITOR_PANE_WIDTH,
} from "constants/AppConstants";
import { getIsAltFocusWidget, getWidgetSelectionBlock } from "selectors/ui";
import { altFocusWidget, setWidgetSelectionBlock } from "actions/widgetActions";
import { useJSAdd } from "@appsmith/pages/Editor/IDE/EditorPane/JS/hooks";
import { useQueryAdd } from "@appsmith/pages/Editor/IDE/EditorPane/Query/hooks";
import { TabSelectors } from "./EditorTabs/constants";
import { closeJSActionTab } from "actions/jsActionActions";
import { closeQueryActionTab } from "actions/pluginActionActions";
import useWindowDimensions from "../../../utils/hooks/useWindowDimensions";

export const useCurrentAppState = () => {
  const [appState, setAppState] = useState(EditorState.EDITOR);
  const { pathname } = useLocation();
  const entityInfo = identifyEntityFromPath(pathname);
  useEffect(() => {
    setAppState(entityInfo.appState);
  }, [entityInfo.appState]);

  return appState;
};

export const useCurrentEditorState = () => {
  const [selectedSegment, setSelectedSegment] = useState<EditorEntityTab>(
    EditorEntityTab.UI,
  );
  const [selectedSegmentState, setSelectedSegmentState] =
    useState<EditorEntityTabState>(EditorEntityTabState.Edit);

  const location = useLocation();

  /**
   * useEffect to identify the entity from the path
   *
   */
  useEffect(() => {
    const currentEntityInfo = identifyEntityFromPath(location.pathname);
    switch (currentEntityInfo.entity) {
      case FocusEntity.QUERY:
      case FocusEntity.API:
      case FocusEntity.QUERY_MODULE_INSTANCE:
        setSelectedSegment(EditorEntityTab.QUERIES);
        setSelectedSegmentState(EditorEntityTabState.Edit);
        break;
      case FocusEntity.QUERY_LIST:
        setSelectedSegment(EditorEntityTab.QUERIES);
        setSelectedSegmentState(EditorEntityTabState.List);
        break;
      case FocusEntity.QUERY_ADD:
        setSelectedSegment(EditorEntityTab.QUERIES);
        setSelectedSegmentState(EditorEntityTabState.Add);
        break;
      case FocusEntity.JS_OBJECT:
      case FocusEntity.JS_MODULE_INSTANCE:
        setSelectedSegment(EditorEntityTab.JS);
        setSelectedSegmentState(EditorEntityTabState.Edit);
        break;
      case FocusEntity.JS_OBJECT_ADD:
        setSelectedSegment(EditorEntityTab.JS);
        setSelectedSegmentState(EditorEntityTabState.Add);
        break;
      case FocusEntity.JS_OBJECT_LIST:
        setSelectedSegment(EditorEntityTab.JS);
        setSelectedSegmentState(EditorEntityTabState.List);
        break;
      case FocusEntity.CANVAS:
        setSelectedSegment(EditorEntityTab.UI);
        setSelectedSegmentState(EditorEntityTabState.Add);
        break;
      case FocusEntity.PROPERTY_PANE:
        setSelectedSegment(EditorEntityTab.UI);
        setSelectedSegmentState(EditorEntityTabState.Edit);
        break;
      case FocusEntity.WIDGET_LIST:
        setSelectedSegment(EditorEntityTab.UI);
        setSelectedSegmentState(EditorEntityTabState.List);
        break;
      default:
        setSelectedSegment(EditorEntityTab.UI);
        setSelectedSegmentState(EditorEntityTabState.Add);
        break;
    }
  }, [location.pathname]);

  return {
    segment: selectedSegment,
    segmentMode: selectedSegmentState,
  };
};

export const useEditorPaneWidth = (): string => {
  const [width, setWidth] = useState(DEFAULT_EDITOR_PANE_WIDTH + "px");
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  const editorMode = useSelector(getIDEViewMode);
  const { segment } = useCurrentEditorState();
  const propertyPaneWidth = useSelector(getPropertyPaneWidth);
  const [windowWidth] = useWindowDimensions();

  useEffect(() => {
    if (isSideBySideEnabled) {
      if (editorMode === EditorViewMode.FullScreen) {
        if (segment !== EditorEntityTab.UI) {
          // In full screen mode, we want to extend the editor pane completely unless it is in ui mode
          // this is because the editor will show the code on the right side
          setWidth(`${windowWidth - APP_SIDEBAR_WIDTH}px`);
        } else {
          // Normal editor pane width
          setWidth(DEFAULT_EDITOR_PANE_WIDTH + "px");
        }
      } else {
        if (segment !== EditorEntityTab.UI) {
          // In split screen, we do not want to extend the editor pane and only have it cover part of the area
          setWidth(windowWidth * 0.404 + "px");
        } else {
          setWidth(DEFAULT_EDITOR_PANE_WIDTH + "px");
        }
      }
    } else {
      setWidth(DEFAULT_EDITOR_PANE_WIDTH + "px");
    }
  }, [isSideBySideEnabled, editorMode, segment, propertyPaneWidth]);

  return width;
};

export const useSegmentNavigation = (): {
  onSegmentChange: (value: string) => void;
} => {
  const pageId = useSelector(getCurrentPageId);

  /**
   * Callback to handle the segment change
   *
   * @param value
   * @returns
   *
   */
  const onSegmentChange = (value: string) => {
    switch (value) {
      case EditorEntityTab.QUERIES:
        history.push(queryListURL({ pageId }), {
          invokedBy: NavigationMethod.SegmentControl,
        });
        break;
      case EditorEntityTab.JS:
        history.push(jsCollectionListURL({ pageId }), {
          invokedBy: NavigationMethod.SegmentControl,
        });
        break;
      case EditorEntityTab.UI:
        history.push(widgetListURL({ pageId }), {
          invokedBy: NavigationMethod.SegmentControl,
        });
        break;
    }
  };

  return { onSegmentChange };
};

export const useGetPageFocusUrl = (pageId: string): string => {
  const editorStateString = "EDITOR_STATE.";
  const focusInfo = useSelector(getFocusInfo);
  const branch = useSelector(getCurrentGitBranch);
  const [focusPageUrl, setFocusPageUrl] = useState(
    builderURL({ pageId: pageId }),
  );

  useEffect(() => {
    const editorState = pickBy(
      focusInfo,
      (v, k) =>
        k === editorStateString + pageId + "#" + (branch || "undefined"),
    );

    if (isEmpty(editorState)) {
      return;
    }

    const segment = Object.values(editorState)[0].state?.SelectedSegment;

    switch (segment) {
      case EditorEntityTab.UI:
        setFocusPageUrl(widgetListURL({ pageId: pageId }));
        break;
      case EditorEntityTab.JS:
        setFocusPageUrl(jsCollectionListURL({ pageId: pageId }));
        break;
      case EditorEntityTab.QUERIES:
        setFocusPageUrl(queryListURL({ pageId: pageId }));
        break;
      default:
        setFocusPageUrl(widgetListURL({ pageId: pageId }));
    }
  }, [focusInfo, branch]);

  return focusPageUrl;
};

export function useWidgetSelectionBlockListener() {
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const currentFocus = identifyEntityFromPath(pathname);
  const isAltFocused = useSelector(getIsAltFocusWidget);
  const widgetSelectionIsBlocked = useSelector(getWidgetSelectionBlock);

  useEffect(() => {
    const inUIMode = [
      FocusEntity.CANVAS,
      FocusEntity.PROPERTY_PANE,
      FocusEntity.WIDGET_LIST,
    ].includes(currentFocus.entity);
    dispatch(setWidgetSelectionBlock(!inUIMode));
  }, [currentFocus]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isAltFocused, widgetSelectionIsBlocked]);
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isAltFocused && widgetSelectionIsBlocked && e.metaKey) {
      dispatch(altFocusWidget(e.metaKey));
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (!e.metaKey && widgetSelectionIsBlocked) {
      dispatch(altFocusWidget(e.metaKey));
    }
  };
}

export const useIDETabClickHandlers = () => {
  const dispatch = useDispatch();
  const onJSAddClick = useJSAdd();
  const onQueryAddClick = useQueryAdd();
  const { segment, segmentMode } = useCurrentEditorState();
  const tabsConfig = TabSelectors[segment];
  const pageId = useSelector(getCurrentPageId);

  const addClickHandler = useCallback(() => {
    if (segment === EditorEntityTab.JS) onJSAddClick();
    if (segment === EditorEntityTab.QUERIES) onQueryAddClick();
  }, [segment, segmentMode, onQueryAddClick, onJSAddClick]);

  const tabClickHandler = useCallback(
    (item: EntityItem) => {
      const navigateToUrl = tabsConfig.itemUrlSelector(item, pageId);
      history.push(navigateToUrl, {
        invokedBy: NavigationMethod.EditorTabs,
      });
    },
    [segment, pageId],
  );

  const closeClickHandler = useCallback(
    (actionId: string) => {
      if (segment === EditorEntityTab.JS)
        dispatch(closeJSActionTab({ id: actionId }));
      if (segment === EditorEntityTab.QUERIES)
        dispatch(closeQueryActionTab({ id: actionId }));
    },
    [segment, dispatch],
  );

  return { addClickHandler, tabClickHandler, closeClickHandler };
};
