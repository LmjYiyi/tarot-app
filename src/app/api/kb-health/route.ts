import { loadTarotKb } from "@/lib/tarot-kb/loader";
import { getExpectedTarotKbCounts } from "@/lib/tarot-kb/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const kb = await loadTarotKb();

    return Response.json({
      ok: true,
      kbName: kb.manifest.kb_name,
      version: kb.manifest.version,
      generatedAt: kb.manifest.generated_at ?? null,
      loadedAt: kb.loadedAt,
      counts: kb.counts,
      expectedCounts: getExpectedTarotKbCounts(),
      indexes: {
        cardsById: kb.cardsById.size,
        spreadsById: kb.spreadsById.size,
        positionsById: kb.positionsById.size,
        contextByKey: kb.contextByKey.size,
        contextPositionByKey: kb.contextPositionByKey.size,
        combinationsByPairKey: kb.combinationsByPairKey.size,
        highFreqCombinationsByPairKey: kb.highFreqCombinationsByPairKey.size,
        curatedCombinationsByPairKey: kb.curatedCombinationsByPairKey.size,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tarot KB health check failed.";

    return Response.json(
      {
        ok: false,
        error: "TAROT_KB_HEALTH_FAILED",
        message,
      },
      { status: 500 },
    );
  }
}
