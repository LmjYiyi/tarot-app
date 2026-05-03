import path from "path";
import { readFile } from "fs/promises";

import { buildTarotKbIndexes } from "./indexes";
import type {
  CardBase,
  CardCombination,
  CardContextMeaning,
  CardContextPositionMeaning,
  FollowupQuestions,
  GoldenCase,
  KbManifest,
  PositionRule,
  QuestionTaxonomyItem,
  RawTarotKb,
  SafetyRule,
  Spread,
  StyleSample,
  TarotKb,
} from "./types";
import { validateTarotKb } from "./validate";

const KB_ROOT = path.join(process.cwd(), "tarot-data", "tarot_ai_kb_v0_2");

let kbCache: TarotKb | null = null;

async function readJson<T>(relativePath: string): Promise<T> {
  const fullPath = path.join(KB_ROOT, relativePath);
  const raw = await readFile(fullPath, "utf-8");
  return JSON.parse(raw) as T;
}

async function readRawTarotKb(): Promise<RawTarotKb> {
  const [
    manifest,
    cards,
    questionTaxonomy,
    safetyRules,
    positions,
    spreads,
    contextMeanings,
    contextPositionMeanings,
    combinations,
    highFreqCombinations,
    curatedCombinations,
    goldenCases,
    styleSamples,
    followupQuestions,
  ] = await Promise.all([
    readJson<KbManifest>("11_manifests/kb_manifest_v0_2.json"),
    readJson<CardBase[]>("01_core_cards/cards_base.json"),
    readJson<QuestionTaxonomyItem[]>("02_question_router/question_taxonomy_expanded_v0_2.json"),
    readJson<SafetyRule[]>("03_safety/safety_rules.json"),
    readJson<PositionRule[]>("04_spreads_positions/position_grammar.json"),
    readJson<Spread[]>("04_spreads_positions/spreads.json"),
    readJson<CardContextMeaning[]>("05_card_context_meanings/card_context_profiles_624.json"),
    readJson<CardContextPositionMeaning[]>(
      "05_card_context_meanings/card_context_position_meanings_8112.json",
    ),
    readJson<CardCombination[]>("06_card_combinations/card_combinations_all_pairs_3003.json"),
    readJson<CardCombination[]>("06_card_combinations/card_combinations_priority_detailed.json"),
    readJson<CardCombination[]>("06_card_combinations/card_combinations_curated_seed.json"),
    readJson<GoldenCase[]>("07_golden_cases/golden_cases_expanded_100.json"),
    readJson<StyleSample[]>("08_conversation_style/style_samples.json"),
    readJson<FollowupQuestions>("08_conversation_style/followup_questions.json"),
  ]);

  return {
    manifest,
    cards,
    questionTaxonomy,
    safetyRules,
    positions,
    spreads,
    contextMeanings,
    contextPositionMeanings,
    combinations,
    highFreqCombinations,
    curatedCombinations,
    goldenCases,
    styleSamples,
    followupQuestions,
  };
}

export async function loadTarotKb(): Promise<TarotKb> {
  if (kbCache) {
    return kbCache;
  }

  const rawKb = await readRawTarotKb();
  const kb = buildTarotKbIndexes(rawKb);
  validateTarotKb(kb);
  kbCache = kb;

  return kbCache;
}

export function clearTarotKbCache() {
  kbCache = null;
}
