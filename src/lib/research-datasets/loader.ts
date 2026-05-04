import manifest from "../../../tarot-data/tarot_real_data_v0_2_with_real_sources/source-datasets/manifest.json";
import derivedSafetyRules from "../../../tarot-data/tarot_real_data_v0_2_with_real_sources/source-datasets/derived_safety_rules.json";
import sourceRegistry from "../../../tarot-data/tarot_real_data_v0_2_with_real_sources/source-datasets/source_registry.verified.json";
import waiteCards from "../../../tarot-data/tarot_real_data_v0_2_with_real_sources/source-datasets/waite_pictorial_key_cards.json";

export type ResearchCardEvidence = {
  sourceId: string;
  sourceUrl: string;
  license: string;
  cardName: string;
  slug: string;
  description: string;
  upright: string;
  reversed?: string;
};

export type ResearchSafetyRule = {
  id: string;
  riskType: string;
  riskLevel: "critical" | "high" | "medium";
  triggers: string[];
  forbidden: string[];
  requiredResponse: string[];
  backendHardControl: boolean;
  sourceIds: string[];
};

export type ResearchDatasetBundle = {
  generatedAt: string;
  manifestFiles: string[];
  reusableSourceIds: Set<string>;
  waiteCardsBySlug: Map<string, ResearchCardEvidence>;
  safetyRules: ResearchSafetyRule[];
};

let researchDatasetCache: ResearchDatasetBundle | null = null;

function normalizeCardKey(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/^the\s+/u, "")
    .replace(/^the-/u, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeRiskLevel(value: string): ResearchSafetyRule["riskLevel"] {
  if (value === "blocked") return "critical";
  if (value === "boundary_only") return "high";
  return "medium";
}

function buildWaiteCardMap() {
  const entries = waiteCards.cards.flatMap((card) => {
    const evidence: ResearchCardEvidence = {
      sourceId: card.sourceId,
      sourceUrl: card.sourceUrl,
      license: waiteCards.license,
      cardName: card.cardName,
      slug: card.slug,
      description: card.description,
      upright: card.upright,
      ...(card.reversed ? { reversed: card.reversed } : {}),
    };

    return [
      [normalizeCardKey(card.slug), evidence] as const,
      [normalizeCardKey(card.cardName), evidence] as const,
    ];
  });

  return new Map(entries);
}

function buildReusableSourceIds() {
  return new Set(
    sourceRegistry
      .filter(
        (source) =>
          source.usePolicy === "direct_use" ||
          (source.usePolicy === "verify_before_use" && source.ok),
      )
      .map((source) => source.id),
  );
}

export function loadResearchDatasets(): ResearchDatasetBundle {
  if (researchDatasetCache) {
    return researchDatasetCache;
  }

  researchDatasetCache = {
    generatedAt: manifest.generatedAt,
    manifestFiles: manifest.files.map((file) => file.file),
    reusableSourceIds: buildReusableSourceIds(),
    waiteCardsBySlug: buildWaiteCardMap(),
    safetyRules: derivedSafetyRules.rules.map((rule) => ({
      id: rule.id,
      riskType: rule.riskType,
      riskLevel: normalizeRiskLevel(rule.riskLevel),
      triggers: rule.triggers,
      forbidden: rule.forbidden,
      requiredResponse: rule.requiredResponse,
      backendHardControl: rule.backendHardControl,
      sourceIds: rule.sourceIds,
    })),
  };

  return researchDatasetCache;
}

export function getResearchCardEvidence(input: { slug: string; nameEn: string }) {
  const bundle = loadResearchDatasets();

  return (
    bundle.waiteCardsBySlug.get(normalizeCardKey(input.slug)) ??
    bundle.waiteCardsBySlug.get(normalizeCardKey(input.nameEn)) ??
    null
  );
}

export function clearResearchDatasetCache() {
  researchDatasetCache = null;
}
