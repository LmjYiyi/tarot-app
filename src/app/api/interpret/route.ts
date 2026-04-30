import { z, ZodError } from "zod";

import { generateInterpretation } from "@/lib/ai/provider";

export const runtime = "nodejs";

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

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const input = requestSchema.parse(json);
    const result = await generateInterpretation(input);

    return new Response(result.stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "x-model": result.model,
        "x-interpretation-pipeline": result.pipeline ?? "unknown",
        "x-interpretation-ms":
          typeof result.debug?.total_ms === "number" ? String(result.debug.total_ms) : "unknown",
        "x-interpretation-fallback-reason":
          typeof result.debug?.fallbackReason === "string" ? result.debug.fallbackReason : "none",
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request.", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Interpretation failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
