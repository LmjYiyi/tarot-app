import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

export type TarotQualityLogEntry = {
  timestamp: string;
  readingId?: string;
  pipeline: string;
  kbVersion: string;
  domain: string;
  spreadId?: string;
  questionPreview: string;
  cards: Array<{
    cardId: string;
    cardName: string;
    orientation: string;
    positionId?: string;
    positionName?: string;
  }>;
  kbHits: {
    contextHits: number;
    pairHits: number;
    questionHits: number;
    safetyHits: number;
    goldenCaseHits: number;
  };
  quality: {
    score: number;
    passed: boolean;
    issues: string[];
    checks: Record<string, boolean>;
  };
};

export async function writeTarotQualityLog(entry: TarotQualityLogEntry) {
  if (process.env.TAROT_QUALITY_LOG !== "1") return;

  try {
    const dir = path.join(process.cwd(), ".tmp-tarot-quality");
    const file = path.join(dir, "quality-log.jsonl");

    await fs.mkdir(dir, { recursive: true });
    await fs.appendFile(file, `${JSON.stringify(entry)}\n`, "utf-8");
  } catch (error) {
    console.error("[tarot-quality:log] failed to write quality log", error);
  }
}
