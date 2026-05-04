import { describe, expect, it } from "vitest";

import { clearTarotKbCache, loadTarotKb } from "./loader";
import { getExpectedTarotKbCounts } from "./validate";

describe("loadTarotKb", () => {
  it("loads the real-source tarot KB bundle used by the backend", async () => {
    clearTarotKbCache();

    const kb = await loadTarotKb();

    expect(kb.sourceRoot).toContain("tarot_real_data_v0_2_with_real_sources");
    expect(kb.manifest.version).toBe("v0.2");
    expect(kb.counts).toMatchObject(getExpectedTarotKbCounts());
    expect(kb.contextPositionByKey.size).toBe(kb.counts.contextPositionMeanings);
    expect(kb.combinationsByPairKey.size).toBe(kb.counts.combinations);
  });
});
