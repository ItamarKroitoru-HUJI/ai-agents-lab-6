// Shared look for every scene. 1280x720 at 30 fps.
export const FPS = 30;
export const WIDTH = 1280;
export const HEIGHT = 720;

export const COLORS = {
  bg: "#0f172a",
  text: "#ffffff",
  muted: "#94a3b8",
  axis: "#64748b",
  data: "#38bdf8",
  mu: "#f59e0b",
  danger: "#f87171",
  good: "#4ade80",
};

export const FONT = "sans-serif";

export const seconds = (s: number) => Math.round(s * FPS);
