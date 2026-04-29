import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { AnnotatedInterpretation } from "@/components/AnnotatedInterpretation";
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

  return (
    <div className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-20"
      >
        <Image
          src="/spreads/astrology-chart-background-v2.png"
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
      </div>
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(90deg,rgba(252,244,207,0.92)_0%,rgba(252,244,207,0.78)_48%,rgba(252,244,207,0.9)_100%)]"
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
          <Ornament variant="rule" className="mx-auto max-w-xs" />
        </header>

        <div className="mt-12 grid gap-8 xl:grid-cols-[420px_minmax(0,1fr)] xl:items-start">
          <aside className="space-y-5 xl:sticky xl:top-24">
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
