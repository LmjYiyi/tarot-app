import type {
  ReadingIntent,
  SpreadDefinition,
  SpreadPosition,
  TarotCard,
} from "@/lib/tarot/types";

export type SelectedCardForAnalysis = {
  card: TarotCard;
  position: SpreadPosition;
  orientation: "正位" | "逆位";
  keywords: string[];
  primaryMeaning: string;
  domainMeaning: string | null;
};

export type ArcanaProfile = {
  majorCount: number;
  minorCount: number;
  majorRatio: number;
  eventLevel: "日常事件" | "阶段课题" | "深层转折";
  note: string;
};

export type SuitProfile = {
  counts: Record<"cups" | "wands" | "swords" | "pentacles", number>;
  dominantSuits: string[];
  missingSuits: string[];
  note: string;
};

export type ReversedProfile = {
  count: number;
  ratio: number;
  mode: "流动" | "混合" | "阻滞" | "内化";
  note: string;
};

export type CourtCardProfile = {
  cardId: string;
  cardName: string;
  positionName: string;
  roleHint: "自己" | "对方" | "顾问/能力" | "环境人物" | "未知角色";
  note: string;
};

export type NumberStageProfile = {
  numbers: number[];
  stageHint: string;
};

export type RelationPairs = {
  support: string[];
  tension: string[];
};

export type QuestionDiagnosis = {
  riskLevel: "low" | "medium" | "high";
  issues: string[];
  flags: {
    highRiskDecision: boolean;
    absolutePrediction: boolean;
    preciseTiming: boolean;
    mindReading: boolean;
  };
  safetyDirectives: string[];
  suggestedReframe?: string;
};

export type GeneralAnalysis = {
  arcanaProfile: ArcanaProfile;
  suitProfile: SuitProfile;
  reversedProfile: ReversedProfile;
  courtCards: CourtCardProfile[];
  numberStage: NumberStageProfile;
  relationPairs: RelationPairs;
};

export type AnalyzeGeneralInput = {
  question: string;
  spread: SpreadDefinition | null;
  selectedCards: SelectedCardForAnalysis[];
  readingIntent?: ReadingIntent;
};
