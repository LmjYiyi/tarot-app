import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { Ornament, toRoman } from "@/components/ui/ornament";
import { Panel } from "@/components/ui/panel";
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
    <div className="mx-auto w-full max-w-5xl px-6 py-16 lg:px-10 lg:py-24">
      <header className="space-y-6 text-center">
        <Ornament variant="quatrefoil" />
        <p className="eyebrow">Reading Share · Anno MMXXVI</p>
        <h1 className="font-serif-display text-[clamp(2.75rem,5vw,4.5rem)] leading-[1] text-[var(--ink)]">
          {spread?.nameZh ?? "塔罗解读"}
        </h1>
        <p className="mx-auto max-w-3xl font-serif-display text-[22px] italic leading-9 text-[var(--ink-soft)]">
          &ldquo;{reading.question || "我想看清自己当前最需要面对的课题。"}&rdquo;
        </p>
        <Ornament variant="rule" className="mx-auto max-w-xs" />
      </header>

      <div className="mt-14 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <Panel className="space-y-5">
          <p className="eyebrow">Cartae · 抽到的牌</p>
          <ul className="space-y-3">
            {reading.cards.map((drawnCard) => {
              const card = getCardById(drawnCard.cardId);
              const position = spread?.positions.find(
                (item) => item.order === drawnCard.positionOrder,
              );

              return (
                <li
                  key={`${drawnCard.cardId}-${drawnCard.positionOrder}`}
                  className="flex items-start gap-4 rounded-[16px] border border-[var(--gilt)]/40 bg-[rgba(255,249,232,0.55)] p-3"
                >
                  <div className="relative h-[98px] w-[56px] shrink-0 overflow-hidden rounded-[8px] border border-[rgba(197,154,76,0.5)] bg-white">
                    {card?.imageUrl ? (
                      <Image
                        src={card.imageUrl}
                        alt={card.nameZh}
                        fill
                        sizes="60px"
                        className={`object-cover ${drawnCard.reversed ? "rotate-180" : ""}`}
                      />
                    ) : null}
                  </div>
                  <div>
                    <p className="eyebrow-ink">
                      {toRoman(drawnCard.positionOrder)} · {position?.name ?? "未知位置"}
                    </p>
                    <p className="mt-1 font-serif-display text-[20px] text-[var(--ink)]">
                      {card?.nameZh ?? drawnCard.cardId}
                    </p>
                    <p className="text-[12px] text-[var(--ink-muted)]">
                      {card?.nameEn} · {drawnCard.reversed ? "逆位 REV" : "正位 UP"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          {reading.readingIntent ? (
            <div className="rounded-[14px] border border-[var(--gilt)]/40 bg-[rgba(255,249,232,0.6)] px-4 py-3 text-[12px] leading-6 text-[var(--ink-muted)]">
              <p className="eyebrow mb-1">Intent</p>
              {domainLabels[reading.readingIntent.domain]} · {goalLabels[reading.readingIntent.goal]}
            </div>
          ) : null}

          {reading.drawLog ? (
            <div className="rounded-[14px] border border-[var(--gilt)]/40 bg-[rgba(255,249,232,0.6)] px-4 py-3 text-[12px] leading-6 text-[var(--ink-muted)]">
              <p className="eyebrow mb-1">Draw Log</p>
              Seed：{reading.drawLog.seed}
              <br />
              规则：{reading.drawLog.drawRule}
            </div>
          ) : null}

          {reading.userFeedback ? (
            <div className="rounded-[14px] border border-[var(--gilt)]/40 bg-[rgba(255,249,232,0.6)] px-4 py-3 text-[12px] leading-6 text-[var(--ink-muted)]">
              <p className="eyebrow mb-1">Feedback</p>
              整体感受：{reading.userFeedback.overallFeeling || "未填写"}
              {reading.userFeedback.overallFeelingNote ? (
                <>
                  <br />
                  补充：{reading.userFeedback.overallFeelingNote}
                </>
              ) : null}
            </div>
          ) : null}

          {reading.adaptiveAnswers?.length ? (
            <div className="rounded-[14px] border border-[var(--gilt)]/40 bg-[rgba(255,249,232,0.6)] px-4 py-3 text-[12px] leading-6 text-[var(--ink-muted)]">
              <p className="eyebrow mb-1">Adaptive</p>
              {reading.adaptiveAnswers.map((answer) => (
                <p key={answer.questionId}>
                  {answer.question}：{answer.answerLabel || answer.answer}
                </p>
              ))}
            </div>
          ) : null}
        </Panel>

        <Panel className="space-y-4">
          <p className="eyebrow">Lectio Integra · 完整解读</p>
          <Ornament variant="rule" className="max-w-[220px]" />
          <div className="prose prose-neutral max-w-none whitespace-pre-wrap font-serif-display text-[16px] leading-8 text-[var(--ink-soft)]">
            {reading.aiInterpretation}
          </div>
        </Panel>
      </div>
    </div>
  );
}
