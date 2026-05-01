import type { Suit } from "@/lib/tarot/types";

export type GrammarNote = {
  type: string;
  severity: "low" | "medium" | "high";
  note: string;
};

export type WeightedPositionNote = {
  order: number;
  positionName: string;
  cardName: string;
  orientation: "正位" | "逆位";
  weight: "primary" | "secondary" | "supporting";
  role: string;
  note: string;
};

export type SuitDynamics = {
  dominantSuits: Suit[];
  missingSuits: Suit[];
  interactions: GrammarNote[];
  missingNotes: GrammarNote[];
};

export type CourtRoleNote = {
  cardName: string;
  positionName: string;
  orientation: "正位" | "逆位";
  archetype: string;
  rankRole: string;
  suitRole: string;
  roleHint: string;
  caution: string;
};

export type MajorArcanaChainNote = {
  cards: string[];
  theme: string;
  note: string;
  caution: string;
};

export type ReadingGrammarAnalysis = {
  timeScope: {
    defaultWindow: string;
    observationWindow: string;
    note: string;
  };
  weightedPositions: WeightedPositionNote[];
  suitDynamics: SuitDynamics;
  patterns: GrammarNote[];
  courtRoles: CourtRoleNote[];
  majorArcanaChains: MajorArcanaChainNote[];
  reversalNotes: GrammarNote[];
};
