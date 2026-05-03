import type {
  DrawLog,
  DrawnCard,
  ReadingIntent,
  SpreadDefinition,
  TarotCard,
  UserFeedback,
} from "@/lib/tarot/types";
import type {
  CardCombination,
  CardContextMeaning,
  CardContextPositionMeaning,
  GoldenCase,
  PositionRule,
  QuestionTaxonomyItem,
  SafetyRule,
  Spread,
} from "@/lib/tarot-kb/types";
import type { ResearchCardEvidence } from "@/lib/research-datasets/loader";

export type TarotKbDomain = "love" | "career" | "self_state" | "decision";

export type TarotEngineInput = {
  question: string;
  spreadSlug: string;
  cards: DrawnCard[];
  readingIntent?: ReadingIntent;
};

export type InterpretTarotInput = {
  question: string;
  spreadSlug: string;
  cards: DrawnCard[];
  drawLog?: DrawLog | null;
  readingIntent?: ReadingIntent;
  userFeedback?: UserFeedback;
  locale?: string;
};

export type InterpretTarotResult = {
  stream: ReadableStream<Uint8Array>;
  citations: Array<{ id: string; title: string }>;
  model: string;
  pipeline: string;
  headers: Record<string, string>;
  fallbackQuality?: {
    passed: boolean;
    score: number;
    issues: string[];
  };
  debug?: unknown;
};

export type RetrievedCardContext = {
  drawnCard: DrawnCard;
  appCard: TarotCard;
  kbCardId: string;
  orientation: "upright" | "reversed";
  appPosition: SpreadDefinition["positions"][number] | null;
  kbPositionId: string;
  positionRule: PositionRule | null;
  contextMeaning: CardContextMeaning | null;
  contextPositionMeaning: CardContextPositionMeaning | null;
  researchCardEvidence: ResearchCardEvidence | null;
};

export type RetrievedPairContext = {
  cardA: string;
  cardB: string;
  positions: Array<{
    positionOrder: number;
    positionId: string;
    positionName: string;
  }>;
  reason: string;
  curated: CardCombination | null;
  highFrequency: CardCombination | null;
  base: CardCombination | null;
};

export type RetrievedGoldenCase = {
  case: GoldenCase;
  score: number;
};

export type RetrievedQuestionTaxonomy = {
  item: QuestionTaxonomyItem;
  score: number;
};

export type RetrievedSafetyRule = {
  rule: SafetyRule;
  matchedTriggers: string[];
};

export type TarotEngineContext = {
  kbVersion: string;
  domain: TarotKbDomain;
  spread: Spread | null;
  researchDataset: {
    generatedAt: string;
    manifestFiles: string[];
    matchedCardEvidence: number;
    matchedSafetyRules: number;
  };
  questionMatches: RetrievedQuestionTaxonomy[];
  safetyMatches: RetrievedSafetyRule[];
  cardContexts: RetrievedCardContext[];
  pairContexts: RetrievedPairContext[];
  goldenCases: RetrievedGoldenCase[];
  contextIds: string[];
  missing: string[];
};
