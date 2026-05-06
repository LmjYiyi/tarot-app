import { z, ZodError } from "zod";

import { generateLegacyInterpretation } from "@/lib/ai/legacy-provider";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCardById, getSpreadBySlug } from "@/lib/tarot/catalog";

export type InterpretRouteMode = "legacy" | "engine";

const readingIntentSchema = z.object({
  domain: z.enum(["career", "love", "study", "relationship", "self", "decision"]),
  goal: z.enum(["trend", "obstacle", "advice", "decision", "other_view"]),
});

const userFeedbackSchema = z.object({
  mostResonantCardId: z.string().optional(),
  mostUncomfortableCardId: z.string().optional(),
  overallFeeling: z.string().max(120).optional(),
  overallFeelingNote: z.string().max(120).optional(),
});

const requestSchema = z.object({
  question: z.string().max(500).default(""),
  spreadSlug: z.string().min(1),
  locale: z.string().default("zh-CN"),
  readingIntent: readingIntentSchema.optional(),
  drawLog: z
    .object({
      seed: z.string().min(1),
      drawRule: z.string().min(1),
      reversedRate: z.number().min(0).max(1),
      createdAt: z.string().min(1),
    })
    .optional()
    .nullable(),
  userFeedback: userFeedbackSchema.optional(),
  cards: z
    .array(
      z.object({
        cardId: z.string(),
        positionOrder: z.number().int().positive(),
        reversed: z.boolean(),
      }),
    )
    .min(1),
});

export type InterpretRequestInput = z.infer<typeof requestSchema>;

export type InterpretationJobStatus = "pending" | "running" | "succeeded" | "failed";

export type InterpretationJobRow = {
  id: string;
  client_token: string;
  status: InterpretationJobStatus;
  mode: InterpretRouteMode;
  payload: InterpretRequestInput;
  result_text: string | null;
  result_headers: Record<string, string> | null;
  model: string | null;
  pipeline: string | null;
  generation_mode: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
};

const JOBS_TABLE = "interpretation_jobs";

function validateInput(input: InterpretRequestInput) {
  const spread = getSpreadBySlug(input.spreadSlug);

  if (!spread) {
    return Response.json(
      { error: "Invalid spreadSlug.", spreadSlug: input.spreadSlug },
      { status: 400 },
    );
  }

  if (input.cards.length !== spread.cardCount) {
    return Response.json(
      {
        error: "Card count does not match spread.",
        expected: spread.cardCount,
        received: input.cards.length,
      },
      { status: 400 },
    );
  }

  const validPositionOrders = new Set(spread.positions.map((position) => position.order));
  const invalidPosition = input.cards.find(
    (card) => !validPositionOrders.has(card.positionOrder),
  );

  if (invalidPosition) {
    return Response.json(
      {
        error: "Invalid positionOrder for spread.",
        positionOrder: invalidPosition.positionOrder,
        spreadSlug: spread.slug,
      },
      { status: 400 },
    );
  }

  const missingCard = input.cards.find((card) => !getCardById(card.cardId));

  if (missingCard) {
    return Response.json(
      { error: "Invalid cardId.", cardId: missingCard.cardId },
      { status: 400 },
    );
  }

  return null;
}

function parseInterpretInput(json: unknown):
  | { ok: true; input: InterpretRequestInput }
  | { ok: false; response: Response } {
  try {
    const input = requestSchema.parse(json);
    const validationError = validateInput(input);
    if (validationError) return { ok: false, response: validationError };
    return { ok: true, input };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ok: false,
        response: Response.json(
          { error: "Invalid request.", issues: error.issues },
          { status: 400 },
        ),
      };
    }

    const message = error instanceof Error ? error.message : "Invalid request.";
    return { ok: false, response: Response.json({ error: message }, { status: 400 }) };
  }
}

function normalizeMode(value: string | null | undefined): InterpretRouteMode | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;

  if (["legacy", "old", "ai", "classic"].includes(normalized)) return "legacy";
  if (["engine", "new", "kb", "tarot-engine"].includes(normalized)) return "engine";

  return null;
}

function resolveSwitchMode(request: Request) {
  const url = new URL(request.url);
  return (
    normalizeMode(url.searchParams.get("mode")) ??
    normalizeMode(request.headers.get("x-tarot-interpret-mode")) ??
    normalizeMode(process.env.TAROT_INTERPRET_API_MODE) ??
    "legacy"
  );
}

function buildStreamHeaders(input: {
  mode: InterpretRouteMode;
  model: string;
  pipeline?: string;
  generationMode?: string;
  debug?: unknown;
}) {
  const debug = input.debug as Record<string, unknown> | undefined;
  const safeIssueIds = (value: unknown) =>
    Array.isArray(value)
      ? value
          .map((issueId) =>
            String(issueId)
              .split(":")[0]
              .replace(/[^A-Za-z0-9_-]/g, "_"),
          )
          .filter(Boolean)
      : [];
  const qualityIssueIds = safeIssueIds(debug?.qualityIssueIds);
  const rejectedQualityIssueIds = safeIssueIds(debug?.rejectedQualityIssueIds);
  const safeHeaderValue = (value: unknown) =>
    String(value ?? "none")
      .replace(/[^\x20-\x7E]/g, "?")
      .slice(0, 240);

  return {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "x-interpretation-interface": input.mode,
    "x-interpretation-mode": input.mode,
    "x-model": input.model,
    "x-interpretation-pipeline": input.pipeline ?? "unknown",
    "x-interpretation-generation-mode":
      input.generationMode ??
      (typeof debug?.generationMode === "string" ? debug.generationMode : input.mode),
    "x-interpretation-ms":
      typeof debug?.total_ms === "number" ? String(debug.total_ms) : "unknown",
    "x-interpretation-quality-retries":
      typeof debug?.quality_retries === "number" ? String(debug.quality_retries) : "0",
    "x-interpretation-fallback-reason":
      typeof debug?.fallbackReason === "string" ? debug.fallbackReason : "none",
    "x-interpretation-quality-issues":
      qualityIssueIds.length > 0 ? qualityIssueIds.join(",") : "none",
    "x-interpretation-rejected-quality-issues":
      rejectedQualityIssueIds.length > 0 ? rejectedQualityIssueIds.join(",") : "none",
    "x-interpretation-error":
      typeof debug?.error === "string" ? safeHeaderValue(debug.error) : "none",
  };
}

async function runJobInterpretation(input: InterpretRequestInput, mode: InterpretRouteMode) {
  if (mode !== "legacy") {
    throw new Error("Background interpretation jobs currently support legacy mode only.");
  }

  return generateLegacyInterpretation(input);
}

async function readStreamAsText(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
    }

    text += decoder.decode();
    return text;
  } finally {
    reader.releaseLock();
  }
}

function resolveBackgroundFunctionUrl(request: Request, jobId: string) {
  const explicit = process.env.NETLIFY_BACKGROUND_FUNCTION_URL?.trim();
  if (explicit) {
    const base = explicit.replace(/\/$/, "");
    return `${base}?jobId=${encodeURIComponent(jobId)}`;
  }

  const siteUrl =
    process.env.DEPLOY_PRIME_URL?.trim() ||
    process.env.DEPLOY_URL?.trim() ||
    process.env.URL?.trim();

  const base = siteUrl
    ? siteUrl.replace(/\/$/, "")
    : new URL(request.url).origin.replace(/\/$/, "");

  return `${base}/.netlify/functions/interpret-background?jobId=${encodeURIComponent(jobId)}`;
}

export async function handleInterpretJobCreate(
  request: Request,
  options: { mode?: InterpretRouteMode } = {},
) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return Response.json(
      { error: "Supabase service role is not configured for background interpretation." },
      { status: 503 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseInterpretInput(json);
  if (!parsed.ok) return parsed.response;

  const mode = options.mode ?? resolveSwitchMode(request);

  const { data, error } = await supabase
    .from(JOBS_TABLE)
    .insert({
      status: "pending",
      mode,
      payload: parsed.input,
    })
    .select("id, client_token")
    .single();

  if (error || !data) {
    return Response.json(
      { error: error?.message ?? "Failed to enqueue interpretation job." },
      { status: 500 },
    );
  }

  const jobId = data.id as string;
  const jobToken = data.client_token as string;
  const triggerUrl = resolveBackgroundFunctionUrl(request, jobId);

  // 触发 Netlify background function。它会立即返回 202，本身不会阻塞这次请求。
  // 失败也仅记录，前端仍能通过轮询/Realtime 看到 pending 状态。
  try {
    const triggerResponse = await fetch(triggerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-job-trigger": "interpret",
      },
      body: JSON.stringify({ jobId }),
    });

    if (!triggerResponse.ok && triggerResponse.status !== 202) {
      console.warn(
        "[interpret-jobs] background trigger returned",
        triggerResponse.status,
        triggerResponse.statusText,
      );
    }
  } catch (triggerError) {
    console.error("[interpret-jobs] background trigger failed", triggerError);
  }

  return Response.json(
    { jobId, jobToken, status: "pending" satisfies InterpretationJobStatus },
    {
      status: 202,
      headers: {
        "Cache-Control": "no-store",
        "x-interpretation-job-id": jobId,
        "x-interpretation-job-token": jobToken,
        "x-interpretation-mode": mode,
      },
    },
  );
}

export async function processInterpretationJob(jobId: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data: job, error: loadError } = await supabase
    .from(JOBS_TABLE)
    .select("*")
    .eq("id", jobId)
    .single<InterpretationJobRow>();

  if (loadError || !job) {
    throw new Error(`Job ${jobId} not found: ${loadError?.message ?? "unknown"}`);
  }

  if (job.status === "succeeded") {
    return job;
  }

  await supabase
    .from(JOBS_TABLE)
    .update({ status: "running", error: null })
    .eq("id", jobId);

  try {
    const result = await runJobInterpretation(job.payload, job.mode);
    if (result.pipeline === "ai_failed_fallback") {
      const debug = result.debug as Record<string, unknown> | undefined;
      console.warn("[interpret-jobs] provider returned fallback", {
        jobId,
        model: result.model,
        fallbackReason: debug?.fallbackReason,
        error: debug?.error,
      });
    }
    const text = await readStreamAsText(result.stream);
    const headers = buildStreamHeaders({
      mode: job.mode,
      model: result.model,
      pipeline: result.pipeline,
      generationMode: result.generationMode,
      debug: result.debug,
    });

    await supabase
      .from(JOBS_TABLE)
      .update({
        status: "succeeded",
        result_text: text,
        result_headers: headers,
        model: result.model,
        pipeline: result.pipeline ?? null,
        generation_mode: result.generationMode ?? null,
        error: null,
      })
      .eq("id", jobId);

    return { ok: true } as const;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Interpretation failed.";
    await supabase
      .from(JOBS_TABLE)
      .update({ status: "failed", error: message })
      .eq("id", jobId);
    throw error;
  }
}
