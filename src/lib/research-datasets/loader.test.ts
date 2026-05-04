import { describe, expect, it } from "vitest";

import { getResearchCardEvidence, loadResearchDatasets } from "./loader";

describe("research dataset loader", () => {
  it("loads the reusable source dataset manifest and Waite card evidence", () => {
    const bundle = loadResearchDatasets();
    const fool = getResearchCardEvidence({
      slug: "the-fool",
      nameEn: "The Fool",
    });

    expect(bundle.manifestFiles).toContain("tarot-data/source-datasets/waite_pictorial_key_cards.json");
    expect(bundle.waiteCardsBySlug.size).toBeGreaterThanOrEqual(78);
    expect(fool).toMatchObject({
      sourceId: "S01",
      license: "public_domain",
      cardName: "The Fool",
    });
  });

  it("normalizes project safety rules into backend risk levels", () => {
    const bundle = loadResearchDatasets();

    expect(bundle.safetyRules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "self_harm_crisis",
          riskLevel: "critical",
          backendHardControl: true,
        }),
        expect.objectContaining({
          id: "medical_boundary",
          riskLevel: "high",
          backendHardControl: true,
        }),
      ]),
    );
  });
});
