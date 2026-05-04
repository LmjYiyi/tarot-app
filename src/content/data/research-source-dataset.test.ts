import { describe, expect, it } from "vitest";

import {
  collectedDatasetFiles,
  datasetBlueprints,
  getDirectUsableSources,
  getSourcesForDataset,
  researchSources,
  safetyRuleSeeds,
  visualSymbolSeeds,
} from "./research-source-dataset";
import manifest from "../../../tarot-data/tarot_real_data_v0_2_with_real_sources/source-datasets/manifest.json";
import metabismuth from "../../../tarot-data/tarot_real_data_v0_2_with_real_sources/source-datasets/metabismuth_tarot_json.json";
import safetyRules from "../../../tarot-data/tarot_real_data_v0_2_with_real_sources/source-datasets/derived_safety_rules.json";
import waiteCards from "../../../tarot-data/tarot_real_data_v0_2_with_real_sources/source-datasets/waite_pictorial_key_cards.json";
import wikimediaImages from "../../../tarot-data/tarot_real_data_v0_2_with_real_sources/source-datasets/wikimedia_rws_images.json";

describe("research source dataset", () => {
  it("keeps every reported source registered with a URL", () => {
    expect(researchSources).toHaveLength(24);
    expect(researchSources.every((source) => /^https?:\/\//.test(source.url))).toBe(true);
  });

  it("does not mark copyrighted or GPL sources as directly reusable", () => {
    const directIds = new Set(getDirectUsableSources().map((source) => source.id));

    expect(directIds.has("S02")).toBe(false);
    expect(directIds.has("S03")).toBe(false);
    expect(directIds.has("S07")).toBe(false);
    expect(directIds.has("S23")).toBe(false);
  });

  it("maps high priority runtime datasets to source evidence", () => {
    const highPriority = datasetBlueprints.filter((dataset) => dataset.priority === "high");

    expect(highPriority.map((dataset) => dataset.key)).toEqual(
      expect.arrayContaining([
        "source_registry",
        "card_visual_symbols",
        "question_taxonomy",
        "safety_rules",
        "card_context_meanings",
        "golden_cases",
        "quality_rubrics",
      ]),
    );
    expect(highPriority.every((dataset) => dataset.sourceIds.length > 0)).toBe(true);
  });

  it("uses professional and AI safety sources for safety rules", () => {
    const safetySources = getSourcesForDataset("safety_rules").map((source) => source.id);

    expect(safetySources).toEqual(expect.arrayContaining(["S08", "S09", "S12", "S16"]));
    expect(safetyRuleSeeds.some((rule) => rule.backendHardControl && rule.riskLevel === "blocked")).toBe(true);
  });

  it("starts visual symbol seeds without depending on copyrighted card-meaning sites", () => {
    expect(visualSymbolSeeds.length).toBeGreaterThanOrEqual(8);
    expect(visualSymbolSeeds.every((seed) => seed.sourceIds.includes("S01") && seed.sourceIds.includes("S20"))).toBe(
      true,
    );
  });

  it("registers the generated source-dataset files", () => {
    const manifestFiles = new Set(manifest.files.map((file) => file.file));

    expect(collectedDatasetFiles.every((file) => file.path.startsWith("tarot-data/source-datasets/"))).toBe(true);
    expect(manifestFiles.has("tarot-data/source-datasets/waite_pictorial_key_cards.json")).toBe(true);
    expect(manifestFiles.has("tarot-data/source-datasets/wikimedia_rws_images.json")).toBe(true);
  });

  it("contains complete direct-use datasets from checked sources", () => {
    expect(waiteCards.cardCount).toBe(78);
    expect(waiteCards.cards).toHaveLength(78);
    expect(new Set(waiteCards.cards.map((card) => card.slug)).size).toBe(78);
    expect(waiteCards.cards.every((card) => card.upright)).toBe(true);
    expect(waiteCards.cards.filter((card) => !card.reversed).map((card) => card.cardName)).toEqual(["Two of Cups"]);

    expect(metabismuth.tarot.cards).toHaveLength(78);
    expect(wikimediaImages.fileCount).toBeGreaterThanOrEqual(78);
    expect(safetyRules.rules.some((rule) => rule.id === "self_harm_crisis" && rule.backendHardControl)).toBe(true);
  });
});
