import { z } from "zod";

export const structuredAiPatchSchema = z.object({
  cards: z
    .array(
      z.object({
        cardId: z.string(),
        positionId: z.string(),
        polishedMeaning: z.string().min(20).optional(),
        advice: z.array(z.string()).default([]),
        reflectionQuestions: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  combinations: z
    .array(
      z.object({
        cardIds: z.array(z.string()),
        polishedSummary: z.string().min(10),
      }),
    )
    .default([]),
  reading: z
    .object({
      opening: z.string().min(20).optional(),
      overallTheme: z.string().min(6).optional(),
      summary: z.string().min(30).optional(),
      advice: z.array(z.string()).default([]),
      feedbackQuestions: z.array(z.string()).default([]),
    })
    .default({ advice: [], feedbackQuestions: [] }),
});

export type StructuredAiPatch = z.infer<typeof structuredAiPatchSchema>;
