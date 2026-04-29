"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

import { CardBack } from "@/components/DeckShuffle";
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
import { getAllCards, getCardById } from "@/lib/tarot/catalog";
import {
  DEFAULT_DRAW_RULE,
  DEFAULT_REVERSED_RATE,
  applyCut,
  drawFromIndices,
  shuffleDeck,
  type ShuffledDeck,
} from "@/lib/tarot/shuffle";
import { layoutPresets, type LayoutPreset } from "@/lib/tarot/layout-config";
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
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
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
  const shufflePreviewCards = useMemo(
    () =>
      getAllCards()
        .filter((card): card is typeof card & { imageUrl: string } =>
          Boolean(card.imageUrl),
        )
        .map((card) => ({
          imageUrl: card.imageUrl,
          nameZh: card.nameZh,
        })),
    [],
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
    setResultDialogOpen(false);
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
      setResultDialogOpen(true);

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
  const pageBackgroundSrc =
    phase === "reading" || phase === "done"
      ? "/visuals/reading-result-background-clean.jpg"
      : cardsRevealed
        ? "/visuals/ritual-table-after-shuffle-background-clean.jpg"
        : "/visuals/draw-shuffle-background-clean.jpg";

  return (
    <div className="relative isolate space-y-10">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
      >
        <Image
          src={pageBackgroundSrc}
          alt=""
          fill
          sizes="100vw"
          priority
          className="scale-[1.01] object-cover opacity-[0.62] blur-[0.5px]"
        />
        <div className="absolute inset-0 bg-[rgba(251,240,200,0.28)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(251,240,200,0.06)_0%,rgba(251,240,200,0.30)_60%,rgba(251,240,200,0.55)_100%)]" />
      </div>

      <MobileStickyDeck
        visible={cardsRevealed && stickyDeckVisible}
        spread={spread}
        cards={resolvedCards}
      />

      <StreamingInterpretation
        open={resultDialogOpen || phase === "reading"}
        onClose={() => setResultDialogOpen(false)}
        text={interpretation}
        isStreaming={phase === "reading"}
        sharePath={sharePath}
        adaptiveAnswers={adaptiveAnswers}
        spreadName={spread.nameZh}
        question={question}
        cards={resolvedCards.map(({ card, reversed, positionOrder }) => ({
          card,
          reversed,
          positionOrder,
          positionName: spread.positions.find((position) => position.order === positionOrder)?.name,
        }))}
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
        <div ref={ritualRef} className="min-h-[calc(100vh-9rem)] scroll-mt-24">
          <RitualShell phase={phase}>
            <InteractiveDeck
              phase={phaseToDeckPhase[phase]}
              cardCount={spread.cardCount}
              selectMode={selectMode}
              shufflePreviewCards={shufflePreviewCards}
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
    <section className="relative border-t border-[var(--line)] pt-16">
      <div className="grid gap-16 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start xl:grid-cols-[minmax(0,1fr)_460px]">
        <div className="min-w-0 space-y-12">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <span className="w-12 h-px bg-[var(--coral)] opacity-40" />
              <p className="eyebrow !tracking-[0.3em]">THE STAGE IS SET</p>
            </div>
            <div>
              <h2 className="font-serif-display text-[clamp(2.5rem,5vw,4.2rem)] leading-[1.05] text-[var(--ink)] tracking-tight">
                将问题赋予<br />
                <span className="italic text-[var(--coral-deep)]">这张桌面</span>
              </h2>
              <div className="mt-8 max-w-2xl space-y-4">
                <p className="text-[16.5px] leading-relaxed text-[var(--ink-soft)]">
                  无需复杂的生辰或资料。塔罗占卜更像是一场潜意识的镜像。
                </p>
                <p className="text-[15px] leading-relaxed text-[var(--ink-muted)]">
                  深呼吸，在心中明确你当下的困惑或期待。看一眼右侧的牌阵结构，把那句最核心的提问留下来，然后开始洗牌。
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-[var(--surface-raised)]/30 rounded-[24px] -z-10 blur-xl" />
            <SpreadPreview spread={spread} />
          </div>
        </div>

        <div className="relative min-w-0 lg:pt-8">
          <div className="sticky top-24 space-y-10">
            <Panel className="border-[var(--line-strong)] bg-[var(--surface-tint)]/80 backdrop-blur-sm shadow-xl">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="eyebrow !text-[10px]">YOUR INQUIRY · 提问</p>
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--ink-faint)]">
                      {questionLength} / 280
                    </span>
                  </div>
                  <label className="block group">
                    <textarea
                      value={question}
                      onChange={(event) => onQuestionChange(event.target.value.slice(0, 280))}
                      rows={6}
                      placeholder="例如：这段关系接下来最需要看清什么？"
                      className="w-full resize-none rounded-xl border border-[var(--line-strong)] bg-[var(--surface)]/50 px-5 py-6 font-serif-display text-[22px] leading-[1.6] text-[var(--ink)] outline-none transition-all placeholder:text-[rgba(74,59,50,0.25)] focus:border-[var(--coral)] focus:bg-[var(--surface)] focus:shadow-[0_0_0_4px_var(--coral-wash)]"
                    />
                  </label>
                </div>

                <div className="space-y-6 pt-2">
                  <IntentRibbon
                    label="关注领域"
                    value={readingIntent.domain}
                    options={domainOptions}
                    onChange={(value) => onIntentChange({ domain: value as ReadingDomain })}
                  />
                  <IntentRibbon
                    label="解读倾向"
                    value={readingIntent.goal}
                    options={goalOptions}
                    onChange={(value) => onIntentChange({ goal: value as ReadingGoal })}
                  />
                </div>

                <div className="pt-6 border-t border-[var(--line)]">
                  <Button 
                    onClick={onStart} 
                    className="w-full py-7 text-[16px] font-medium tracking-wide shadow-lg hover:shadow-xl transition-all"
                  >
                    开始洗牌 · START RITUAL
                  </Button>
                  <p className="mt-4 text-center text-[12.5px] leading-relaxed text-[var(--ink-muted)]">
                    即便留空，我也会为这副牌阵注入最契合的通用意图。
                  </p>
                </div>
              </div>
            </Panel>
            
            {/* Quick tips */}
            <div className="px-4 py-2 flex items-center gap-3 text-[12px] text-[var(--ink-faint)] italic">
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--coral)] opacity-30" />
              <p>提问越具体，牌阵的能量指向越明确。</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SpreadPreview({ spread }: { spread: SpreadDefinition }) {
  const preset = layoutPresets[spread.slug] ?? createFallbackPreviewPreset(spread.cardCount);
  const compactCards = spread.cardCount >= 7;
  const namedPositions = spread.positions.slice(0, Math.min(spread.positions.length, 6));

  return (
    <div className="relative">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-serif-display text-[26px] leading-tight text-[var(--ink)]">
            {spread.nameZh}
          </p>
          <p className="mt-1 text-[13.5px] leading-6 text-[var(--ink-muted)]">
            {spread.hero}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "relative mx-auto w-full overflow-visible",
          preset.aspectRatio,
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            maskImage:
              "radial-gradient(ellipse at center, black 0%, rgba(0,0,0,0.72) 52%, rgba(0,0,0,0.20) 76%, transparent 92%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 0%, rgba(0,0,0,0.72) 52%, rgba(0,0,0,0.20) 76%, transparent 92%)",
          }}
        >
          <Image
            src="/spreads/astrology-chart-background-v2.png"
            alt=""
            fill
            sizes="(max-width: 1024px) 92vw, 760px"
            className="object-cover opacity-[0.18] mix-blend-multiply"
            aria-hidden
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(253,248,225,0.12)_0%,transparent_62%,rgba(253,248,225,0.24)_100%)]" />

        {spread.positions.map((position, index) => {
          const layoutPos = preset.positions[position.order];
          if (!layoutPos) return null;
          const previewPos = clampPreviewPosition(layoutPos);

          return (
            <div
              key={position.order}
              className={cn(
                "group absolute aspect-[2/3.5] -translate-x-1/2 -translate-y-1/2",
                preset.cardWidth,
              )}
              style={{
                left: `${previewPos.x}%`,
                top: `${previewPos.y}%`,
                transform: `translate(-50%, -50%) rotate(${layoutPos.rotate ?? 0}deg)`,
                zIndex: 10 + index,
              }}
            >
              <div className="relative h-full w-full">
                <div
                  aria-hidden
                  className="absolute -inset-2 rounded-[14px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(closest-side, rgba(200,90,60,0.20), transparent)",
                  }}
                />
                <CardBack
                  compact={compactCards}
                  className="rounded-[9px] shadow-[0_10px_24px_rgba(74,59,50,0.12),0_2px_6px_rgba(74,59,50,0.08)]"
                />
                <span className="absolute -top-3 -left-3 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--coral-edge)] bg-[var(--surface-tint)] font-mono text-[10px] text-[var(--coral-deep)] shadow-[0_2px_8px_rgba(74,59,50,0.08)]">
                  {position.order}
                </span>
                {!compactCards ? (
                  <span className="absolute left-1/2 top-[calc(100%+6px)] max-w-[120px] -translate-x-1/2 whitespace-nowrap rounded-full border border-[rgba(74,59,50,0.14)] bg-[rgba(253,248,225,0.86)] px-2 py-0.5 text-center text-[11px] leading-4 text-[var(--ink-soft)] shadow-[0_2px_8px_rgba(74,59,50,0.05)]">
                    {position.name}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {namedPositions.map((position) => (
          <div
            key={position.order}
            className="border-t border-[var(--line)] pt-2"
          >
            <p className="flex items-center gap-2 text-[13px] font-medium text-[var(--ink)]">
              <span className="font-mono text-[10px] text-[var(--coral-deep)]">
                {position.order}
              </span>
              {position.name}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[12px] leading-5 text-[var(--ink-muted)]">
              {position.focus}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function IntentRibbon({
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
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
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
                "rounded-full border px-3 py-1.5 text-[12.5px] transition-all",
                active
                  ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]"
                  : "border-[rgba(74,59,50,0.20)] bg-transparent text-[var(--ink-soft)] hover:border-[var(--coral-edge)] hover:text-[var(--coral-deep)]",
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

function clampPreviewPosition(position: { x: number; y: number; rotate?: number }) {
  return {
    x: Math.max(10, Math.min(90, position.x)),
    y: Math.max(14, Math.min(86, position.y)),
  };
}

function createFallbackPreviewPreset(cardCount: number): LayoutPreset {
  const columns = Math.min(Math.max(cardCount, 1), 4);
  const rows = Math.ceil(cardCount / columns);
  const positions: LayoutPreset["positions"] = {};

  Array.from({ length: cardCount }).forEach((_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const rowCount = row === rows - 1 ? cardCount - row * columns : columns;
    const xStep = 100 / (rowCount + 1);
    const yStep = 100 / (rows + 1);

    positions[index + 1] = {
      x: xStep * (column + 1),
      y: yStep * (row + 1),
    };
  });

  return {
    aspectRatio: cardCount <= 3 ? "aspect-[2/1]" : "aspect-[16/10]",
    cardWidth: cardCount >= 7 ? "w-[10%]" : cardCount >= 4 ? "w-[12%]" : "w-[15%]",
    positions,
  };
}

/* ============================================================
   Ritual shell — calm cream stage, enhanced with decorative borders
   ============================================================ */

function RitualShell({ children, phase }: { children: React.ReactNode; phase: FlowPhase }) {
  const phaseTitle = phaseLabel[phase];

  return (
    <div className="relative group">
      {/* Decorative corners */}
      <div className="absolute -inset-2 pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[var(--coral)] rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[var(--coral)] rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[var(--coral)] rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[var(--coral)] rounded-br-lg" />
      </div>

      <Panel className="overflow-hidden border-[rgba(74,59,50,0.18)] bg-[rgba(253,248,225,0.82)] p-0 shadow-[0_20px_50px_rgba(74,59,50,0.12),inset_0_0_80px_rgba(253,248,225,0.4)] backdrop-blur-[4px]">
        {/* Subtle texture overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-multiply" 
             style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-mathematics.png")' }} />
        
        <div className="relative min-h-[460px] p-6 lg:p-10">
          <div className="mb-8 flex items-center justify-between gap-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-px bg-gradient-to-r from-transparent to-[var(--line-strong)]" />
              <p className="font-mono text-[10.5px] uppercase tracking-[0.25em] text-[var(--ink-muted)]">
                仪式桌面 · RITUAL STAGE
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="h-px w-12 bg-[var(--line)]" />
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--coral-deep)] font-bold">
                {phaseTitle}
              </p>
              <span className="h-px w-6 bg-[var(--line)]" />
            </div>
          </div>
          
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </Panel>
    </div>
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
