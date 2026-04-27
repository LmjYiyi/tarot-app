"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { InteractiveDeck, type RitualPhase, type SelectMode } from "@/components/InteractiveDeck";
import { MobileStickyDeck } from "@/components/MobileStickyDeck";
import { SpreadLayout } from "@/components/SpreadLayout";
import { StreamingInterpretation } from "@/components/StreamingInterpretation";
import { Button } from "@/components/ui/button";
import { toRoman } from "@/components/ui/ornament";
import { Panel } from "@/components/ui/panel";
import {
  getDefaultIntentForSpread,
  getDefaultQuestionForIntent,
} from "@/lib/tarot/adaptive-questions";
import { getCardById } from "@/lib/tarot/catalog";
import {
  DEFAULT_DRAW_RULE,
  DEFAULT_REVERSED_RATE,
  applyCut,
  drawFromIndices,
  shuffleDeck,
  type ShuffledDeck,
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

type FlowPhase =
  | "idle"
  | "shuffling"
  | "cutting"
  | "selecting"
  | "revealing"
  | "revealed"
  | "reading"
  | "done";

type ReadingExperienceProps = {
  spread: SpreadDefinition;
};

const phaseLabel: Record<FlowPhase, string> = {
  idle: "Ars I · 提问",
  shuffling: "Ars II · 洗牌",
  cutting: "Ars III · 切牌",
  selecting: "Ars IV · 选牌",
  revealing: "Ars V · 翻牌",
  revealed: "Ars VI · 反馈",
  reading: "Ars VII · 解读",
  done: "Ars VIII · 沉淀",
};

const phaseToDeckPhase: Record<FlowPhase, RitualPhase> = {
  idle: "idle",
  shuffling: "shuffling",
  cutting: "cutting",
  selecting: "selecting",
  revealing: "revealed",
  revealed: "revealed",
  reading: "revealed",
  done: "revealed",
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
  if (!rawValue) return DEFAULT_REVERSED_RATE;

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1
    ? parsed
    : DEFAULT_REVERSED_RATE;
}

function defaultModeFor(spread: SpreadDefinition): SelectMode {
  if (spread.cardCount <= 1) return "fan";
  if (spread.cardCount === 3) return "fan";
  if (spread.cardCount === 4) return "piles";
  if (spread.cardCount === 5) return "piles";
  if (spread.cardCount === 6) return "fan";
  if (spread.cardCount >= 7) return "piles";
  return "fan";
}

export function ReadingExperience({ spread }: ReadingExperienceProps) {
  const [question, setQuestion] = useState("");
  const [readingIntent, setReadingIntent] = useState<ReadingIntent>(() =>
    getDefaultIntentForSpread(spread.slug),
  );
  const [phase, setPhase] = useState<FlowPhase>("idle");
  const [selectMode, setSelectMode] = useState<SelectMode>(() => defaultModeFor(spread));
  const [shuffled, setShuffled] = useState<ShuffledDeck | null>(null);
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
  const [stickyDeckVisible, setStickyDeckVisible] = useState(false);
  const ritualRef = useRef<HTMLDivElement | null>(null);
  const mainSpreadRef = useRef<HTMLDivElement | null>(null);

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

  const cardsRevealed = resolvedCards.length > 0;

  useEffect(() => {
    if (!cardsRevealed) return;
    const target = mainSpreadRef.current;
    if (!target) return;

    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        const rect = target.getBoundingClientRect();
        setStickyDeckVisible(rect.bottom < 240);
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [cardsRevealed]);

  function updateIntent(nextIntent: Partial<ReadingIntent>) {
    setReadingIntent((current) => ({ ...current, ...nextIntent }));
    setAdaptiveAnswers([]);
    setAdaptiveQuestions([]);
    setCoreTension(null);
    setQuestionStrategy(null);
  }

  function updateAdaptiveAnswer(questionId: string, answer: string, answerLabel?: string) {
    const adaptiveQuestion = adaptiveQuestions.find((item) => item.id === questionId);
    if (!adaptiveQuestion) return;

    setAdaptiveAnswers((current) => {
      if (!answer.trim()) {
        return current.filter((item) => item.questionId !== questionId);
      }

      const nextAnswer: AdaptiveAnswer = {
        questionId,
        question: adaptiveQuestion.question,
        answer,
        answerLabel,
      };
      const withoutCurrent = current.filter((item) => item.questionId !== questionId);
      return [...withoutCurrent, nextAnswer];
    });
  }

  async function requestAdaptiveQuestions(drawnCards: DrawnCard[], finalQuestion: string) {
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
          question: finalQuestion,
          spreadSlug: spread.slug,
          cards: drawnCards,
          readingIntent,
          questionCount: spread.cardCount <= 1 ? 2 : Math.min(4, spread.cardCount + 1),
          locale: "zh-CN",
        }),
      });

      if (!response.ok) throw new Error("追问生成服务暂时不可用。");

      const payload = (await response.json()) as AdaptiveQuestionResponse;
      setAdaptiveQuestions(payload.questions ?? []);
      setCoreTension(payload.coreTension ?? null);
      setQuestionStrategy(payload.questionStrategy ?? null);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "追问生成失败。";
      setError(message);
    } finally {
      setQuestionsLoading(false);
    }
  }

  function resolveQuestion() {
    const trimmed = question.trim();
    if (trimmed) return trimmed;

    const fallback = getDefaultQuestionForIntent(readingIntent, spread.nameZh);
    setQuestion(fallback);
    return fallback;
  }

  function resetReadingState() {
    setError(null);
    setInterpretation("");
    setSharePath(null);
    setCoreTension(null);
    setQuestionStrategy(null);
    setAdaptiveQuestions([]);
    setAdaptiveAnswers([]);
    setDrawLog(null);
    setCards([]);
    setStickyDeckVisible(false);
  }

  function handleStartShuffle() {
    resetReadingState();
    resolveQuestion();

    const reversedRate = getConfiguredReversedRate();
    const newDeck = shuffleDeck({ reversedRate });
    setShuffled(newDeck);
    setPhase("shuffling");

    requestAnimationFrame(() => {
      ritualRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function handleShuffleAnimationDone() {
    setPhase("cutting");
  }

  function handleCutDone(cutPosition: number) {
    if (!shuffled) return;
    const cutDeck = applyCut(shuffled, cutPosition);
    setShuffled(cutDeck);
    setPhase("selecting");
  }

  function handleSelectionDone(indices: number[]) {
    if (!shuffled) return;

    const finalQuestion = resolveQuestion();
    const drawn = drawFromIndices(shuffled, indices);
    setCards(drawn);
    setDrawLog({
      seed: shuffled.seed,
      drawRule: `${DEFAULT_DRAW_RULE}::${selectMode}`,
      reversedRate: shuffled.reversedRate,
      createdAt: new Date().toISOString(),
    });
    setPhase("revealing");
    void requestAdaptiveQuestions(drawn, finalQuestion);
    window.setTimeout(() => setPhase("revealed"), 600);
  }

  function handleReshuffle() {
    setPhase("idle");
    setShuffled(null);
    resetReadingState();
  }

  async function handleInterpret() {
    try {
      const finalQuestion = resolveQuestion();

      setError(null);
      setPhase("reading");
      setInterpretation("");
      setSharePath(null);

      const response = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: finalQuestion,
          spreadSlug: spread.slug,
          cards,
          drawLog,
          readingIntent,
          adaptiveAnswers,
          locale: "zh-CN",
        }),
      });

      if (!response.ok || !response.body) throw new Error("解读服务暂时不可用。");

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
          question: finalQuestion,
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
        if (payload.sharePath) setSharePath(payload.sharePath);
      }

      setPhase("done");
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "解读生成失败。";
      setError(message);
      setPhase("revealed");
    }
  }

  const busy =
    phase === "shuffling" ||
    phase === "cutting" ||
    phase === "selecting" ||
    phase === "reading" ||
    questionsLoading;

  const showRitualOnly = phase === "shuffling" || phase === "cutting" || phase === "selecting";

  return (
    <div className="space-y-8">
      <MobileStickyDeck
        visible={cardsRevealed && stickyDeckVisible}
        spread={spread}
        cards={resolvedCards}
      />
      <div className="flex flex-col gap-4 border-b border-[var(--gilt)]/50 pb-6">
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
        <h1 className="font-serif-display text-[clamp(2.25rem,4.5vw,4rem)] leading-[0.98] text-[var(--text-primary)]">
          {spread.nameZh}
          <span className="ml-3 font-serif-display italic text-3xl text-[var(--gold-deep)]">
            · {toRoman(spread.cardCount)}
          </span>
        </h1>
        <p className="max-w-3xl text-[15px] leading-8 text-[var(--ink-soft)]">
          {spread.detail}
        </p>
      </div>

      {phase === "idle" ? (
        <IdleSetup
          question={question}
          questionLength={question.length}
          readingIntent={readingIntent}
          spread={spread}
          onQuestionChange={setQuestion}
          onIntentChange={updateIntent}
          onStart={handleStartShuffle}
        />
      ) : null}

      {showRitualOnly ? (
        <div ref={ritualRef} className="scroll-mt-24">
          <RitualShell phase={phase}>
            <InteractiveDeck
              phase={phaseToDeckPhase[phase]}
              cardCount={spread.cardCount}
              selectMode={selectMode}
              onModeChange={setSelectMode}
              onShuffleDone={handleShuffleAnimationDone}
              onCutDone={handleCutDone}
              onSelectionDone={handleSelectionDone}
            />
          </RitualShell>
        </div>
      ) : null}

      {cardsRevealed ? (
        <div
          ref={ritualRef}
          className="grid gap-6 scroll-mt-24 xl:grid-cols-[minmax(640px,1fr)_420px]"
        >
          <div ref={mainSpreadRef} className="min-w-0">
            <RitualShell phase={phase}>
              <SpreadLayout spread={spread} cards={resolvedCards} />
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-950/35 px-3 py-1.5 text-[11px] uppercase tracking-[0.28em] text-emerald-200 font-occult">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    已翻开 {resolvedCards.length} 张
                  </span>
                  {drawLog ? (
                    <span className="rounded-full border border-[rgba(243,210,138,0.35)] bg-[rgba(12,16,36,0.5)] px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-[rgba(243,210,138,0.65)] font-occult">
                      Seed {drawLog.seed.slice(0, 10)}
                    </span>
                  ) : null}
                </div>
                <Button variant="ghost" onClick={handleReshuffle} disabled={busy}>
                  重新开始
                </Button>
              </div>
            </RitualShell>
          </div>

          <aside className="min-w-0 space-y-5 xl:sticky xl:top-24 xl:self-start">
            <FollowupPanel
              questionsLoading={questionsLoading}
              adaptiveQuestions={adaptiveQuestions}
              adaptiveAnswers={adaptiveAnswers}
              onAnswer={updateAdaptiveAnswer}
              coreTension={coreTension}
              questionStrategy={questionStrategy}
              onSubmit={handleInterpret}
              busy={busy}
              phase={phase}
            />
            <StreamingInterpretation
              text={interpretation}
              isStreaming={phase === "reading"}
              sharePath={sharePath}
              adaptiveAnswers={adaptiveAnswers}
            />
            {error ? (
              <div className="rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {error}
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function IdleSetup({
  question,
  questionLength,
  readingIntent,
  spread,
  onQuestionChange,
  onIntentChange,
  onStart,
}: {
  question: string;
  questionLength: number;
  readingIntent: ReadingIntent;
  spread: SpreadDefinition;
  onQuestionChange: (value: string) => void;
  onIntentChange: (nextIntent: Partial<ReadingIntent>) => void;
  onStart: () => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Panel className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Intentio · 主题与目标</p>
            <h2 className="mt-1 font-serif-display text-3xl italic text-[var(--text-primary)]">
              先收束问题
            </h2>
          </div>
          <span className="text-[11px] uppercase tracking-[0.28em] text-[var(--ink-muted)] font-occult">
            {questionLength} / 280
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-[180px_180px_minmax(0,1fr)]">
          <label className="space-y-2">
            <span className="block text-[12px] font-medium text-[var(--ink-soft)]">
              占卜领域
            </span>
            <select
              value={readingIntent.domain}
              onChange={(event) =>
                onIntentChange({ domain: event.target.value as ReadingDomain })
              }
              className="w-full rounded-[12px] border border-[var(--border-strong)] bg-[var(--parchment-base)]/60 px-3 py-2.5 text-sm text-[var(--ink-rich)] outline-none backdrop-blur-md transition-all focus:border-[var(--brass)] focus:bg-[var(--parchment-base)]"
            >
              {domainOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-[var(--parchment-base)]">
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="block text-[12px] font-medium text-[var(--ink-muted)]">
              想看的方向
            </span>
            <select
              value={readingIntent.goal}
              onChange={(event) =>
                onIntentChange({ goal: event.target.value as ReadingGoal })
              }
              className="w-full rounded-[12px] border border-[var(--border-strong)] bg-[var(--parchment-base)]/60 px-3 py-2.5 text-sm text-[var(--ink-rich)] outline-none backdrop-blur-md transition-all focus:border-[var(--brass)] focus:bg-[var(--parchment-base)]"
            >
              {goalOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-[var(--parchment-base)]">
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="block text-[12px] font-medium text-[var(--ink-muted)]">
              你的问题
            </span>
            <textarea
              value={question}
              onChange={(event) => onQuestionChange(event.target.value.slice(0, 280))}
              rows={2}
              placeholder="例如：未来三个月事业发展怎么样？"
              className="min-h-[78px] w-full resize-y rounded-[14px] border border-[var(--border-strong)] bg-[var(--parchment-base)]/60 px-4 py-3 font-serif-display text-[18px] italic leading-7 text-[var(--ink-rich)] outline-none backdrop-blur-md transition-all placeholder:text-[var(--ink-faint)]/60 focus:border-[var(--brass)] focus:bg-[var(--parchment-base)]"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={onStart}>进入洗牌</Button>
          <p className="text-[12px] leading-6 text-[var(--ink-muted)]">
            不填写也可以，系统会按当前领域生成一个默认问题。
          </p>
        </div>
      </Panel>

      <Panel className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Loci · 牌阵位</p>
          <span className="rounded-full border border-[var(--border-strong)] px-3 py-1 text-[10px] uppercase tracking-[0.26em] text-[var(--ink-soft)] font-occult">
            {spread.cardCount} Cards
          </span>
        </div>
        <ul className="max-h-[210px] space-y-2 overflow-y-auto pr-1">
          {spread.positions.map((position) => (
            <li
              key={position.order}
              className="flex items-start gap-3 rounded-[12px] border border-[var(--border)] bg-[var(--nebula)] px-3 py-2.5"
            >
              <span className="roman mt-0.5 text-[17px] text-[var(--gold-deep)]">
                {toRoman(position.order)}
              </span>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{position.name}</p>
                <p className="mt-0.5 text-[12px] leading-5 text-[var(--ink-soft)]">
                  {position.focus}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function RitualShell({ children, phase }: { children: React.ReactNode; phase: FlowPhase }) {
  return (
    <Panel variant="dark" className="overflow-hidden p-0">
      <div className="relative min-h-[430px] p-5 lg:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage: "url(/spreads/astrology-chart-background.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative">
          <div className="mb-5 flex items-center justify-between gap-4">
            <p className="font-occult text-[10px] tracking-[0.4em] uppercase text-[rgba(243,210,138,0.85)]">
              Mensa Sacra · 仪式桌面
            </p>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[rgba(243,210,138,0.35)] to-transparent" />
            <p className="font-occult text-[10px] tracking-[0.4em] uppercase text-[rgba(243,210,138,0.55)]">
              {phaseToDeckPhase[phase] === "revealed" ? "Revealed" : "In Ritu"}
            </p>
          </div>
          {children}
        </div>
      </div>
    </Panel>
  );
}

function FollowupPanel({
  questionsLoading,
  adaptiveQuestions,
  adaptiveAnswers,
  onAnswer,
  coreTension,
  questionStrategy,
  onSubmit,
  busy,
  phase,
}: {
  questionsLoading: boolean;
  adaptiveQuestions: AdaptiveQuestion[];
  adaptiveAnswers: AdaptiveAnswer[];
  onAnswer: (questionId: string, answer: string, label?: string) => void;
  coreTension: string | null;
  questionStrategy: string | null;
  onSubmit: () => void;
  busy: boolean;
  phase: FlowPhase;
}) {
  const totalCount = adaptiveQuestions.length;
  const answeredCount = adaptiveAnswers.filter((answer) => answer.answer.trim()).length;

  const [currentStep, setCurrentStep] = useState(0);
  const [showContext, setShowContext] = useState(false);
  const [prevQuestions, setPrevQuestions] = useState(adaptiveQuestions);
  const advanceTimeoutRef = useRef<number | null>(null);

  if (prevQuestions !== adaptiveQuestions) {
    setPrevQuestions(adaptiveQuestions);
    setCurrentStep(0);
    setShowContext(false);
  }

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current !== null) {
        window.clearTimeout(advanceTimeoutRef.current);
      }
    };
  }, []);

  function clearPendingAdvance() {
    if (advanceTimeoutRef.current !== null) {
      window.clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
  }

  function goTo(index: number) {
    clearPendingAdvance();
    const clamped = Math.max(0, Math.min(index, totalCount));
    setCurrentStep(clamped);
  }

  function goNext() {
    goTo(currentStep + 1);
  }

  function goBack() {
    goTo(currentStep - 1);
  }

  function handleSelectChoice(questionId: string, value: string, label?: string) {
    onAnswer(questionId, value, label);
    clearPendingAdvance();
    advanceTimeoutRef.current = window.setTimeout(() => {
      advanceTimeoutRef.current = null;
      setCurrentStep((step) => Math.min(step + 1, totalCount));
    }, 420);
  }

  function handleSkipCurrent() {
    const current = adaptiveQuestions[currentStep];
    if (current) onAnswer(current.id, "");
    goNext();
  }

  function handleSkipAll() {
    clearPendingAdvance();
    setCurrentStep(totalCount);
  }

  const isSummary = totalCount > 0 && currentStep >= totalCount;
  const isEmpty = !questionsLoading && totalCount === 0;
  const currentQuestion = !isSummary ? adaptiveQuestions[currentStep] : undefined;
  const currentAnswer = currentQuestion
    ? adaptiveAnswers.find((item) => item.questionId === currentQuestion.id)
    : undefined;
  const hasContext = Boolean(coreTension || questionStrategy);

  return (
    <Panel className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Projectio · 牌面追问</p>
          <h2 className="mt-1 font-serif-display text-2xl italic leading-7 text-[var(--text-primary)]">
            塔罗的低语
          </h2>
          <p className="mt-1 text-[12px] leading-6 text-[var(--ink-muted)]">
            先回应几个直觉感受，解读会更贴你。
          </p>
        </div>
        {totalCount > 0 && !isSummary ? (
          <button
            type="button"
            onClick={handleSkipAll}
            className="font-occult text-[11px] uppercase tracking-[0.22em] text-[var(--ink-muted)] underline-offset-4 transition hover:text-[var(--copper)] hover:underline"
          >
            暂时不答 ↦
          </button>
        ) : null}
      </div>

      {questionsLoading ? (
        <div className="flex items-center gap-3 rounded-[14px] border border-[var(--gilt)]/45 bg-[var(--nebula)] px-4 py-4">
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--copper)] animate-shimmer" />
          <p className="text-[13px] leading-6 text-[var(--ink-soft)]">
            塔罗正在感受这副牌面...
          </p>
        </div>
      ) : null}

      {isEmpty ? (
        <>
          <p className="rounded-[14px] border border-[var(--gilt)]/45 bg-[var(--nebula)] px-4 py-3 text-[13px] leading-7 text-[var(--ink-soft)]">
            这次没有需要回答的牌面追问，可以直接生成解读。
          </p>
          <div className="flex justify-end pt-1">
            <Button onClick={onSubmit} disabled={busy || phase === "reading"}>
              {phase === "reading" ? "生成中..." : "生成解读"}
            </Button>
          </div>
        </>
      ) : null}

      {!questionsLoading && totalCount > 0 ? (
        <>
          <WizardProgress
            currentStep={currentStep}
            totalCount={totalCount}
            answeredCount={answeredCount}
            isSummary={isSummary}
            questions={adaptiveQuestions}
            answers={adaptiveAnswers}
          />

          {hasContext ? (
            <ContextDisclosure
              expanded={showContext}
              onToggle={() => setShowContext((value) => !value)}
              coreTension={coreTension}
              questionStrategy={questionStrategy}
            />
          ) : null}

          {isSummary ? (
            <WizardSummary
              questions={adaptiveQuestions}
              answers={adaptiveAnswers}
              onJumpTo={goTo}
            />
          ) : currentQuestion ? (
            <WizardQuestionCard
              key={currentQuestion.id}
              question={currentQuestion}
              answer={currentAnswer}
              onChoice={handleSelectChoice}
              onFreeTextChange={(value) => onAnswer(currentQuestion.id, value)}
              onFreeTextSubmit={goNext}
            />
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--gilt)]/45 pt-4">
            {!isSummary ? (
              <>
                <Button
                  variant="ghost"
                  onClick={goBack}
                  disabled={currentStep === 0}
                >
                  ← 回到上一题
                </Button>
                {currentQuestion?.answerType === "free_text" ? (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={handleSkipCurrent}>
                      这题先空着
                    </Button>
                    <Button variant="secondary" onClick={goNext}>
                      继续 →
                    </Button>
                  </div>
                ) : (
                  <Button variant="ghost" onClick={handleSkipCurrent}>
                    这题先空着 →
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => goTo(0)}>
                  ← 回到第一题
                </Button>
                <Button onClick={onSubmit} disabled={busy || phase === "reading"}>
                  {phase === "reading" ? "塔罗正在低语..." : "生成解读"}
                </Button>
              </>
            )}
          </div>
        </>
      ) : null}
    </Panel>
  );
}

function WizardProgress({
  currentStep,
  totalCount,
  answeredCount,
  isSummary,
  questions,
  answers,
}: {
  currentStep: number;
  totalCount: number;
  answeredCount: number;
  isSummary: boolean;
  questions: AdaptiveQuestion[];
  answers: AdaptiveAnswer[];
}) {
  const displayIndex = isSummary ? totalCount : currentStep + 1;
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between">
        <p className="font-occult text-[10px] uppercase tracking-[0.32em] text-[var(--ink-muted)]">
          Quaestio {toRoman(Math.max(displayIndex, 1))} · {displayIndex} / {totalCount}
        </p>
        <span className="font-occult text-[11px] text-[var(--ink-muted)]">
          已记下 {answeredCount} 处回应
        </span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: totalCount }).map((_, idx) => {
          const isPast = idx < currentStep || isSummary;
          const isCurrent = !isSummary && idx === currentStep;
          const question = questions[idx];
          const isAnswered = answers.some(
            (a) => a.questionId === question?.id && a.answer.trim() !== "",
          );

          return (
            <span
              key={idx}
              className={cn(
                "h-[3px] flex-1 rounded-full transition-all duration-500",
                isCurrent
                  ? "bg-[var(--copper)] shadow-[0_0_8px_rgba(183,91,48,0.4)]"
                  : isPast && isAnswered
                    ? "bg-[var(--gold-deep)]"
                    : "bg-[var(--gilt)]/40",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

function ContextDisclosure({
  expanded,
  onToggle,
  coreTension,
  questionStrategy,
}: {
  expanded: boolean;
  onToggle: () => void;
  coreTension: string | null;
  questionStrategy: string | null;
}) {
  return (
    <div className="rounded-[14px] border border-[var(--gilt)]/45 bg-[var(--nebula)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left"
      >
        <span className="font-occult text-[11px] uppercase tracking-[0.24em] text-[var(--ink-muted)]">
          为什么问这些
        </span>
        <span
          aria-hidden
          className="text-[var(--ink-muted)] transition-transform duration-200"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ↓
        </span>
      </button>
      {expanded ? (
        <div className="space-y-2 border-t border-[var(--gilt)]/30 px-4 py-3">
          {coreTension ? (
            <p className="text-[13px] leading-6 text-[var(--ink-soft)]">
              <span className="font-semibold text-[var(--text-primary)]">核心张力：</span>
              {coreTension}
            </p>
          ) : null}
          {questionStrategy ? (
            <p className="text-[13px] leading-6 text-[var(--ink-soft)]">
              <span className="font-semibold text-[var(--text-primary)]">追问策略：</span>
              {questionStrategy}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function WizardQuestionCard({
  question,
  answer,
  onChoice,
  onFreeTextChange,
  onFreeTextSubmit,
}: {
  question: AdaptiveQuestion;
  answer: AdaptiveAnswer | undefined;
  onChoice: (questionId: string, value: string, label?: string) => void;
  onFreeTextChange: (value: string) => void;
  onFreeTextSubmit: () => void;
}) {
  return (
    <div className="wizard-step-enter min-h-[220px] rounded-[14px] border border-[var(--gilt)]/45 bg-white/75 p-5">
      <p className="font-serif-display text-[21px] italic leading-8 text-[var(--text-primary)]">
        {question.question}
      </p>
      {question.basis || question.purpose ? (
        <p className="mt-2 text-[12px] leading-6 text-[var(--ink-muted)]">
          {question.basis}
          {question.purpose ? ` 用于${question.purpose}。` : ""}
        </p>
      ) : null}

      {question.answerType === "free_text" ? (
        <input
          autoFocus
          value={answer?.answer ?? ""}
          onChange={(event) => onFreeTextChange(event.target.value.slice(0, 120))}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onFreeTextSubmit();
            }
          }}
          placeholder="按直觉写一句就可以，可以留空。"
          className="mt-4 w-full rounded-[12px] border border-[var(--border)] bg-white/85 px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-faint)]/70 focus:border-[var(--glow-gold)] focus:bg-[var(--velvet)]"
        />
      ) : (
        <div className="mt-5 flex flex-wrap gap-2.5">
          {question.options?.map((option) => {
            const selected = answer?.answer === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChoice(question.id, option.value, option.label)}
                className={cn(
                  "rounded-full border px-4 py-2 text-[13px] transition-all duration-200",
                  selected
                    ? "border-[var(--copper)] bg-[rgba(183,91,48,0.18)] text-[var(--copper-ink)] shadow-[0_0_0_3px_rgba(183,91,48,0.12)]"
                    : "border-[var(--gilt)]/60 bg-white/60 text-[var(--text-primary)] hover:-translate-y-[0.5px] hover:border-[var(--copper)] hover:bg-white hover:shadow-sm",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WizardSummary({
  questions,
  answers,
  onJumpTo,
}: {
  questions: AdaptiveQuestion[];
  answers: AdaptiveAnswer[];
  onJumpTo: (index: number) => void;
}) {
  return (
    <div className="wizard-step-enter space-y-3 rounded-[14px] border border-[var(--gilt)]/45 bg-[var(--nebula)] p-4">
      <p className="font-occult text-[10px] uppercase tracking-[0.28em] text-[var(--ink-muted)]">
        Speculum · 答题概览
      </p>
      <ul className="space-y-1">
        {questions.map((question, index) => {
          const answer = answers.find((item) => item.questionId === question.id);
          const empty = !answer || !answer.answer.trim();
          const label = empty ? "" : answer?.answerLabel || answer?.answer || "";
          return (
            <li key={question.id}>
              <button
                type="button"
                onClick={() => onJumpTo(index)}
                className="flex w-full items-start gap-3 rounded-[10px] px-2 py-2 text-left transition hover:bg-white/70"
              >
                <span className="roman mt-0.5 text-[15px] text-[var(--gold-deep)]">
                  {toRoman(index + 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[13px] leading-6 text-[var(--text-primary)]">
                    {question.question}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 text-[12px]",
                      empty ? "italic text-[var(--ink-muted)]" : "text-[var(--copper-ink)]",
                    )}
                  >
                    {empty ? "未作答 · 点击补答" : `你的回应：${label}`}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
