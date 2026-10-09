export * from "./fixtures/iphone-17-pro-max";
export * from "./fixtures/iphone-18-pro-max";
export * from "./fixtures/iphone-duo";
export * from "./fixtures/category-proofs";
export { default as renderRelease } from "./render-release.json";

export const catalogBoundary = {
  name: "catalog",
  responsibility: "Metadata publik device, template, dan fixture.",
} as const;
