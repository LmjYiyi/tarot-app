import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

type ReadingIntent = {
  domain: "career" | "love" | "study" | "relationship" | "self" | "decision";
  goal: "trend" | "obstacle" | "advice" | "decision" | "other_view";
};

type EvalCard = {
  cardId: string;
  positionOrder: number;
  reversed: boolean;
};

type EvalCase = {
  caseId: string;
  question: string;
  spreadSlug: string;
  readingIntent?: ReadingIntent;
  cards: EvalCard[];
};

type InterpretV2Response = {
  ok: boolean;
  data?: {
    pipeline: string;
    question: {
      domain: string;
      rewritten?: string;
      riskLevel?: string;
    };
    cards: Array<{
      cardId: string;
      cardName: string;
      positionName: string;
      meaning: string;
      advice?: string[];
      reflectionQuestions?: string[];
    }>;
    combinations: Array<{
      summary: string;
    }>;
    reading: {
      summary: string;
      advice: string[];
      feedbackQuestions: string[];
    };
    safety: {
      hits: number;
      note?: string;
    };
    quality: {
      score: number;
      passed: boolean;
      issues: string[];
    };
  };
  error?: string;
  message?: string;
};

type EvalMode = "kb_baseline" | "ai_enhanced";

type EvalRow = {
  caseId: string;
  question: string;
  mode: EvalMode;
  status: number;
  ok: boolean;
  pipeline: string;
  domain: string;
  riskLevel?: string;
  safetyHits: number;
  qualityScore: number;
  qualityPassed: boolean;
  cardsCount: number;
  combinationsCount: number;
  cardMeaningLengths: number[];
  summaryPreview: string;
  adviceCount: number;
  feedbackQuestionCount: number;
  safetyNotePreview?: string;
  error?: string;
};

const cases: EvalCase[] = [
  {
    caseId: "love_current_thought",
    question: "他现在到底怎么想我？",
    spreadSlug: "three-card",
    readingIntent: { domain: "love", goal: "trend" },
    cards: [
      { cardId: "major-0-fool", positionOrder: 1, reversed: false },
      { cardId: "major-1-magician", positionOrder: 2, reversed: false },
      { cardId: "major-2-high-priestess", positionOrder: 3, reversed: true },
    ],
  },
  {
    caseId: "love_third_party",
    question: "他是不是已经不爱我了？",
    spreadSlug: "three-card",
    readingIntent: { domain: "love", goal: "trend" },
    cards: [
      { cardId: "major-6-lovers", positionOrder: 1, reversed: true },
      { cardId: "major-12-hanged-man", positionOrder: 2, reversed: false },
      { cardId: "major-14-temperance", positionOrder: 3, reversed: false },
    ],
  },
  {
    caseId: "career_general",
    question: "我最近事业发展怎么样？",
    spreadSlug: "career-five",
    readingIntent: { domain: "career", goal: "trend" },
    cards: [
      { cardId: "major-1-magician", positionOrder: 1, reversed: false },
      { cardId: "major-4-emperor", positionOrder: 2, reversed: true },
      { cardId: "major-3-empress", positionOrder: 3, reversed: false },
      { cardId: "major-7-chariot", positionOrder: 4, reversed: false },
      { cardId: "major-8-strength", positionOrder: 5, reversed: false },
    ],
  },
  {
    caseId: "career_resign",
    question: "我要不要离职？",
    spreadSlug: "path-of-choice",
    readingIntent: { domain: "decision", goal: "decision" },
    cards: [
      { cardId: "major-1-magician", positionOrder: 1, reversed: false },
      { cardId: "major-4-emperor", positionOrder: 2, reversed: true },
      { cardId: "major-3-empress", positionOrder: 3, reversed: false },
      { cardId: "major-7-chariot", positionOrder: 4, reversed: false },
      { cardId: "major-9-hermit", positionOrder: 5, reversed: false },
      { cardId: "major-11-justice", positionOrder: 6, reversed: false },
      { cardId: "major-8-strength", positionOrder: 7, reversed: false },
    ],
  },
  {
    caseId: "decision_a_b",
    question: "我该选 A 还是 B？",
    spreadSlug: "path-of-choice",
    readingIntent: { domain: "decision", goal: "decision" },
    cards: [
      { cardId: "major-0-fool", positionOrder: 1, reversed: false },
      { cardId: "major-10-wheel-of-fortune", positionOrder: 2, reversed: false },
      { cardId: "major-2-high-priestess", positionOrder: 3, reversed: false },
      { cardId: "major-13-death", positionOrder: 4, reversed: true },
      { cardId: "major-18-moon", positionOrder: 5, reversed: false },
      { cardId: "major-11-justice", positionOrder: 6, reversed: false },
      { cardId: "major-21-world", positionOrder: 7, reversed: false },
    ],
  },
  {
    caseId: "self_tired",
    question: "我最近为什么总是这么累？",
    spreadSlug: "self-state",
    readingIntent: { domain: "self", goal: "obstacle" },
    cards: [
      { cardId: "major-9-hermit", positionOrder: 1, reversed: false },
      { cardId: "major-18-moon", positionOrder: 2, reversed: false },
      { cardId: "major-15-devil", positionOrder: 3, reversed: true },
      { cardId: "major-17-star", positionOrder: 4, reversed: false },
      { cardId: "major-14-temperance", positionOrder: 5, reversed: false },
    ],
  },
  {
    caseId: "health_medical",
    question: "塔罗看我这个病会不会恶化？",
    spreadSlug: "single-guidance",
    cards: [{ cardId: "major-5-hierophant", positionOrder: 1, reversed: false }],
  },
  {
    caseId: "finance_stock",
    question: "我买这个股票会不会赚钱？",
    spreadSlug: "single-guidance",
    readingIntent: { domain: "decision", goal: "decision" },
    cards: [{ cardId: "major-10-wheel-of-fortune", positionOrder: 1, reversed: true }],
  },
  {
    caseId: "daily_guidance",
    question: "今天有什么提醒？",
    spreadSlug: "single-guidance",
    cards: [{ cardId: "major-19-sun", positionOrder: 1, reversed: false }],
  },
];

const cwd = process.cwd();
const outputDir = path.join(cwd, "artifacts", "interpret-v2-eval");
const port = Number(process.env.INTERPRET_V2_EVAL_PORT ?? 3117);
const requestTimeoutMs = Number(process.env.INTERPRET_V2_EVAL_REQUEST_TIMEOUT_MS ?? 120000);
const baseUrl = `http://127.0.0.1:${port}`;

function preview(text: string | undefined, max = 120) {
  if (!text) return "";
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
}

function startServer(mode: EvalMode) {
  const nextBin = path.join(cwd, "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextBin, "start", "-p", String(port)], {
    cwd,
    env: {
      ...process.env,
      TAROT_V2_AI_STRUCTURED: mode === "ai_enhanced" ? "1" : "0",
    },
  });

  child.stdout.on("data", (data) => process.stdout.write(`[${mode}] ${data}`));
  child.stderr.on("data", (data) => process.stderr.write(`[${mode}] ${data}`));

  return child;
}

async function waitForServer(server: ChildProcessWithoutNullStreams) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`next start exited early with code ${server.exitCode}`);
    }

    try {
      const response = await fetch(`${baseUrl}/api/kb-health`, { method: "GET" });
      if (response.ok) return;
    } catch {
      // Server is still booting.
    }

    await sleep(500);
  }

  throw new Error(`Timed out waiting for ${baseUrl}`);
}

async function stopServer(server: ChildProcessWithoutNullStreams) {
  if (server.exitCode !== null) return;

  if (process.platform === "win32" && server.pid) {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/PID", String(server.pid), "/T", "/F"]);
      killer.once("exit", resolve);
      killer.once("error", resolve);
    });
    return;
  }

  server.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => server.once("exit", resolve)),
    sleep(3000).then(() => {
      if (server.exitCode === null) server.kill("SIGKILL");
    }),
  ]);
}

async function postCase(mode: EvalMode, item: EvalCase): Promise<EvalRow> {
  let response: Response;
  let body: InterpretV2Response;

  try {
    response = await fetch(`${baseUrl}/api/interpret-v2`, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      signal: AbortSignal.timeout(requestTimeoutMs),
      body: JSON.stringify({
        question: item.question,
        spreadSlug: item.spreadSlug,
        locale: "zh-CN",
        readingIntent: item.readingIntent,
        cards: item.cards,
      }),
    });
    body = (await response.json()) as InterpretV2Response;
  } catch (error) {
    return {
      caseId: item.caseId,
      question: item.question,
      mode,
      status: 0,
      ok: false,
      pipeline: "request_failed",
      domain: "",
      safetyHits: 0,
      qualityScore: 0,
      qualityPassed: false,
      cardsCount: 0,
      combinationsCount: 0,
      cardMeaningLengths: [],
      summaryPreview: "",
      adviceCount: 0,
      feedbackQuestionCount: 0,
      error: error instanceof Error ? error.message : "Unknown request error",
    };
  }

  const data = body.data;

  if (!response.ok || !body.ok || !data) {
    return {
      caseId: item.caseId,
      question: item.question,
      mode,
      status: response.status,
      ok: false,
      pipeline: "request_failed",
      domain: "",
      safetyHits: 0,
      qualityScore: 0,
      qualityPassed: false,
      cardsCount: 0,
      combinationsCount: 0,
      cardMeaningLengths: [],
      summaryPreview: "",
      adviceCount: 0,
      feedbackQuestionCount: 0,
      error: body.message ?? body.error ?? `HTTP ${response.status}`,
    };
  }

  return {
    caseId: item.caseId,
    question: item.question,
    mode,
    status: response.status,
    ok: true,
    pipeline: data.pipeline,
    domain: data.question.domain,
    riskLevel: data.question.riskLevel,
    safetyHits: data.safety.hits,
    qualityScore: data.quality.score,
    qualityPassed: data.quality.passed,
    cardsCount: data.cards.length,
    combinationsCount: data.combinations.length,
    cardMeaningLengths: data.cards.map((card) => card.meaning.length),
    summaryPreview: preview(data.reading.summary),
    adviceCount: data.reading.advice.length,
    feedbackQuestionCount: data.reading.feedbackQuestions.length,
    safetyNotePreview: preview(data.safety.note),
  };
}

async function runMode(mode: EvalMode) {
  const server = startServer(mode);

  try {
    await waitForServer(server);

    const rows: EvalRow[] = [];
    for (const item of cases) {
      rows.push(await postCase(mode, item));
    }

    return rows;
  } finally {
    await stopServer(server);
  }
}

function markdownTable(rows: EvalRow[]) {
  const header = [
    "| case | mode | pipeline | domain | safety | quality | cards | combos | advice | questions | summary |",
    "| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
  ];
  const body = rows.map((row) =>
    [
      row.caseId,
      row.mode,
      row.pipeline,
      row.domain,
      String(row.safetyHits),
      `${row.qualityScore}/${row.qualityPassed ? "pass" : "fail"}`,
      String(row.cardsCount),
      String(row.combinationsCount),
      String(row.adviceCount),
      String(row.feedbackQuestionCount),
      row.summaryPreview.replace(/\|/g, "/"),
    ].join(" | "),
  );

  return [...header, ...body.map((line) => `| ${line} |`)].join("\n");
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  const rows = [
    ...(await runMode("kb_baseline")),
    ...(await runMode("ai_enhanced")),
  ];
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonPath = path.join(outputDir, `${timestamp}.json`);
  const markdownPath = path.join(outputDir, `${timestamp}.md`);

  await writeFile(jsonPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2)}\n`, "utf-8");
  await writeFile(markdownPath, `${markdownTable(rows)}\n`, "utf-8");

  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${markdownPath}`);
}

main().catch((error) => {
  console.error("[eval-interpret-v2] failed", error);
  process.exitCode = 1;
});
