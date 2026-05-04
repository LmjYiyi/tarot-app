import fs from "fs/promises";
import { spawn } from "child_process";
import path from "path";
import { setTimeout as sleep } from "timers/promises";

const cwd = process.cwd();
const port = Number(process.env.FINAL_USER_FLOW_PORT ?? 3002);
const baseUrl = `http://127.0.0.1:${port}`;
const casesPath = path.join(cwd, "docs", "interpret-v2-api-test-cases.json");
const jsonOutPath = path.join(cwd, "docs", "interpret-v2-final-user-flow-results.json");
const mdOutPath = path.join(cwd, "docs", "interpret-v2-final-user-flow-results.md");
const useLiveAi = process.env.FINAL_USER_FLOW_USE_LIVE_AI === "1";

function preview(value, max = 160) {
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
      NEXT_PUBLIC_SUPABASE_URL: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
      ...(useLiveAi
        ? {}
        : {
            MINIMAX_API_KEY: "",
            MINIMAX_GROUP_ID: "",
          }),
    },
  });

  child.stdout.on("data", (data) => process.stdout.write(`[final-user] ${data}`));
  child.stderr.on("data", (data) => process.stderr.write(`[final-user] ${data}`));

  return child;
}

async function waitForServer(server) {
  for (let attempt = 0; attempt < 90; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`next start exited early with code ${server.exitCode}`);
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

async function readStreamText(response) {
  if (!response.body) return "";

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    fullText += decoder.decode(value, { stream: true });
  }

  fullText += decoder.decode();
  return fullText;
}

async function postInterpret(testCase) {
  const startedAt = Date.now();
  const response = await fetch(`${baseUrl}/api/interpret`, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(testCase.request),
    signal: AbortSignal.timeout(Number(process.env.FINAL_USER_FLOW_REQUEST_TIMEOUT_MS ?? 240000)),
  });

  const interpretationText = await readStreamText(response);

  return {
    status: response.status,
    ok: response.ok,
    durationMs: Date.now() - startedAt,
    headers: {
      model: response.headers.get("x-model"),
      pipeline: response.headers.get("x-interpretation-pipeline"),
      fallbackReason: response.headers.get("x-interpretation-fallback-reason"),
      kbVersion: response.headers.get("x-tarot-kb-version"),
      kbDomain: response.headers.get("x-tarot-kb-domain"),
      contextHits: response.headers.get("x-tarot-kb-context-hits"),
      pairHits: response.headers.get("x-tarot-kb-pair-hits"),
      questionHits: response.headers.get("x-tarot-kb-question-hits"),
      safetyHits: response.headers.get("x-tarot-kb-safety-hits"),
      fallbackQualityScore: response.headers.get("x-tarot-fallback-quality-score"),
      fallbackQualityPassed: response.headers.get("x-tarot-fallback-quality-passed"),
      fallbackQualityIssues: response.headers.get("x-tarot-fallback-quality-issues"),
    },
    interpretationText,
  };
}

async function postReadingSave(testCase, interpretResult) {
  const startedAt = Date.now();
  const response = await fetch(`${baseUrl}/api/readings`, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      ...testCase.request,
      aiInterpretation: interpretResult.interpretationText,
      model: interpretResult.headers.model ?? "unknown",
    }),
    signal: AbortSignal.timeout(Number(process.env.FINAL_USER_FLOW_SAVE_TIMEOUT_MS ?? 60000)),
  });

  const body = await response.json().catch(async () => ({ raw: await response.text() }));

  return {
    status: response.status,
    ok: response.ok,
    durationMs: Date.now() - startedAt,
    response: body,
  };
}

async function fetchSharePage(sharePath) {
  if (!sharePath) {
    return { status: 0, ok: false, containsInterpretation: false };
  }

  const response = await fetch(`${baseUrl}${sharePath}`, {
    method: "GET",
    signal: AbortSignal.timeout(Number(process.env.FINAL_USER_FLOW_PAGE_TIMEOUT_MS ?? 60000)),
  });
  const html = await response.text();

  return {
    status: response.status,
    ok: response.ok,
    htmlLength: html.length,
  };
}

async function runCase(testCase) {
  const interpret = await postInterpret(testCase);
  const save = interpret.ok ? await postReadingSave(testCase, interpret) : null;
  const sharePath = save?.response?.sharePath;
  const sharePage = save?.ok ? await fetchSharePage(sharePath) : null;

  return {
    caseId: testCase.caseId,
    category: testCase.category,
    priority: testCase.priority,
    request: testCase.request,
    expected: testCase.expected,
    interpret,
    save,
    sharePage,
    actualUserVisibleText: interpret.interpretationText,
  };
}

function buildMarkdown(payload) {
  const rows = payload.results.map((row) =>
    [
      row.caseId,
      row.category,
      row.priority,
      row.interpret.status,
      row.interpret.headers.pipeline,
      row.interpret.headers.model,
      row.interpret.headers.kbDomain,
      row.interpret.headers.safetyHits,
      row.interpret.headers.fallbackQualityPassed,
      row.interpret.interpretationText.length,
      row.save?.status ?? "",
      row.save?.response?.sharePath ?? "",
      row.sharePage?.status ?? "",
      preview(row.actualUserVisibleText),
    ]
      .map(escapeCell)
      .join(" | "),
  );

  const detailSections = payload.results.flatMap((row) => [
    `## ${row.caseId}`,
    "",
    `- category: ${row.category}`,
    `- priority: ${row.priority}`,
    `- question: ${row.request.question || "(空问题)"}`,
    `- spreadSlug: ${row.request.spreadSlug}`,
    `- interpretStatus: ${row.interpret.status}`,
    `- pipeline: ${row.interpret.headers.pipeline ?? "unknown"}`,
    `- model: ${row.interpret.headers.model ?? "unknown"}`,
    `- kbDomain: ${row.interpret.headers.kbDomain ?? "unknown"}`,
    `- safetyHits: ${row.interpret.headers.safetyHits ?? "unknown"}`,
    `- fallbackQuality: ${row.interpret.headers.fallbackQualityScore ?? "unknown"}/${row.interpret.headers.fallbackQualityPassed ?? "unknown"}`,
    `- saveStatus: ${row.save?.status ?? "not_saved"}`,
    `- sharePath: ${row.save?.response?.sharePath ?? "none"}`,
    `- sharePageStatus: ${row.sharePage?.status ?? "not_checked"}`,
    "",
    "### 最终用户实际看到的解读正文",
    "",
    "```text",
    row.actualUserVisibleText.trim(),
    "```",
    "",
  ]);

  return [
    "# `/api/interpret` final user flow results",
    "",
    `- generatedAt: ${payload.generatedAt}`,
    `- endpoint: /api/interpret -> /api/readings -> /r/{token}`,
    `- baseUrl: ${payload.baseUrl}`,
    `- cases: ${payload.results.length}`,
    `- fullJson: ${path.relative(cwd, jsonOutPath).replace(/\\/g, "/")}`,
    `- aiMode: ${payload.env.useLiveAi ? "live_ai" : "local_fallback_display"}`,
    "- note: 测试服务使用 `next start` 独立端口，并禁用 Supabase 写入；保存层走同一进程的 in-memory store，避免污染线上/远程数据。",
    "- note: 默认关闭外部 AI 调用，保证完整用例可稳定跑完；如需真实 AI 流式结果，设置 `FINAL_USER_FLOW_USE_LIVE_AI=1`。",
    "",
    "| case | category | priority | interpret | pipeline | model | domain | safety | fallbackPass | textLen | save | sharePath | sharePage | preview |",
    "| --- | --- | --- | ---: | --- | --- | --- | ---: | --- | ---: | ---: | --- | ---: | --- |",
    ...rows.map((row) => `| ${row} |`),
    "",
    ...detailSections,
  ].join("\n");
}

async function main() {
  const rawCases = JSON.parse(await fs.readFile(casesPath, "utf8"));
  const server = startServer();

  try {
    await waitForServer(server);

    const results = [];
    for (const testCase of rawCases.cases) {
      process.stdout.write(`\n[final-user] Testing ${testCase.caseId}\n`);
      try {
        results.push(await runCase(testCase));
      } catch (error) {
        results.push({
          caseId: testCase.caseId,
          category: testCase.category,
          priority: testCase.priority,
          request: testCase.request,
          expected: testCase.expected,
          interpret: {
            status: 0,
            ok: false,
            durationMs: 0,
            headers: {},
            interpretationText: error instanceof Error ? error.message : String(error),
          },
          save: null,
          sharePage: null,
          actualUserVisibleText: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const payload = {
      generatedAt: new Date().toISOString(),
      baseUrl,
      mode: "final_user_visible_flow",
      env: {
        supabaseWriteDisabled: true,
        useLiveAi,
        port,
      },
      results,
    };

    await fs.writeFile(jsonOutPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    await fs.writeFile(mdOutPath, buildMarkdown(payload), "utf8");

    process.stdout.write(`\n[final-user] JSON written to ${jsonOutPath}\n`);
    process.stdout.write(`[final-user] Markdown written to ${mdOutPath}\n`);
  } finally {
    await stopServer(server);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
