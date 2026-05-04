import fs from "fs/promises";
import { spawn } from "child_process";
import path from "path";
import { setTimeout as sleep } from "timers/promises";

const cwd = process.cwd();
const port = Number(process.env.INTERPRET_V2_FULL_PORT ?? 3001);
const baseUrl = `http://127.0.0.1:${port}`;
const casesPath = path.join(cwd, "docs", "interpret-v2-api-test-cases.json");
const jsonOutPath = path.join(cwd, "docs", "interpret-v2-ai-enhancer-full-results.json");
const mdOutPath = path.join(cwd, "docs", "interpret-v2-ai-enhancer-full-results.md");

function preview(value, max = 140) {
  if (typeof value !== "string") return "";
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
}

function escapeCell(value) {
  return String(value ?? "").replace(/\|/g, "/").replace(/\r?\n/g, " ");
}

function startServer() {
  const nextBin = path.join(cwd, "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextBin, "start", "-p", String(port)], {
    cwd,
    env: {
      ...process.env,
      TAROT_V2_AI_STRUCTURED: "1",
    },
  });

  child.stdout.on("data", (data) => process.stdout.write(`[ai-full] ${data}`));
  child.stderr.on("data", (data) => process.stderr.write(`[ai-full] ${data}`));

  return child;
}

async function waitForServer(server) {
  for (let attempt = 0; attempt < 90; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`next dev exited early with code ${server.exitCode}`);
    }

    try {
      const response = await fetch(`${baseUrl}/api/kb-health`, { method: "GET" });
      if (response.ok) return;
    } catch {
      // Server is still booting.
    }

    await sleep(1000);
  }

  throw new Error(`Timed out waiting for ${baseUrl}`);
}

async function stopServer(server) {
  if (!server || server.exitCode !== null) return;

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

async function postCase(testCase) {
  const startedAt = Date.now();
  const response = await fetch(`${baseUrl}/api/interpret-v2`, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(testCase.request),
    signal: AbortSignal.timeout(Number(process.env.INTERPRET_V2_FULL_REQUEST_TIMEOUT_MS ?? 240000)),
  });
  const body = await response.json();
  const data = body?.data;
  const aiEnhancer = data?.debug?.aiEnhancer;

  return {
    caseId: testCase.caseId,
    category: testCase.category,
    priority: testCase.priority,
    request: testCase.request,
    expected: testCase.expected,
    status: response.status,
    ok: response.ok && body?.ok === true,
    durationMs: Date.now() - startedAt,
    headers: {
      pipeline: response.headers.get("x-tarot-pipeline"),
      qualityScore: response.headers.get("x-tarot-quality-score"),
      qualityPassed: response.headers.get("x-tarot-quality-passed"),
      aiEnhancerEnabled: response.headers.get("x-tarot-ai-enhancer-enabled"),
      aiEnhancerEligible: response.headers.get("x-tarot-ai-enhancer-eligible"),
      aiEnhancerSkippedReason: response.headers.get("x-tarot-ai-enhancer-skipped-reason"),
      aiEnhancerFailureReason: response.headers.get("x-tarot-ai-enhancer-failure-reason"),
      aiEnhancerDurationMs: response.headers.get("x-tarot-ai-enhancer-duration-ms"),
    },
    derived: {
      pipeline: data?.pipeline ?? "request_failed",
      domain: data?.question?.domain,
      riskLevel: data?.question?.riskLevel,
      safetyHits: data?.safety?.hits,
      safetyNote: data?.safety?.note,
      qualityScore: data?.quality?.score,
      qualityPassed: data?.quality?.passed,
      qualityIssues: data?.quality?.issues ?? [],
      aiEnhancerEnabled: aiEnhancer?.enabled ?? false,
      aiEnhancerEligible: aiEnhancer?.eligible ?? false,
      aiEnhancerSkippedReason: aiEnhancer?.skippedReason,
      aiEnhancerFailureReason: aiEnhancer?.failureReason,
      aiEnhancerErrorName: aiEnhancer?.errorName,
      aiEnhancerDurationMs: aiEnhancer?.durationMs,
      cardCount: data?.cards?.length ?? 0,
      combinationCount: data?.combinations?.length ?? 0,
      sectionCount: data?.sections?.length ?? 0,
      summaryPreview: preview(data?.reading?.summary),
    },
    response: body,
  };
}

function buildMarkdown(payload) {
  const rows = payload.results.map((row) =>
    [
      row.caseId,
      row.category,
      row.status,
      row.derived.pipeline,
      row.derived.domain,
      row.derived.riskLevel ?? "",
      row.derived.safetyHits ?? "",
      `${row.derived.qualityScore ?? ""}/${row.derived.qualityPassed ? "pass" : "fail"}`,
      row.derived.aiEnhancerEnabled
        ? row.derived.aiEnhancerEligible
          ? "eligible"
          : "skipped"
        : "off",
      row.derived.aiEnhancerFailureReason ?? row.derived.aiEnhancerSkippedReason ?? "none",
      row.derived.aiEnhancerDurationMs ?? "",
      row.durationMs,
      row.derived.summaryPreview,
    ]
      .map(escapeCell)
      .join(" | "),
  );

  return [
    "# `/api/interpret-v2` AI enhancer full backend results",
    "",
    `- generatedAt: ${payload.generatedAt}`,
    `- endpoint: ${payload.endpoint}`,
    `- mode: ${payload.mode}`,
    `- cases: ${payload.results.length}`,
    `- fullJson: ${path.relative(cwd, jsonOutPath).replace(/\\/g, "/")}`,
    "",
    "| case | category | status | pipeline | domain | risk | safety | quality | ai | aiReason | aiMs | totalMs | summary |",
    "| --- | --- | ---: | --- | --- | --- | ---: | --- | --- | --- | ---: | ---: | --- |",
    ...rows.map((row) => `| ${row} |`),
    "",
    "完整后端响应保存在 JSON 文件里：每条 `results[].response.data` 都是 API 原始结构化解读结果，未压缩 `cards / combinations / reading / sections / safety / quality / debug`。",
    "",
  ].join("\n");
}

async function main() {
  const rawCases = JSON.parse(await fs.readFile(casesPath, "utf8"));
  const server = startServer();

  try {
    await waitForServer(server);

    const results = [];
    for (const testCase of rawCases.cases) {
      process.stdout.write(`\n[ai-full] Testing ${testCase.caseId}\n`);
      try {
        results.push(await postCase(testCase));
      } catch (error) {
        results.push({
          caseId: testCase.caseId,
          category: testCase.category,
          priority: testCase.priority,
          request: testCase.request,
          expected: testCase.expected,
          status: 0,
          ok: false,
          durationMs: 0,
          headers: {},
          derived: {
            pipeline: "request_failed",
            qualityPassed: false,
            qualityIssues: [error instanceof Error ? error.message : String(error)],
            aiEnhancerEnabled: false,
            aiEnhancerEligible: false,
          },
          response: {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }
    }

    const payload = {
      generatedAt: new Date().toISOString(),
      endpoint: "/api/interpret-v2",
      mode: "ai_enhanced_full_backend",
      env: {
        TAROT_V2_AI_STRUCTURED: "1",
        MINIMAX_MODEL: process.env.MINIMAX_MODEL ?? null,
        MINIMAX_BASE_URL: process.env.MINIMAX_BASE_URL ?? null,
        INTERPRET_V2_FULL_PORT: String(port),
      },
      sourceCases: path.relative(cwd, casesPath).replace(/\\/g, "/"),
      results,
    };

    await fs.writeFile(jsonOutPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    await fs.writeFile(mdOutPath, `${buildMarkdown(payload)}\n`, "utf8");
    console.log(`\n[ai-full] Wrote ${jsonOutPath}`);
    console.log(`[ai-full] Wrote ${mdOutPath}`);
  } finally {
    await stopServer(server);
  }
}

main().catch((error) => {
  console.error("[ai-full] failed", error);
  process.exitCode = 1;
});
