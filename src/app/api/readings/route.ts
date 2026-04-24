import { z } from "zod";

import { saveReading } from "@/lib/readings/store";

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

const adaptiveAnswerSchema = z.object({
  questionId: z.string().min(1),
  question: z.string().min(1).max(300),
  answer: z.string().min(1).max(120),
  answerLabel: z.string().max(120).optional(),
});

const requestSchema = z.object({
  spreadSlug: z.string().min(1),
  question: z.string().max(500).default(""),
  model: z.string().default("unknown"),
  aiInterpretation: z.string().min(1),
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
  adaptiveAnswers: z.array(adaptiveAnswerSchema).optional(),
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
    const payload = requestSchema.parse(await request.json());
    const reading = await saveReading(payload);

    return Response.json({
      id: reading.id,
      shareToken: reading.shareToken,
      sharePath: `/r/${reading.shareToken}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save reading.";
    return Response.json({ error: message }, { status: 400 });
  }
}
