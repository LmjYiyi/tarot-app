export type LayoutPreset = {
  aspectRatio: string;
  cardWidth: string;
  readingAspectRatio?: string;
  readingCardWidth?: string;
  positions: Record<number, { x: number; y: number; rotate?: number }>;
};

const balancedReadingCardWidth = "md:w-[clamp(82px,9vw,102px)]";

// These coordinates are tuned for the generated astrology-chart background:
// keep cards inside the central wheel and away from the illustrated corners.
export const layoutPresets: Record<string, LayoutPreset> = {
  "single-guidance": {
    aspectRatio: "aspect-[3/2]",
    cardWidth: "md:w-[24%] lg:w-[20%]",
    readingCardWidth: balancedReadingCardWidth,
    positions: { 1: { x: 50, y: 50 } },
  },
  "three-card": {
    aspectRatio: "aspect-[16/9]",
    cardWidth: "md:w-[22%] lg:w-[20%]",
    readingCardWidth: balancedReadingCardWidth,
    positions: {
      1: { x: 22, y: 56 },
      2: { x: 50, y: 54 },
      3: { x: 78, y: 56 },
    },
  },
  "career-five": {
    aspectRatio: "aspect-[10/9]",
    cardWidth: "md:w-[15%] lg:w-[13.5%]",
    readingCardWidth: balancedReadingCardWidth,
    positions: {
      1: { x: 50, y: 50 },
      2: { x: 73, y: 50 },
      3: { x: 27, y: 50 },
      4: { x: 50, y: 18 },
      5: { x: 50, y: 82 },
    },
  },
  "cross-five": {
    aspectRatio: "aspect-[10/9]",
    cardWidth: "md:w-[15%] lg:w-[13.5%]",
    readingCardWidth: balancedReadingCardWidth,
    positions: {
      1: { x: 50, y: 50 },
      2: { x: 27, y: 50 },
      3: { x: 50, y: 18 },
      4: { x: 73, y: 50 },
      5: { x: 50, y: 82 },
    },
  },
  "relationship-six": {
    aspectRatio: "aspect-[16/10]",
    cardWidth: "md:w-[14%] lg:w-[12.5%]",
    readingCardWidth: balancedReadingCardWidth,
    positions: {
      1: { x: 30, y: 30 },
      2: { x: 70, y: 30 },
      3: { x: 50, y: 30 },
      4: { x: 50, y: 74 },
      5: { x: 30, y: 74 },
      6: { x: 70, y: 74 },
    },
  },
  "lovers-pyramid": {
    aspectRatio: "aspect-[10/9]",
    cardWidth: "md:w-[15%] lg:w-[13.5%]",
    readingCardWidth: balancedReadingCardWidth,
    positions: {
      1: { x: 32, y: 82 },
      2: { x: 68, y: 82 },
      3: { x: 50, y: 52 },
      4: { x: 50, y: 22 },
    },
  },
  "path-of-choice": {
    aspectRatio: "aspect-[10/9]",
    cardWidth: "md:w-[14.5%] lg:w-[13.5%]",
    readingCardWidth: balancedReadingCardWidth,
    positions: {
      1: { x: 26, y: 32 },
      2: { x: 26, y: 70 },
      3: { x: 74, y: 32 },
      4: { x: 74, y: 70 },
      5: { x: 50, y: 18 },
      6: { x: 50, y: 50 },
      7: { x: 50, y: 82 },
    },
  },
  "self-state": {
    aspectRatio: "aspect-[10/9]",
    cardWidth: "md:w-[15%] lg:w-[13.5%]",
    readingCardWidth: balancedReadingCardWidth,
    positions: {
      1: { x: 50, y: 18 },
      2: { x: 50, y: 50 },
      3: { x: 27, y: 50 },
      4: { x: 73, y: 50 },
      5: { x: 50, y: 82 },
    },
  },
  "celtic-cross": {
    aspectRatio: "aspect-[4/3]",
    cardWidth: "md:w-[9%] lg:w-[8%]",
    readingAspectRatio: "aspect-[1/1]",
    readingCardWidth: balancedReadingCardWidth,
    positions: {
      1: { x: 35, y: 50 },
      2: { x: 35, y: 50, rotate: 90 },
      3: { x: 18, y: 50 },
      4: { x: 35, y: 22 },
      5: { x: 35, y: 78 },
      6: { x: 52, y: 50 },
      7: { x: 80, y: 92 },
      8: { x: 80, y: 68 },
      9: { x: 80, y: 44 },
      10: { x: 80, y: 20 },
    },
  },
};
