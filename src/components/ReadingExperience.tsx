"use client";

import { useMemo, useRef, useState } from "react";

import { DeckShuffle } from "@/components/DeckShuffle";
import { SpreadLayout } from "@/components/SpreadLayout";
import { StreamingInterpretation } from "@/components/StreamingInterpretation";
import { Button } from "@/components/ui/button";
import { Ornament, toRoman } from "@/components/ui/ornament";
import { Panel } from "@/components/ui/panel";
import { getDefaultIntentForSpread } from "@/lib/tarot/adaptive-questions";
import { getCardById } from "@/lib/tarot/catalog";
import {
  DEFAULT_DRAW_RULE,
  DEFAULT_REVERSED_RATE,
  createDrawSeed,
  drawCards,
} from "@/lib/tarot/shuffle";
import type {
  AdaptiveAnswer,
  AdaptiveQuestion,
  DrawLog,
  DrawnCard,
  ReadingDomain,
  ReadingGoal,
  ReadingIntent,
  SpreadDefinition,
} from "@/lib/tarot/types";
import { cn } from "@/lib/utils";

type Phase = "idle" | "shuffling" | "revealed" | "reading" | "done";

type ReadingExperienceProps = {
  spread: SpreadDefinition;
};

const phaseLabel: Record<Phase, string> = {
  idle: "Ars I · 提问",
  shuffling: "Ars II · 洗牌",
  revealed: "Ars III · 反馈",
  reading: "Ars IV · 解读",
  done: "Ars V · 沉淀",
};

const domainOptions: Array<{ value: ReadingDomain; label: string }> = [
  { value: "career", label: "事业" },
  { value: "love", label: "感情" },
  { value: "study", label: "学业" },
  { value: "relationship", label: "人际" },
  { value: "self", label: "自我状态" },
  { value: "decision", label: "决策" },
];

const goalOptions: Array<{ value: ReadingGoal; label: string }> = [
  { value: "trend", label: "看趋势" },
  { value: "obstacle", label: "看阻碍" },
  { value: "advice", label: "看建议" },
  { value: "decision", label: "辅助决策" },
  { value: "other_view", label: "换个视角" },
];

type AdaptiveQuestionResponse = {
  coreTension?: string;
  questionStrategy?: string;
  questions?: AdaptiveQuestion[];
};

function getConfiguredReversedRate() {
  const rawValue = process.env.NEXT_PUBLIC_TAROT_REVERSED_RATE;

  if (!rawValue) {
    return DEFAULT_REVERSED_RATE;
  }

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1
    ? parsed
    : DEFAULT_REVERSED_RATE;
}

function getAdaptiveAnswerLabel(answer: AdaptiveAnswer | undefined) {
  if (!answer) return "";
  return answer.answerLabel || answer.answer;
}

export function ReadingExperience({ spread }: ReadingExperienceProps) {
  const [question, setQuestion] = useState("");
  const [readingIntent, setReadingIntent] = useState<ReadingIntent>(() =>
    getDefaultIntentForSpread(spread.slug),
  );
  const [phase, setPhase] = useState<Phase>("idle");
  const [cards, setCards] = useState<DrawnCard[]>([]);
  const [drawLog, setDrawLog] = useState<DrawLog | null>(null);
  const [adaptiveQuestions, setAdaptiveQuestions] = useState<AdaptiveQuestion[]>([]);
  const [adaptiveAnswers, setAdaptiveAnswers] = useState<AdaptiveAnswer[]>([]);
  const [coreTension, setCoreTension] = useState<string | null>(null);
  const [questionStrategy, setQuestionStrategy] = useState<string | null>(null);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [interpretation, setInterpretation] = useState("");
  const [sharePath, setSharePath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);

  const resolvedCards = useMemo(
    () =>
      cards
        .map((entry) => {
          const card = getCardById(entry.cardId);
          return card
            ? { card, reversed: entry.reversed, positionOrder: entry.positionOrder }
            : null;
        })
        .filter(
          (
            value,
          ): value is {
            card: NonNullable<ReturnType<typeof getCardById>>;
            reversed: boolean;
            positionOrder: number;
          } => Boolean(value),
        ),
    [cards],
  );

  function updateIntent(nextIntent: Partial<ReadingIntent>) {
    setReadingIntent((current) => ({ ...current, ...nextIntent }));
    setAdaptiveAnswers([]);
    setAdaptiveQuestions([]);
    setCoreTension(null);
    setQuestionStrategy(null);
  }

  function updateAdaptiveAnswer(questionId: string, answer: string, answerLabel?: string) {
    const question = adaptiveQuestions.find((item) => item.id === questionId);
    if (!question) return;

    setAdaptiveAnswers((current) => {
      if (!answer.trim()) {
        return current.filter((item) => item.questionId !== questionId);
      }

      const nextAnswer: AdaptiveAnswer = {
        questionId,
        question: question.question,
        answer,
        answerLabel,
      };
      const withoutCurrent = current.filter((item) => item.questionId !== questionId);
      return [...withoutCurrent, nextAnswer];
    });
  }

  async function requestAdaptiveQuestions(drawnCards: DrawnCard[]) {
    setQuestionsLoading(true);
    setAdaptiveQuestions([]);
    setAdaptiveAnswers([]);
    setCoreTension(null);
    setQuestionStrategy(null);

    try {
      const response = await fetch("/api/adaptive-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          spreadSlug: spread.slug,
          cards: drawnCards,
          readingIntent,
          questionCount: spread.cardCount <= 1 ? 2 : Math.min(4, spread.cardCount + 1),
          locale: "zh-CN",
        }),
      });

      if (!response.ok) {
        throw new Error("追问生成服务暂时不可用。");
      }

      const payload = (await response.json()) as AdaptiveQuestionResponse;
      setAdaptiveQuestions(payload.questions ?? []);
      setCoreTension(payload.coreTension ?? null);
      setQuestionStrategy(payload.questionStrategy ?? null);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "追问生成失败。";
      setError(message);
    } finally {
      setQuestionsLoading(false);
    }
  }

  function handleDraw() {
    setError(null);
    setInterpretation("");
    setSharePath(null);
    setCoreTension(null);
    setQuestionStrategy(null);
    setAdaptiveQuestions([]);
    setAdaptiveAnswers([]);
    setDrawLog(null);
    setPhase("shuffling");

    requestAnimationFrame(() => {
      tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    setTimeout(() => {
      const reversedRate = getConfiguredReversedRate();
      const seed = createDrawSeed();
      const nextCards = drawCards(spread.cardCount, { reversedRate, seed });

      setCards(nextCards);
      setDrawLog({
        seed,
        drawRule: DEFAULT_DRAW_RULE,
        reversedRate,
        createdAt: new Date().toISOString(),
      });
      setPhase("revealed");
      void requestAdaptiveQuestions(nextCards);
    }, 1200);
  }

  async function handleInterpret() {
    try {
      setError(null);
      setPhase("reading");
      setInterpretation("");
      setSharePath(null);

      const response = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          spreadSlug: spread.slug,
          cards,
          drawLog,
          readingIntent,
          adaptiveAnswers,
          locale: "zh-CN",
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("解读服务暂时不可用。");
      }

      const model = response.headers.get("x-model") ?? "unknown";
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        fullText += decoder.decode(value, { stream: true });
        setInterpretation(fullText);
      }

      const saveResponse = await fetch("/api/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          spreadSlug: spread.slug,
          cards,
          drawLog,
          readingIntent,
          adaptiveAnswers,
          aiInterpretation: fullText,
          model,
        }),
      });

      if (saveResponse.ok) {
        const payload = (await saveResponse.json()) as { sharePath?: string };
        if (payload.sharePath) {
          setSharePath(payload.sharePath);
        }
      }

      setPhase("done");
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "解读生成失败。";
      setError(message);
      setPhase("revealed");
    }
  }

  const busy = phase === "shuffling" || phase === "reading" || questionsLoading;

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 border-b border-[var(--gilt)]/50 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="eyebrow">Sessio · {spread.hero}</p>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.32em] text-[var(--ink-muted)] font-occult">
            <span
              className={cn(
                "inline-block h-1.5 w-1.5 rounded-full",
                busy ? "bg-[var(--copper)] animate-shimmer" : "bg-[var(--gold)]",
              )}
            />
            {phaseLabel[phase]}
          </div>
        </div>
        <h1 className="font-serif-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.98] text-[var(--ink)]">
          {spread.nameZh}
          <span className="ml-3 font-serif-display italic text-3xl text-[var(--gold-deep)]">
            · {toRoman(spread.cardCount)}
          </span>
        </h1>
        <p className="max-w-3xl text-[15px] leading-8 text-[var(--ink-soft)]">
          {spread.detail}
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-8">
          <Panel className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Intentio · 主题与目标</p>
                <h2 className="mt-1 font-serif-display text-3xl italic text-[var(--ink)]">
                  先收束问题，再抽牌
                </h2>
              </div>
              <span className="text-[11px] uppercase tracking-[0.28em] text-[var(--ink-muted)] font-occult">
                {question.length} / 280
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="block text-[12px] font-medium text-[var(--ink-soft)]">
                  占卜领域
                </span>
                <select
                  value={readingIntent.domain}
                  onChange={(event) =>
                    updateIntent({ domain: event.target.value as ReadingDomain })
                  }
                  className="w-full rounded-[14px] border border-[var(--border)] bg-[rgba(255,249,232,0.75)] px-4 py-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--copper)] focus:bg-white"
                >
                  {domainOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="block text-[12px] font-medium text-[var(--ink-soft)]">
                  想看的方向
                </span>
                <select
                  value={readingIntent.goal}
                  onChange={(event) => updateIntent({ goal: event.target.value as ReadingGoal })}
                  className="w-full rounded-[14px] border border-[var(--border)] bg-[rgba(255,249,232,0.75)] px-4 py-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--copper)] focus:bg-white"
                >
                  {goalOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value.slice(0, 280))}
              rows={3}
              placeholder="例如：未来三个月事业发展怎么样？"
              className="w-full rounded-[18px] border border-[var(--border)] bg-[rgba(255,249,232,0.65)] px-5 py-4 font-serif-display text-[20px] italic leading-8 text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-muted)]/70 focus:border-[var(--copper)] focus:bg-white"
            />

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleDraw} disabled={busy}>
                {phase === "idle"
                  ? "开始洗牌"
                  : phase === "shuffling"
                    ? "洗牌中..."
                    : questionsLoading
                      ? "生成追问中..."
                      : "重新洗牌"}
              </Button>
              {phase === "shuffling" ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--copper)]/40 bg-[rgba(183,94,52,0.08)] px-3 py-1.5 text-[11px] uppercase tracking-[0.28em] text-[var(--copper)] font-occult">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--copper)] animate-shimmer" />
                  程序正在洗牌
                </span>
              ) : null}
              {resolvedCards.length > 0 ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-50/70 px-3 py-1.5 text-[11px] uppercase tracking-[0.28em] text-emerald-800 font-occult">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  已翻开 {resolvedCards.length} 张
                </span>
              ) : null}
            </div>
          </Panel>

          <div ref={tableRef} className="scroll-mt-24">
            {phase === "idle" || phase === "shuffling" ? (
              <Panel variant="dark" className="p-10 lg:p-14">
                <div className="relative flex flex-col items-center gap-6">
                  <p className="eyebrow-gold">Mensa Sacra · 仪式桌面</p>
                  <Ornament variant="rule" tone="gold" className="w-48" />
                  <DeckShuffle active={phase === "shuffling"} />
                  <p className="max-w-md text-center text-[14px] leading-7 text-[rgba(246,232,206,0.72)]">
                    {phase === "shuffling"
                      ? "抽牌由程序完成，牌序和逆位会写入 seed 日志。"
                      : "点击洗牌后，先看牌面，不急着解释。"}
                  </p>
                </div>
              </Panel>
            ) : (
              <SpreadLayout spread={spread} cards={resolvedCards} />
            )}
          </div>

          {resolvedCards.length > 0 ? (
            <Panel className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">Projectio · 心理定位追问</p>
                  <h2 className="mt-1 font-serif-display text-3xl italic text-[var(--ink)]">
                    先回答牌面触发的问题，再生成解读
                  </h2>
                </div>
                {drawLog ? (
                  <span className="rounded-full border border-[var(--gilt)]/50 bg-[rgba(255,249,232,0.72)] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)] font-occult">
                    Seed {drawLog.seed}
                  </span>
                ) : null}
              </div>

              {coreTension || questionStrategy || questionsLoading ? (
                <div className="space-y-2 rounded-[14px] border border-[var(--gilt)]/45 bg-[rgba(255,249,232,0.56)] px-4 py-3">
                  {questionsLoading ? (
                    <p className="text-[13px] leading-6 text-[var(--ink-soft)]">
                      正在基于你的问题、抽出的牌面和牌阵位置生成追问...
                    </p>
                  ) : null}
                  {coreTension ? (
                    <p className="text-[13px] leading-6 text-[var(--ink-soft)]">
                      <span className="font-semibold text-[var(--ink)]">核心张力：</span>
                      {coreTension}
                    </p>
                  ) : null}
                  {questionStrategy ? (
                    <p className="text-[13px] leading-6 text-[var(--ink-soft)]">
                      <span className="font-semibold text-[var(--ink)]">追问策略：</span>
                      {questionStrategy}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {adaptiveQuestions.map((adaptiveQuestion) => {
                const answer = adaptiveAnswers.find(
                  (item) => item.questionId === adaptiveQuestion.id,
                );

                return (
                  <div
                    key={adaptiveQuestion.id}
                    className="space-y-3 rounded-[16px] border border-[var(--gilt)]/45 bg-[rgba(255,249,232,0.56)] p-4"
                  >
                    <p className="eyebrow-ink">牌面触发追问</p>
                    <p className="font-serif-display text-[22px] italic leading-8 text-[var(--ink)]">
                      {adaptiveQuestion.question}
                    </p>
                    {adaptiveQuestion.basis || adaptiveQuestion.purpose ? (
                      <p className="text-[12px] leading-6 text-[var(--ink-muted)]">
                        {adaptiveQuestion.basis}
                        {adaptiveQuestion.purpose ? ` 用于${adaptiveQuestion.purpose}。` : ""}
                      </p>
                    ) : null}
                    {adaptiveQuestion.answerType === "free_text" ? (
                      <input
                        value={answer?.answer ?? ""}
                        onChange={(event) =>
                          updateAdaptiveAnswer(
                            adaptiveQuestion.id,
                            event.target.value.slice(0, 120),
                          )
                        }
                        placeholder="按直觉写一句就可以，可以留空。"
                        className="w-full rounded-[14px] border border-[var(--border)] bg-white/55 px-4 py-3 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-muted)]/70 focus:border-[var(--copper)] focus:bg-white"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {adaptiveQuestion.options?.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              updateAdaptiveAnswer(
                                adaptiveQuestion.id,
                                option.value,
                                option.label,
                              )
                            }
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-[12px] transition",
                              answer?.answer === option.value
                                ? "border-[var(--copper)] bg-[rgba(183,91,48,0.12)] text-[var(--copper-ink)]"
                                : "border-[var(--gilt)]/45 bg-white/45 text-[var(--ink-soft)] hover:border-[var(--copper)]",
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {getAdaptiveAnswerLabel(answer) ? (
                      <p className="text-[12px] text-[var(--ink-muted)]">
                        已选择：{getAdaptiveAnswerLabel(answer)}
                      </p>
                    ) : null}
                  </div>
                );
              })}

              <div className="flex flex-wrap items-center gap-3">
                <Button variant="secondary" onClick={handleInterpret} disabled={busy}>
                  生成证据链解读
                </Button>
                <p className="max-w-xl text-[12px] leading-6 text-[var(--ink-muted)]">
                  这些问题由 AI 基于本次抽出的具体牌面、正逆位和牌阵位置生成，只收集你看牌后的感受；没有回答也可以生成基础解读。
                </p>
              </div>
            </Panel>
          ) : null}
        </div>

        <aside className="space-y-6">
          <Panel className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="eyebrow">Loci · 牌阵位</p>
              <span className="rounded-full border border-[var(--border-strong)] px-3 py-1 text-[10px] uppercase tracking-[0.26em] text-[var(--ink-soft)] font-occult">
                {spread.cardCount} Cards
              </span>
            </div>
            <ul className="space-y-2">
              {spread.positions.map((position) => (
                <li
                  key={position.order}
                  className="flex items-start gap-3 rounded-[14px] border border-[var(--border)] bg-[rgba(255,249,232,0.55)] px-3 py-3"
                >
                  <span className="roman mt-0.5 text-[18px] text-[var(--gold-deep)]">
                    {toRoman(position.order)}
                  </span>
                  <div>
                    <p className="font-semibold text-[var(--ink)]">{position.name}</p>
                    <p className="mt-1 text-[12px] leading-6 text-[var(--ink-soft)]">
                      {position.focus}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <StreamingInterpretation
            text={interpretation}
            isStreaming={phase === "reading"}
            sharePath={sharePath}
          />
          {error ? (
            <div className="rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
