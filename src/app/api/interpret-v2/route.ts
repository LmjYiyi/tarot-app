import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { interpretTarotStructured } from "@/lib/tarot-engine/interpret-tarot-structured";
import { getCardById, getSpreadBySlug } from "@/lib/tarot/catalog";

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
    const spread = getSpreadBySlug(input.spreadSlug);

    if (!spread) {
      return NextResponse.json(
        { ok: false, error: "INVALID_SPREAD", spreadSlug: input.spreadSlug },
        { status: 400 },
      );
    }

    if (input.cards.length !== spread.cardCount) {
      return NextResponse.json(
        {
          ok: false,
          error: "CARD_COUNT_MISMATCH",
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
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_POSITION",
          positionOrder: invalidPosition.positionOrder,
          spreadSlug: spread.slug,
        },
        { status: 400 },
      );
    }

    const missingCard = input.cards.find((card) => !getCardById(card.cardId));

    if (missingCard) {
      return NextResponse.json(
        { ok: false, error: "INVALID_CARD", cardId: missingCard.cardId },
        { status: 400 },
      );
    }

    const result = await interpretTarotStructured(input);

    return NextResponse.json(
      {
        ok: true,
        data: result,
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "x-tarot-kb-version": result.kbVersion,
          "x-tarot-pipeline": result.pipeline,
          "x-tarot-quality-score": String(result.quality.score),
          "x-tarot-quality-passed": String(result.quality.passed),
        },
      },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "INVALID_REQUEST", issues: error.issues },
        { status: 400 },
      );
    }

    console.error("[api/interpret-v2] failed", error);

    return NextResponse.json(
      {
        ok: false,
        error: "INTERPRET_V2_FAILED",
        message: "结构化解读生成失败。",
      },
      { status: 500 },
    );
  }
}
