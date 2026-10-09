export * from "./evaluate-scene";

export const sceneDomainBoundary = {
  name: "scene-domain",
  responsibility: "Perhitungan scene murni tanpa UI, browser, atau backend.",
} as const;
export * from "./screen-mapping";
