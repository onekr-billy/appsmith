import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import GifPlayerComponent from "./index";

export default {
  title: "Design System/GifPlayer",
  component: GifPlayerComponent,
} as ComponentMeta<typeof GifPlayerComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof GifPlayerComponent> = (args) => {
  return <GifPlayerComponent {...args} />;
};

export const GifPlayer = Template.bind({});
GifPlayer.args = {
  gif: "https://release.app.appsmith.com/static/media/config_pagination_lightmode.e9f496f79ef7826e375e.gif",
  thumbnail:
    "data:image/png;base64,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",
};
