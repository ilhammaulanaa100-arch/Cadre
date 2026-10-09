export * from "./schemas";
export * from "./validation";
export * from "./export";

export const contractsBoundary = {
  name: "contracts",
  responsibility: "Data serializable dan validasi runtime lintas host.",
} as const;
