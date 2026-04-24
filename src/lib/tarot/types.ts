export type Arcana = "major" | "minor";
export type Suit = "cups" | "wands" | "swords" | "pentacles";
export type Orientation = "upright" | "reversed";
export type ReadingDomain =
  | "career"
  | "love"
  | "study"
  | "relationship"
  | "self"
  | "decision";
export type ReadingGoal = "trend" | "obstacle" | "advice" | "decision" | "other_view";

export type TarotCard = {
  id: string;
  slug: string;
  nameZh: string;
  nameEn: string;
  arcana: Arcana;
  suit: Suit | null;
  number: number;
  keywordsUpright: string[];
  keywordsReversed: string[];
  meaningUpright: string;
  meaningReversed: string;
  loveMeaning: string;
  careerMeaning: string;
  imageUrl?: string;
};

export type SpreadPosition = {
  order: number;
  name: string;
  focus: string;
  promptHint: string;
};

export type SpreadDefinition = {
  slug: string;
  nameZh: string;
  summary: string;
  detail: string;
  hero: string;
  suitableFor: string[];
  cardCount: number;
  positions: SpreadPosition[];
};

export type DrawnCard = {
  cardId: string;
  positionOrder: number;
  reversed: boolean;
};

export type DrawLog = {
  seed: string;
  drawRule: string;
  reversedRate: number;
  createdAt: string;
};

export type ReadingIntent = {
  domain: ReadingDomain;
  goal: ReadingGoal;
};

export type UserFeedback = {
  mostResonantCardId?: string;
  mostUncomfortableCardId?: string;
  overallFeeling?: string;
  overallFeelingNote?: string;
};

export type AdaptiveQuestionOption = {
  value: string;
  label: string;
};

export type AdaptiveQuestion = {
  id: string;
  stage: "post_feedback";
  domain?: ReadingDomain | "any";
  goal?: ReadingGoal | "any";
  trigger?: string;
  question: string;
  basis?: string;
  purpose?: string;
  answerType: "single_choice" | "free_text";
  options?: AdaptiveQuestionOption[];
  priority?: number;
};

export type AdaptiveAnswer = {
  questionId: string;
  question: string;
  answer: string;
  answerLabel?: string;
};

export type ReadingDraft = {
  question: string;
  spreadSlug: string;
  cards: DrawnCard[];
  drawLog?: DrawLog;
  readingIntent?: ReadingIntent;
  userFeedback?: UserFeedback;
  adaptiveAnswers?: AdaptiveAnswer[];
  locale?: string;
};
