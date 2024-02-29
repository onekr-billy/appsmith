import { WIDGET_TAGS } from "constants/WidgetConstants";
import type { WidgetBaseConfiguration } from "WidgetProvider/types";
import IconSVG from "../../icon.svg";
import ThumbnailSVG from "../../thumbnail.svg";

export const baseConfig: WidgetBaseConfiguration = {
  name: "Zone",
  iconSVG: IconSVG,
  thumbnailSVG: ThumbnailSVG,
  tags: [WIDGET_TAGS.LAYOUT],
  isCanvas: true,
  searchTags: ["div", "parent", "group"],
};
