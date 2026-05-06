import { z, ZodError } from "zod";

import { resolveDailyAstrologyGuidance } from "@/lib/astrology/daily-guidance";
import { generateLegacyInterpretation } from "@/lib/ai/legacy-provider";
import { interpretTarot } from "@/lib/tarot-engine/interpret-tarot";
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

type InterpretInput = z.infer<typeof requestSchema>;
export type InterpretRequestInput = InterpretInput;

export function parseInterpretInput(json: unknown):
  | { ok: true; input: InterpretInput }
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

export function isNetlifyFunctionRuntime() {
  return Boolean(
    process.env.NETLIFY ||
      process.env.SITE_ID ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.LAMBDA_TASK_ROOT,
  );
}

function normalizeMode(value: string | null | undefined): InterpretRouteMode | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;

  if (["legacy", "old", "ai", "classic"].includes(normalized)) return "legacy";
  if (["engine", "new", "kb", "tarot-engine"].includes(normalized)) return "engine";

  return null;
}

export function resolveSwitchMode(request: Request) {
  const url = new URL(request.url);
  return (
    normalizeMode(url.searchParams.get("mode")) ??
    normalizeMode(request.headers.get("x-tarot-interpret-mode")) ??
    normalizeMode(process.env.TAROT_INTERPRET_API_MODE) ??
    "legacy"
  );
}

function validateInput(input: InterpretInput) {
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

export function buildStreamHeaders(input: {
  mode: InterpretRouteMode;
  model: string;
  pipeline?: string;
  generationMode?: string;
  debug?: unknown;
  engineHeaders?: Record<string, string>;
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

  return {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    ...(input.engineHeaders ?? {}),
    "x-interpretation-interface": input.mode,
    "x-interpretation-mode": input.mode,
    "x-model": input.model,
    "x-interpretation-pipeline": input.pipeline ?? "unknown",
    "x-interpretation-generation-mode":
      input.generationMode ??
      (typeof debug?.generationMode === "string" ? debug.generationMode : input.mode),
    "x-interpretation-ms":
      typeof debug?.total_ms === "number" ? String(debug.total_ms) : "unknown",
    "x-interpretation-fallback-reason":
      typeof debug?.fallbackReason === "string" ? debug.fallbackReason : "none",
    "x-interpretation-quality-issues":
      qualityIssueIds.length > 0 ? qualityIssueIds.join(",") : "none",
    "x-interpretation-rejected-quality-issues":
      rejectedQualityIssueIds.length > 0 ? rejectedQualityIssueIds.join(",") : "none",
  };
}

export async function runInterpretation(input: InterpretInput, mode: InterpretRouteMode) {
  if (mode === "legacy") {
    return generateLegacyInterpretation(input);
  }

  return interpretTarot({
    ...input,
    dailyAstrology:
      input.spreadSlug === "single-guidance" ? resolveDailyAstrologyGuidance() : undefined,
  });
}

export async function readStreamAsText(stream: ReadableStream<Uint8Array>) {
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

async function resolveResponseBody(stream: ReadableStream<Uint8Array>) {
  if (isNetlifyFunctionRuntime()) {
    return readStreamAsText(stream);
  }

  return stream;
}

export async function handleInterpretRoute(
  request: Request,
  options: { mode?: InterpretRouteMode } = {},
) {
  try {
    const json = await request.json();
    const input = requestSchema.parse(json);
    const validationError = validateInput(input);

    if (validationError) return validationError;

    const mode = options.mode ?? resolveSwitchMode(request);
    const result = await runInterpretation(input, mode);
    const engineHeaders = "headers" in result ? result.headers : undefined;
    const body = await resolveResponseBody(result.stream);

    return new Response(body, {
      headers: buildStreamHeaders({
        mode,
        model: result.model,
        pipeline: result.pipeline,
        generationMode: result.generationMode,
        debug: result.debug,
        engineHeaders,
      }),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request.", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Interpretation failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
