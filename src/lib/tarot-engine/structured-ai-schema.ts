import { z } from "zod";

export const structuredAiPatchSchema = z.object({
  cards: z.array(
    z.object({
      cardId: z.string(),
      positionId: z.string(),
      polishedMeaning: z.string().min(20),
      advice: z.array(z.string()).default([]),
      reflectionQuestions: z.array(z.string()).default([]),
    }),
  ),
  combinations: z
    .array(
      z.object({
        cardIds: z.array(z.string()),
        polishedSummary: z.string().min(10),
      }),
    )
    .default([]),
  reading: z.object({
    opening: z.string().min(20),
    overallTheme: z.string().min(6),
    summary: z.string().min(30),
    advice: z.array(z.string()).min(1),
    feedbackQuestions: z.array(z.string()).min(1),
  }),
});

export type StructuredAiPatch = z.infer<typeof structuredAiPatchSchema>;
