import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { AnnotatedInterpretation } from "@/components/AnnotatedInterpretation";
import { ReadingShareActions } from "@/components/ReadingShareActions";
import { Ornament } from "@/components/ui/ornament";
import { getReadingByToken } from "@/lib/readings/store";
import { getCardById, getSpreadBySlug } from "@/lib/tarot/catalog";
import type { ReadingDomain, ReadingGoal } from "@/lib/tarot/types";

type SharePageProps = {
  params: Promise<{ token: string }>;
};

const domainLabels: Record<ReadingDomain, string> = {
  career: "事业",
  love: "感情",
  study: "学业",
  relationship: "人际",
  self: "自我状态",
  decision: "决策",
};

const goalLabels: Record<ReadingGoal, string> = {
  trend: "看趋势",
  obstacle: "看阻碍",
  advice: "看建议",
  decision: "辅助决策",
  other_view: "换个视角",
};

function drawModeLabel(drawRule?: string) {
  if (!drawRule) return "凭直觉抽牌";
  if (drawRule.includes("fan")) return "扇形挑牌";
  if (drawRule.includes("piles")) return "三叠选一";
  if (drawRule.includes("number")) return "心象数字";
  return "凭直觉抽牌";
}

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { token } = await params;
  const reading = await getReadingByToken(token);

  if (!reading) {
    return {};
  }

  return {
    title: "塔罗解读分享 | Arcana Flow",
    description: reading.question || "一条来自 Arcana Flow 的塔罗解读分享。",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ReadingSharePage({ params }: SharePageProps) {
  const { token } = await params;
  const reading = await getReadingByToken(token);

  if (!reading) {
    notFound();
  }

  const spread = getSpreadBySlug(reading.spreadSlug);
  const shareActionCards = reading.cards.map((drawnCard) => {
    const card = getCardById(drawnCard.cardId);
    const position = spread?.positions.find(
      (item) => item.order === drawnCard.positionOrder,
    );

    return {
      cardId: drawnCard.cardId,
      cardName: card?.nameZh ?? drawnCard.cardId,
      imageUrl: card?.imageUrl,
      reversed: drawnCard.reversed,
      positionOrder: drawnCard.positionOrder,
      positionName: position?.name,
    };
  });
  const readingIntentLabel = reading.readingIntent
    ? `${domainLabels[reading.readingIntent.domain]} · ${goalLabels[reading.readingIntent.goal]}`
    : null;
  const readingDrawModeLabel = drawModeLabel(reading.drawLog?.drawRule);

  return (
    <div className="relative isolate overflow-hidden">
      {/* Background matching Homepage */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
      >
        <Image
          src="/spreads/site-edge-background-clean.jpg"
          alt=""
          fill
          sizes="100vw"
          priority
          className="scale-[1.01] object-cover opacity-[0.68] blur-[0.7px]"
        />
        <div className="absolute inset-0 bg-[rgba(251,240,200,0.22)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(251,240,200,0.06)_0%,rgba(251,240,200,0.16)_56%,rgba(251,240,200,0.44)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1320px] px-5 py-12 lg:px-12 lg:py-24">
        <header className="mx-auto max-w-4xl space-y-6 text-center">
          <Ornament variant="quatrefoil" />
          <p className="eyebrow">Reading Share · 牌面留存</p>
          <h1 className="font-serif-display text-[clamp(2.75rem,5vw,4.8rem)] leading-[1.04] tracking-[-0.018em] text-[var(--ink)]">
            {spread?.nameZh ?? "塔罗解读"}
          </h1>
          <p className="mx-auto max-w-3xl font-fraunces text-[22px] italic leading-9 text-[var(--ink-soft)]">
            &ldquo;{reading.question || "我想看清自己当前最需要面对的课题。"}&rdquo;
          </p>
          <ReadingShareActions
            spreadName={spread?.nameZh ?? "塔罗解读"}
            question={reading.question}
            interpretation={reading.aiInterpretation}
            sharePath={`/r/${token}`}
            cards={shareActionCards}
            intentLabel={readingIntentLabel}
            drawModeLabel={readingDrawModeLabel}
          />
          <Ornament variant="rule" className="mx-auto max-w-xs opacity-90 [--gilt:rgba(200,90,60,0.42)]" />
        </header>

        <div className="mx-auto mt-20 max-w-4xl">
          <div className="mb-14 text-center">
            <p className="eyebrow">完整解读</p>
            <h2 className="mt-4 font-serif-display text-[clamp(2.1rem,4vw,3.3rem)] leading-tight text-[var(--ink)]">
              这副牌想说的话
            </h2>
          </div>

          <div className="mb-16">
            <div className="mb-10 flex flex-wrap justify-center gap-x-12 gap-y-4 text-[14px] leading-7 text-[var(--ink-soft)]">
              {readingIntentLabel ? (
                <p>
                  <span className="font-medium text-[var(--ink)]">提问方向：</span>
                  {readingIntentLabel}
                </p>
              ) : null}
              <p>
                <span className="font-medium text-[var(--ink)]">抽牌方式：</span>
                {readingDrawModeLabel}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
              {shareActionCards.map((card) => (
                <div
                  key={`${card.cardId}-${card.positionOrder}`}
                  className="group flex w-[140px] flex-col items-center gap-5 text-center transition duration-300 hover:-translate-y-1 sm:w-[160px]"
                >
                  <div className="relative aspect-[300/524] w-full overflow-hidden rounded-[12px] border border-[rgba(74,59,50,0.20)] shadow-[0_18px_34px_rgba(74,59,50,0.11)]">
                    {card.imageUrl ? (
                      <Image
                        src={card.imageUrl}
                        alt={card.cardName}
                        fill
                        sizes="160px"
                        className={`object-cover transition duration-500 group-hover:scale-105 ${card.reversed ? "rotate-180" : ""}`}
                      />
                    ) : null}
                  </div>
                  <div>
                    <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                      {card.positionName ?? `牌位 ${card.positionOrder}`}
                    </p>
                    <p className="mt-2 font-serif-display text-[24px] leading-tight text-[var(--ink)]">
                      {card.cardName}
                    </p>
                    <p className="mt-1 text-[13px] text-[var(--ink-soft)]">
                      {card.reversed ? "逆位" : "正位"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Ornament
            variant="rule"
            className="mx-auto mb-14 max-w-md opacity-60 [--gilt:rgba(200,90,60,0.32)]"
          />

          <div className="mx-auto max-w-[720px]">
            <AnnotatedInterpretation
              text={reading.aiInterpretation}
              adaptiveAnswers={reading.adaptiveAnswers}
            />
            <div className="mt-20 flex flex-col items-center gap-3">
              <Ornament variant="sun" className="opacity-25" />
              <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--ink-muted)] opacity-60">
                Fin · 牌面已止
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
