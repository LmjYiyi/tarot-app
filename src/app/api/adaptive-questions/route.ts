import { z } from "zod";

import { generateAdaptiveQuestions } from "@/lib/ai/provider";

export const runtime = "nodejs";

const readingIntentSchema = z.object({
  domain: z.enum(["career", "love", "study", "relationship", "self", "decision"]),
  goal: z.enum(["trend", "obstacle", "advice", "decision", "other_view"]),
});

const requestSchema = z.object({
  question: z.string().max(500).default(""),
  spreadSlug: z.string().min(1),
  locale: z.string().default("zh-CN"),
  readingIntent: readingIntentSchema.optional(),
  questionCount: z.number().int().min(2).max(4).optional(),
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
    const input = requestSchema.parse(await request.json());
    const result = await generateAdaptiveQuestions(input);

    return Response.json(result, {
      headers: {
        "Cache-Control": "no-store",
        "x-adaptive-pipeline": result.pipeline ?? "unknown",
        "x-adaptive-review-score":
          typeof result.reviewScore === "number" ? String(result.reviewScore) : "unknown",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate questions.";
    return Response.json({ error: message }, { status: 400 });
  }
}
