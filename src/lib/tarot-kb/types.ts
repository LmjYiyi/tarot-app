export type Orientation = "upright" | "reversed";

export type KbManifest = {
  kb_name: string;
  version: string;
  generated_at?: string;
  description?: string;
  file_registry?: Array<{
    category: string;
    path: string;
    row_count?: number | null;
  }>;
  [key: string]: unknown;
};

export type CardBase = {
  card_id: string;
  name_cn: string;
  name_en: string;
  arcana?: string;
  suit?: string | null;
  upright_keywords?: string[];
  reversed_keywords?: string[];
  [key: string]: unknown;
};

export type QuestionTaxonomyItem = {
  id: string;
  raw_question: string;
  domain: string;
  intent: string;
  risk_level: string;
  should_rewrite: boolean;
  rewritten_question: string;
  recommended_spread?: string;
  safety_action?: string;
  [key: string]: unknown;
};

export type SafetyRule = {
  risk_type: string;
  risk_level: string;
  trigger_examples: string[];
  action: string;
  fallback_template?: string;
  [key: string]: unknown;
};

export type PositionRule = {
  position_id: string;
  name_cn: string;
  function: string;
  interpretation_rule?: string;
  claim_strength?: string;
  [key: string]: unknown;
};

export type SpreadPosition = {
  index: number;
  position_id: string;
  name_cn: string;
  [key: string]: unknown;
};

export type Spread = {
  spread_id: string;
  name_cn: string;
  domains?: string[];
  positions: SpreadPosition[];
  [key: string]: unknown;
};

export type CardContextMeaning = {
  profile_id: string;
  card_id: string;
  card_name_cn: string;
  orientation: Orientation;
  domain: string;
  core_reading: string;
  [key: string]: unknown;
};

export type CardContextPositionMeaning = {
  id: string;
  card_id: string;
  card_name_cn: string;
  orientation: Orientation;
  domain: string;
  position_id: string;
  position_name_cn: string;
  core_reading: string;
  position_reading: string;
  advice_direction?: string;
  do_say?: string[];
  do_not_say?: string[];
  [key: string]: unknown;
};

export type CardCombination = {
  combo_id: string;
  cards: [string, string] | string[];
  card_names_cn?: [string, string] | string[];
  theme?: string;
  love?: string;
  career?: string;
  self_state?: string;
  decision?: string;
  advice?: string;
  avoid?: string[];
  human_like_love?: string;
  human_like_career?: string;
  human_like_self?: string;
  human_like_decision?: string;
  [key: string]: unknown;
};

export type GoldenCase = {
  case_id: string;
  domain: string;
  intent: string;
  risk_level: string;
  spread_id?: string;
  cards?: string[];
  [key: string]: unknown;
};

export type StyleSample = {
  style_id?: string;
  name_cn?: string;
  [key: string]: unknown;
};

export type FollowupQuestions = Record<string, unknown>;

export type RawTarotKb = {
  manifest: KbManifest;
  cards: CardBase[];
  questionTaxonomy: QuestionTaxonomyItem[];
  safetyRules: SafetyRule[];
  positions: PositionRule[];
  spreads: Spread[];
  contextMeanings: CardContextMeaning[];
  contextPositionMeanings: CardContextPositionMeaning[];
  combinations: CardCombination[];
  highFreqCombinations: CardCombination[];
  curatedCombinations: CardCombination[];
  goldenCases: GoldenCase[];
  styleSamples: StyleSample[];
  followupQuestions: FollowupQuestions;
};

export type TarotKbCounts = {
  cards: number;
  questionTaxonomy: number;
  safetyRules: number;
  positions: number;
  spreads: number;
  contextMeanings: number;
  contextPositionMeanings: number;
  combinations: number;
  highFreqCombinations: number;
  curatedCombinations: number;
  goldenCases: number;
  styleSamples: number;
};

export type TarotKb = RawTarotKb & {
  loadedAt: string;
  counts: TarotKbCounts;
  cardsById: Map<string, CardBase>;
  questionTaxonomyById: Map<string, QuestionTaxonomyItem>;
  safetyRulesByType: Map<string, SafetyRule>;
  positionsById: Map<string, PositionRule>;
  spreadsById: Map<string, Spread>;
  contextByKey: Map<string, CardContextMeaning>;
  contextPositionByKey: Map<string, CardContextPositionMeaning>;
  combinationsByPairKey: Map<string, CardCombination>;
  highFreqCombinationsByPairKey: Map<string, CardCombination>;
  curatedCombinationsByPairKey: Map<string, CardCombination>;
};
