export type LayoutPreset = {
  aspectRatio: string;
  cardWidth: string;
  positions: Record<number, { x: number; y: number; rotate?: number }>;
};

// These coordinates are tuned for the generated astrology-chart background:
// keep cards inside the central wheel and away from the illustrated corners.
export const layoutPresets: Record<string, LayoutPreset> = {
  "single-guidance": {
    aspectRatio: "aspect-[4/3]",
    cardWidth: "md:w-[20%] lg:w-[16.5%]",
    positions: { 1: { x: 50, y: 50 } },
  },
  "three-card": {
    aspectRatio: "aspect-[2/1]",
    cardWidth: "md:w-[15.5%] lg:w-[12.5%]",
    positions: {
      1: { x: 28, y: 52 },
      2: { x: 50, y: 50 },
      3: { x: 72, y: 52 },
    },
  },
  "career-five": {
    aspectRatio: "aspect-[16/10]",
    cardWidth: "md:w-[12.5%] lg:w-[11.5%]",
    positions: {
      1: { x: 50, y: 52 },
      2: { x: 70, y: 52 },
      3: { x: 30, y: 52 },
      4: { x: 50, y: 24 },
      5: { x: 50, y: 78 },
    },
  },
  "cross-five": {
    aspectRatio: "aspect-[16/10]",
    cardWidth: "md:w-[12.5%] lg:w-[11.5%]",
    positions: {
      1: { x: 50, y: 50 },
      2: { x: 30, y: 50 },
      3: { x: 50, y: 24 },
      4: { x: 70, y: 50 },
      5: { x: 50, y: 78 },
    },
  },
  "relationship-six": {
    aspectRatio: "aspect-[16/10]",
    cardWidth: "md:w-[11%] lg:w-[10.5%]",
    positions: {
      1: { x: 32, y: 32 },
      2: { x: 68, y: 32 },
      3: { x: 50, y: 32 },
      4: { x: 50, y: 72 },
      5: { x: 32, y: 72 },
      6: { x: 68, y: 72 },
    },
  },
  "lovers-pyramid": {
    aspectRatio: "aspect-[16/10]",
    cardWidth: "md:w-[12.5%] lg:w-[11.5%]",
    positions: {
      1: { x: 34, y: 72 },
      2: { x: 66, y: 72 },
      3: { x: 50, y: 64 },
      4: { x: 50, y: 22 },
    },
  },
  "path-of-choice": {
    aspectRatio: "aspect-[16/10]",
    cardWidth: "md:w-[10.5%] lg:w-[9.8%]",
    positions: {
      1: { x: 30, y: 34 },
      2: { x: 30, y: 72 },
      3: { x: 70, y: 34 },
      4: { x: 70, y: 72 },
      5: { x: 50, y: 24 },
      6: { x: 50, y: 54 },
      7: { x: 50, y: 82 },
    },
  },
  "self-state": {
    aspectRatio: "aspect-[16/10]",
    cardWidth: "md:w-[12.5%] lg:w-[11.5%]",
    positions: {
      1: { x: 50, y: 25 },
      2: { x: 50, y: 54 },
      3: { x: 30, y: 54 },
      4: { x: 70, y: 54 },
      5: { x: 50, y: 80 },
    },
  },
  "celtic-cross": {
    aspectRatio: "aspect-[4/3]",
    cardWidth: "md:w-[7.4%] lg:w-[6.6%]",
    positions: {
      1: { x: 35, y: 50 },
      2: { x: 35, y: 50, rotate: 90 },
      3: { x: 18, y: 50 },
      4: { x: 35, y: 24 },
      5: { x: 35, y: 76 },
      6: { x: 52, y: 50 },
      7: { x: 78, y: 99 },
      8: { x: 78, y: 74 },
      9: { x: 78, y: 49 },
      10: { x: 78, y: 24 },
    },
  },
};
