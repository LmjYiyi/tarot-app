import { randomUUID } from "node:crypto";

import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AdaptiveAnswer, DrawLog, ReadingIntent, UserFeedback } from "@/lib/tarot/types";

const drawnCardSchema = z.object({
  cardId: z.string(),
  positionOrder: z.number().int().positive(),
  reversed: z.boolean(),
});

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

const drawLogSchema = z.object({
  seed: z.string().min(1),
  drawRule: z.string().min(1),
  reversedRate: z.number().min(0).max(1),
  createdAt: z.string().min(1),
});

const readingInputSchema = z.object({
  spreadSlug: z.string().min(1),
  question: z.string().trim().max(500),
  cards: z.array(drawnCardSchema).min(1),
  drawLog: drawLogSchema.optional().nullable(),
  readingIntent: readingIntentSchema.optional(),
  userFeedback: userFeedbackSchema.optional(),
  adaptiveAnswers: z.array(adaptiveAnswerSchema).optional(),
  cardPreviewText: z.string().max(4000).optional(),
  aiInterpretation: z.string().min(1),
  model: z.string().default("unknown"),
});

export type ReadingInput = z.infer<typeof readingInputSchema>;

export type ReadingRecord = ReadingInput & {
  id: string;
  shareToken: string;
  createdAt: string;
};

type SupabaseReadingRow = {
  id: string;
  share_token: string;
  spread_slug: string;
  question: string;
  cards: ReadingInput["cards"];
  draw_log: DrawLog | null;
  reading_intent: ReadingIntent | null;
  user_feedback: UserFeedback | null;
  adaptive_answers: AdaptiveAnswer[] | null;
  card_preview_text: string | null;
  ai_interpretation: string;
  model: string | null;
  created_at: string;
};

const globalStore = globalThis as typeof globalThis & {
  __tarotReadings?: Map<string, ReadingRecord>;
};

function getMemoryStore() {
  if (!globalStore.__tarotReadings) {
    globalStore.__tarotReadings = new Map<string, ReadingRecord>();
  }

  return globalStore.__tarotReadings;
}

function toRecord(row: SupabaseReadingRow): ReadingRecord {
  return {
    id: row.id,
    shareToken: row.share_token,
    spreadSlug: row.spread_slug,
    question: row.question,
    cards: row.cards,
    drawLog: row.draw_log,
    readingIntent: row.reading_intent ?? undefined,
    userFeedback: row.user_feedback ?? undefined,
    adaptiveAnswers: row.adaptive_answers ?? undefined,
    cardPreviewText: row.card_preview_text ?? undefined,
    aiInterpretation: row.ai_interpretation,
    model: row.model ?? "unknown",
    createdAt: row.created_at,
  };
}

function createShareToken() {
  return randomUUID().split("-")[0] + randomUUID().split("-")[0];
}

export async function saveReading(input: ReadingInput): Promise<ReadingRecord> {
  const parsed = readingInputSchema.parse(input);
  const shareToken = createShareToken();
  const supabase = getSupabaseServerClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("readings")
      .insert({
        share_token: shareToken,
        spread_slug: parsed.spreadSlug,
        question: parsed.question,
        cards: parsed.cards,
        draw_log: parsed.drawLog ?? null,
        reading_intent: parsed.readingIntent ?? null,
        user_feedback: parsed.userFeedback ?? null,
        adaptive_answers: parsed.adaptiveAnswers ?? null,
        card_preview_text: parsed.cardPreviewText ?? null,
        ai_interpretation: parsed.aiInterpretation,
        model: parsed.model,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toRecord(data as SupabaseReadingRow);
  }

  const record: ReadingRecord = {
    ...parsed,
    id: randomUUID(),
    shareToken,
    createdAt: new Date().toISOString(),
  };

  getMemoryStore().set(shareToken, record);
  return record;
}

export async function getReadingByToken(token: string): Promise<ReadingRecord | null> {
  const supabase = getSupabaseServerClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("readings")
      .select("*")
      .eq("share_token", token)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toRecord(data as SupabaseReadingRow) : null;
  }

  return getMemoryStore().get(token) ?? null;
}
