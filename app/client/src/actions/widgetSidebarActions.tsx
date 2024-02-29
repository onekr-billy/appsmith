import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { WidgetCardProps } from "constants/WidgetConstants";

export const fetchWidgetCards = () => {
  return {
    type: ReduxActionTypes.FETCH_WIDGET_CARDS,
  };
};

export const errorFetchingWidgetCards = (error: any) => {
  return {
    type: ReduxActionErrorTypes.FETCH_WIDGET_CARDS_ERROR,
    error,
  };
};

export const successFetchingWidgetCards = (cards: {
  [id: string]: WidgetCardProps[];
}) => {
  return {
    type: ReduxActionTypes.FETCH_WIDGET_CARDS_SUCCESS,
    cards,
  };
};

export const forceOpenWidgetPanel = (flag: boolean) => ({
  type: ReduxActionTypes.SET_FORCE_WIDGET_PANEL_OPEN,
  payload: flag,
});

export default {
  fetchWidgetCards,
  errorFetchingWidgetCards,
  successFetchingWidgetCards,
};
