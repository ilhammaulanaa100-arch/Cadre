export * from "./mockup-canvas";
export * from "./screen-canvas";
export * from "./canonical-image";

export const renderSceneBoundary = {
  name: "render-scene",
  responsibility: "Renderer bersama yang bebas dari routing dan auth.",
} as const;
