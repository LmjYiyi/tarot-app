import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { AnnotatedInterpretation } from "@/components/AnnotatedInterpretation";
import { ReadingShareActions } from "@/components/ReadingShareActions";
import { Ornament, toRoman } from "@/components/ui/ornament";
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
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-20"
      >
        <Image
          src="/visuals/reading-result-background-clean.jpg"
          alt=""
          fill
          sizes="100vw"
          priority
          className="scale-[1.01] object-cover opacity-[0.72] blur-[0.5px]"
        />
      </div>
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(90deg,rgba(252,244,207,0.90)_0%,rgba(252,244,207,0.68)_48%,rgba(252,244,207,0.86)_100%)]"
        />
      <div className="editorial-parchment relative z-10 mx-auto w-full max-w-7xl px-5 py-12 lg:px-10 lg:py-18">
        <header className="mx-auto max-w-4xl space-y-6 text-center">
          <Ornament variant="quatrefoil" />
          <p className="eyebrow-ink">Reading Share · 牌面留存</p>
          <h1 className="font-serif-display text-[clamp(2.75rem,5vw,4.8rem)] leading-[1] text-[var(--ink)]">
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
          <Ornament variant="rule" className="mx-auto max-w-xs" />
        </header>

        <div className="mx-auto mt-12 max-w-4xl space-y-8">
          <aside className="hidden">
            <section className="rounded-[22px] border border-[var(--gilt)]/35 bg-[rgba(255,249,232,0.72)] p-5 shadow-[0_24px_70px_rgba(42,32,18,0.12)] backdrop-blur-md">
              <div className="mb-5 flex items-center justify-between gap-4">
                <p className="eyebrow-ink">抽到的牌</p>
                <span className="rounded-full border border-[var(--gilt)]/35 bg-[rgba(255,249,232,0.55)] px-3 py-1 text-[11px] text-[var(--ink-muted)]">
                  {reading.cards.length} 张
                </span>
              </div>
              <div className="grid gap-4">
                {reading.cards.map((drawnCard) => {
                  const card = getCardById(drawnCard.cardId);
                  const position = spread?.positions.find(
                    (item) => item.order === drawnCard.positionOrder,
                  );

                  return (
                    <article
                      key={`${drawnCard.cardId}-${drawnCard.positionOrder}`}
                      className="grid grid-cols-[140px_minmax(0,1fr)] gap-5 rounded-[18px] border border-[var(--gilt)]/35 bg-[rgba(255,249,232,0.62)] p-3"
                    >
                      <div className="relative aspect-[300/524] w-full overflow-hidden rounded-[12px] border border-[var(--gilt)]/55 bg-[var(--vellum-1)] shadow-[0_12px_28px_rgba(42,32,18,0.16)]">
                        {card?.imageUrl ? (
                          <Image
                            src={card.imageUrl}
                            alt={card.nameZh}
                            fill
                            sizes="150px"
                            className={`object-cover ${drawnCard.reversed ? "rotate-180" : ""}`}
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 self-center">
                        <p className="eyebrow-ink">
                          {toRoman(drawnCard.positionOrder)} · {position?.name ?? "牌位"}
                        </p>
                        <p className="mt-2 font-serif-display text-[25px] leading-tight text-[var(--ink)]">
                          {card?.nameZh ?? drawnCard.cardId}
                        </p>
                        <p className="mt-1 text-[12.5px] text-[var(--ink-muted)]">
                          {drawnCard.reversed ? "逆位" : "正位"}
                        </p>
                        {position?.focus ? (
                          <p className="mt-3 line-clamp-3 text-[13px] leading-6 text-[var(--ink-soft)]">
                            {position.focus}
                          </p>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[20px] border border-[var(--gilt)]/30 bg-[rgba(255,249,232,0.68)] p-5 text-[13px] leading-7 text-[var(--ink-soft)] shadow-[0_16px_45px_rgba(42,32,18,0.10)] backdrop-blur-md">
              {reading.readingIntent ? (
                <p>
                  <span className="font-medium text-[var(--ink)]">提问方向：</span>
                  {domainLabels[reading.readingIntent.domain]} · {goalLabels[reading.readingIntent.goal]}
                </p>
              ) : null}
              <p>
                <span className="font-medium text-[var(--ink)]">抽牌方式：</span>
                {drawModeLabel(reading.drawLog?.drawRule)}
              </p>
              {reading.adaptiveAnswers?.length ? (
                <div className="mt-3 border-t border-[var(--gilt)]/25 pt-3">
                  <p className="font-medium text-[var(--ink)]">当时补充的直觉：</p>
                  {reading.adaptiveAnswers.map((answer, index) => (
                    <p key={answer.questionId} className="mt-1">
                      {index + 1}. {answer.answerLabel || answer.answer}
                    </p>
                  ))}
                </div>
              ) : null}
            </section>
          </aside>

          <article className="rounded-[24px] border border-[var(--gilt)]/35 bg-[rgba(255,249,232,0.78)] px-5 py-7 shadow-[0_30px_90px_rgba(42,32,18,0.14)] backdrop-blur-md sm:px-8 lg:px-10">
            <div className="mb-8">
              <p className="eyebrow-ink">完整解读</p>
              <h2 className="mt-2 font-serif-display text-[clamp(2.1rem,4vw,3.3rem)] leading-tight text-[var(--ink)]">
                这副牌想说的话
              </h2>
              <Ornament variant="rule" className="mt-5 max-w-[220px]" />
            </div>
            <div className="mb-8 space-y-5 rounded-[20px] border border-[var(--gilt)]/30 bg-[rgba(255,249,232,0.62)] p-4 sm:p-5">
              <div className="grid gap-3 text-[13.5px] leading-7 text-[var(--ink-soft)] sm:grid-cols-2">
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
              <div className="grid gap-4 sm:grid-cols-3">
                {shareActionCards.map((card) => (
                  <article
                    key={`${card.cardId}-${card.positionOrder}`}
                    className="flex flex-col items-center gap-3 rounded-[18px] border border-[var(--gilt)]/25 bg-[rgba(255,255,255,0.28)] p-3 text-center transition-transform hover:scale-[1.02]"
                  >
                    <div className="relative aspect-[300/524] w-[130px] overflow-hidden rounded-[10px] border border-[var(--gilt)]/35 bg-[var(--vellum-1)] shadow-[0_12px_35px_rgba(42,32,18,0.18)]">
                      {card.imageUrl ? (
                        <Image
                          src={card.imageUrl}
                          alt={card.cardName}
                          fill
                          sizes="160px"
                          className={`object-cover ${card.reversed ? "rotate-180" : ""}`}
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                        {card.positionName ?? `牌位 ${card.positionOrder}`}
                      </p>
                      <p className="mt-1.5 font-serif-display text-[21px] leading-tight text-[var(--ink)]">
                        {card.cardName}
                      </p>
                      <p className="mt-1 text-[13px] text-[var(--ink-muted)]">
                        {card.reversed ? "逆位" : "正位"}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <AnnotatedInterpretation
              text={reading.aiInterpretation}
              adaptiveAnswers={reading.adaptiveAnswers}
            />
          </article>
        </div>
      </div>
    </div>
  );
}
