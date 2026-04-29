"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { InteractiveDeck, type RitualPhase, type SelectMode } from "@/components/InteractiveDeck";
import { MobileStickyDeck } from "@/components/MobileStickyDeck";
import { SpreadLayout } from "@/components/SpreadLayout";
import { StreamingInterpretation } from "@/components/StreamingInterpretation";
import { Button } from "@/components/ui/button";
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
  idle: "01 · 提问",
  shuffling: "02 · 洗牌",
  cutting: "03 · 切牌",
  selecting: "04 · 选牌",
  revealing: "05 · 翻牌",
  revealed: "06 · 补充",
  reading: "07 · 解读",
  done: "08 · 沉淀",
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
  const preliminaryOverview = useMemo(() => {
    if (!cardsRevealed) return null;

    const focusCards = resolvedCards.slice(0, Math.min(3, resolvedCards.length));
    const themes = focusCards
      .flatMap(({ card, reversed }) =>
        (reversed ? card.keywordsReversed : card.keywordsUpright).slice(0, 2),
      )
      .slice(0, 5);
    const lead = focusCards[0];
    const leadPosition = lead
      ? spread.positions.find((position) => position.order === lead.positionOrder)
      : undefined;
    const tone = resolvedCards.filter((item) => item.reversed).length > resolvedCards.length / 2
      ? "这组牌先把阻滞、犹豫或未被承认的部分推到台前。"
      : "这组牌的第一层信息偏向流动、显化与可执行的下一步。";

    return {
      oneLine: lead
        ? `${leadPosition?.name ?? "核心牌位"}的「${lead.card.nameZh}」先把问题落在“${themes[0] ?? lead.card.nameZh}”上。`
        : "牌面已经展开，可以先看整体倾向，再决定是否补充追问。",
      tone,
      themes,
      cards: focusCards,
    };
  }, [cardsRevealed, resolvedCards, spread.positions]);

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

      if (!response.ok) throw new Error("补充问题暂时没有出现，可以先看牌面解读。");

      const payload = (await response.json()) as AdaptiveQuestionResponse;
      setAdaptiveQuestions(payload.questions ?? []);
      setCoreTension(payload.coreTension ?? null);
      setQuestionStrategy(payload.questionStrategy ?? null);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "补充问题暂时没有出现。";
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

      if (!response.ok || !response.body) throw new Error("牌面一时没有回应，请稍后再试。");

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
      const message = caughtError instanceof Error ? caughtError.message : "这次解读没有顺利展开。";
      setError(message);
      setPhase("revealed");
    }
  }

  const interactionBusy =
    phase === "shuffling" ||
    phase === "cutting" ||
    phase === "selecting" ||
    phase === "reading";
  const busy = interactionBusy || questionsLoading;

  const showRitualOnly = phase === "shuffling" || phase === "cutting" || phase === "selecting";

  return (
    <div className="space-y-10">
      <MobileStickyDeck
        visible={cardsRevealed && stickyDeckVisible}
        spread={spread}
        cards={resolvedCards}
      />

      {/* Header — quiet, editorial */}
      <header className="space-y-5 border-b border-[var(--line)] pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="eyebrow">{spread.hero}</p>
          <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            <span
              className={cn(
                "inline-block h-1.5 w-1.5 rounded-full",
                busy ? "bg-[var(--coral)] animate-shimmer" : "bg-[var(--ink-faint)]",
              )}
            />
            {phaseLabel[phase]}
          </div>
        </div>
        <h1 className="font-serif-display text-[clamp(2.4rem,4.6vw,3.8rem)] leading-[1.02] text-[var(--ink)]">
          {spread.nameZh}
          <span className="ml-3 text-[var(--ink-muted)] font-light">
            · {spread.cardCount} 张
          </span>
        </h1>
        <p className="max-w-2xl text-[15.5px] leading-[1.75] text-[var(--ink-soft)]">
          {spread.detail}
        </p>
      </header>

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
          className="grid gap-8 scroll-mt-24 xl:grid-cols-[minmax(640px,1fr)_440px]"
        >
          <div ref={mainSpreadRef} className="min-w-0">
            <RitualShell phase={phase}>
              <SpreadLayout spread={spread} cards={resolvedCards} />
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[var(--coral-wash)] px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--coral-deep)]">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--coral)]" />
                    已翻开 {resolvedCards.length} 张
                  </span>
                  {drawLog ? (
                    <span className="rounded-full border border-[var(--line)] px-3 py-1 font-mono text-[10px] tracking-[0.16em] text-[var(--ink-muted)]">
                      牌纹 · {drawLog.seed.slice(0, 10)}
                    </span>
                  ) : null}
                </div>
                <Button variant="ghost" onClick={handleReshuffle} disabled={busy}>
                  重新开始
                </Button>
              </div>
            </RitualShell>
          </div>

          <aside className="min-w-0 space-y-6 xl:sticky xl:top-24 xl:self-start">
            {preliminaryOverview ? (
              <PreliminaryOverview overview={preliminaryOverview} />
            ) : null}
            <FollowupPanel
              questionsLoading={questionsLoading}
              adaptiveQuestions={adaptiveQuestions}
              adaptiveAnswers={adaptiveAnswers}
              onAnswer={updateAdaptiveAnswer}
              coreTension={coreTension}
              questionStrategy={questionStrategy}
              onSubmit={handleInterpret}
              busy={interactionBusy}
              phase={phase}
            />
            <StreamingInterpretation
              text={interpretation}
              isStreaming={phase === "reading"}
              sharePath={sharePath}
              adaptiveAnswers={adaptiveAnswers}
            />
            {error ? (
              <div className="rounded-[12px] border border-[rgba(184,92,110,0.4)] bg-[rgba(184,92,110,0.06)] px-4 py-3 text-sm text-[#8a3447]">
                {error}
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </div>
  );
}

/* ============================================================
   Idle setup — editorial question form
   ============================================================ */

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
      <Panel className="space-y-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">主题与目标</p>
            <h2 className="mt-2 font-serif-display text-[26px] leading-tight text-[var(--ink)]">
              先把问题收束清楚
            </h2>
          </div>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            {questionLength} / 280
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <SegmentedField
            label="占卜领域"
            value={readingIntent.domain}
            options={domainOptions}
            onChange={(value) => onIntentChange({ domain: value as ReadingDomain })}
          />
          <SegmentedField
            label="想看的方向"
            value={readingIntent.goal}
            options={goalOptions}
            onChange={(value) => onIntentChange({ goal: value as ReadingGoal })}
          />
        </div>

        <label className="block space-y-2">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            你的问题
          </span>
          <textarea
            value={question}
            onChange={(event) => onQuestionChange(event.target.value.slice(0, 280))}
            rows={3}
            placeholder="例如：未来三个月事业发展会怎么样？"
            className="w-full resize-y rounded-[12px] border border-[var(--line-strong)] bg-[var(--surface)] px-4 py-3.5 font-serif-display text-[19px] leading-[1.6] text-[var(--ink)] outline-none transition-all placeholder:text-[var(--ink-faint)] focus:border-[var(--coral)] focus:bg-[var(--surface-tint)] focus:shadow-[0_0_0_3px_var(--coral-wash)]"
          />
        </label>

        <div className="flex flex-wrap items-center gap-4 border-t border-[var(--line)] pt-5">
          <Button onClick={onStart}>进入洗牌 →</Button>
          <p className="text-[13px] leading-6 text-[var(--ink-muted)]">
            不填写也可以，我会先替你放入一个适合这副牌阵的问题。
          </p>
        </div>
      </Panel>

      <Panel className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="eyebrow">牌位</p>
          <span className="rounded-full border border-[var(--line)] px-2.5 py-0.5 font-mono text-[10px] tracking-[0.18em] text-[var(--ink-soft)]">
            {spread.cardCount} cards
          </span>
        </div>
        <ul className="max-h-[260px] space-y-1 overflow-y-auto pr-1">
          {spread.positions.map((position) => (
            <li
              key={position.order}
              className="flex items-start gap-3 rounded-[10px] px-2 py-2 transition hover:bg-[var(--surface-raised)]"
            >
              <span className="mt-[2px] inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--coral-wash)] font-mono text-[10px] text-[var(--coral-deep)]">
                {position.order}
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-[var(--ink)]">
                  {position.name}
                </p>
                <p className="mt-0.5 text-[12.5px] leading-5 text-[var(--ink-soft)]">
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

function SegmentedField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              type="button"
              key={option.value}
              onClick={() => onChange(option.value)}
              className={cn(
                "rounded-[8px] border px-3 py-1.5 text-[13px] transition-all",
                active
                  ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]"
                  : "border-[var(--line-strong)] bg-transparent text-[var(--ink-soft)] hover:border-[var(--ink-soft)] hover:text-[var(--ink)]",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   Ritual shell — calm cream stage, no Latin chrome
   ============================================================ */

function RitualShell({ children, phase }: { children: React.ReactNode; phase: FlowPhase }) {
  const phaseTitle = phaseLabel[phase];
  return (
    <Panel className="overflow-hidden p-0">
      <div className="relative min-h-[440px] p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
            仪式桌面
          </p>
          <div className="h-px flex-1 bg-[var(--line)]" />
          <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--ink-soft)]">
            {phaseTitle}
          </p>
        </div>
        {children}
      </div>
    </Panel>
  );
}

function PreliminaryOverview({
  overview,
}: {
  overview: {
    oneLine: string;
    tone: string;
    themes: string[];
    cards: Array<{
      card: NonNullable<ReturnType<typeof getCardById>>;
      reversed: boolean;
      positionOrder: number;
    }>;
  };
}) {
  return (
    <Panel className="space-y-4 border-[var(--coral-edge)] bg-[var(--surface)]">
      <div>
        <p className="eyebrow">初步概览</p>
        <h2 className="mt-1.5 font-serif-display text-[22px] leading-tight text-[var(--ink)]">
          先给你一句牌面提示
        </h2>
      </div>

      <p className="font-serif-display text-[20px] leading-[1.55] text-[var(--ink)]">
        {overview.oneLine}
      </p>
      <p className="text-[13.5px] leading-7 text-[var(--ink-soft)]">
        {overview.tone}
      </p>

      {overview.themes.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {overview.themes.map((theme) => (
            <span
              key={theme}
              className="rounded-full border border-[var(--coral-edge)] bg-[var(--coral-wash)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--coral-deep)]"
            >
              {theme}
            </span>
          ))}
        </div>
      ) : null}
    </Panel>
  );
}

/* ============================================================
   Followup wizard
   ============================================================ */

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
    <Panel className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">牌面追问</p>
          <h2 className="mt-1.5 font-serif-display text-[22px] leading-tight text-[var(--ink)]">
            补几句直觉
          </h2>
          <p className="mt-1 text-[13px] leading-6 text-[var(--ink-muted)]">
            愿意多说几句，牌面会读得更贴近你；想先看结论，也可以直接展开。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {totalCount > 0 && !isSummary ? (
            <button
              type="button"
              onClick={handleSkipAll}
              className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--ink-muted)] underline-offset-4 transition hover:text-[var(--coral-deep)] hover:underline"
            >
              跳过填写
            </button>
          ) : null}
          <Button onClick={onSubmit} disabled={busy || phase === "reading"}>
            {phase === "reading" ? "读牌中..." : "直接看解读"}
          </Button>
        </div>
      </div>

      {questionsLoading ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--coral)] animate-shimmer" />
            <p className="text-[13.5px] leading-6 text-[var(--ink-soft)]">
              牌面正在浮出几个补充问题，不影响你先看解读。
            </p>
          </div>
        </div>
      ) : null}

      {isEmpty ? (
        <>
          <p className="rounded-[12px] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-[13.5px] leading-7 text-[var(--ink-soft)]">
            这次没有需要补充的问题，可以直接看解读。
          </p>
          <div className="flex justify-end pt-1">
            <Button onClick={onSubmit} disabled={busy || phase === "reading"}>
              {phase === "reading" ? "读牌中..." : "看解读"}
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

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
            {!isSummary ? (
              <>
                <Button
                  variant="ghost"
                  onClick={goBack}
                  disabled={currentStep === 0}
                >
                  ← 上一题
                </Button>
                {currentQuestion?.answerType === "free_text" ? (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={handleSkipCurrent}>
                      空着
                    </Button>
                    <Button variant="secondary" onClick={goNext}>
                      继续 →
                    </Button>
                  </div>
                ) : (
                  <Button variant="ghost" onClick={handleSkipCurrent}>
                    空着 →
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => goTo(0)}>
                  ← 回第一题
                </Button>
                <Button onClick={onSubmit} disabled={busy || phase === "reading"}>
                  {phase === "reading" ? "塔罗正在低语..." : "看解读"}
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
        <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
          Q{String(displayIndex).padStart(2, "0")} / {String(totalCount).padStart(2, "0")}
        </p>
        <span className="font-mono text-[10.5px] tracking-[0.16em] text-[var(--ink-muted)]">
          已记下 {answeredCount}
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
                  ? "bg-[var(--coral)]"
                  : isPast && isAnswered
                    ? "bg-[var(--coral-deep)]"
                    : "bg-[var(--line-strong)]",
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
    <div className="rounded-[12px] border border-[var(--line)] bg-[var(--surface)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left"
      >
        <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
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
        <div className="space-y-2 border-t border-[var(--line)] px-4 py-3">
          {coreTension ? (
            <p className="text-[13px] leading-6 text-[var(--ink-soft)]">
              <span className="font-medium text-[var(--ink)]">核心张力：</span>
              {coreTension}
            </p>
          ) : null}
          {questionStrategy ? (
            <p className="text-[13px] leading-6 text-[var(--ink-soft)]">
              <span className="font-medium text-[var(--ink)]">追问策略：</span>
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
    <div className="wizard-step-enter min-h-[220px] rounded-[14px] border border-[var(--line)] bg-[var(--surface)] p-5">
      <p className="font-serif-display text-[20px] leading-[1.55] text-[var(--ink)]">
        {question.question}
      </p>
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
          placeholder="按直觉写一句就好，可以留空。"
          className="mt-4 w-full rounded-[10px] border border-[var(--line-strong)] bg-[var(--surface-tint)] px-3.5 py-2.5 text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--coral)] focus:shadow-[0_0_0_3px_var(--coral-wash)]"
        />
      ) : (
        <div className="mt-5 flex flex-wrap gap-2">
          {question.options?.map((option) => {
            const selected = answer?.answer === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChoice(question.id, option.value, option.label)}
                className={cn(
                  "rounded-[10px] border px-3.5 py-1.5 text-[13px] transition-all duration-150",
                  selected
                    ? "border-[var(--coral)] bg-[var(--coral)] text-white shadow-[0_2px_8px_rgba(168,85,62,0.25)]"
                    : "border-[var(--line-strong)] bg-transparent text-[var(--ink)] hover:border-[var(--coral)] hover:bg-[var(--coral-wash)] hover:text-[var(--coral-deep)]",
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
    <div className="wizard-step-enter space-y-1 rounded-[14px] border border-[var(--line)] bg-[var(--surface)] p-4">
      <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        答题概览
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
                className="flex w-full items-start gap-3 rounded-[8px] px-2 py-2 text-left transition hover:bg-[var(--surface-raised)]"
              >
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--coral-wash)] font-mono text-[10px] text-[var(--coral-deep)]">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[13px] leading-6 text-[var(--ink)]">
                    {question.question}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 text-[12.5px]",
                      empty ? "italic text-[var(--ink-muted)]" : "text-[var(--coral-deep)]",
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
