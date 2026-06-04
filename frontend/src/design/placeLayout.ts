// Map-pin layout positions (percent of the map viewport) keyed by place slug.
// These are purely client-side presentation; the backend does not store them.
export const placeLayout: Record<string, { top: number; left: number }> = {
  r1: { top: 39, left: 18 },
  r2: { top: 56, left: 64 },
  r3: { top: 72, left: 35 },
  c1: { top: 38, left: 61 },
  c2: { top: 60, left: 21 },
  c3: { top: 72, left: 67 },
  b1: { top: 42, left: 24 },
  b2: { top: 58, left: 66 },
  b3: { top: 73, left: 42 },
};

export const DEFAULT_PIN_LAYOUT = { top: 50, left: 50 };
