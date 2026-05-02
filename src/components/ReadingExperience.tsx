"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { CardBack } from "@/components/DeckShuffle";
import { InteractiveDeck, type RitualPhase, type SelectMode } from "@/components/InteractiveDeck";
import { MobileStickyDeck } from "@/components/MobileStickyDeck";
import { SpreadLayout } from "@/components/SpreadLayout";
import { StreamingInterpretation } from "@/components/StreamingInterpretation";
import { Button } from "@/components/ui/button";
import { addLocalReading } from "@/lib/readings/local-history";
import {
  getDefaultIntentForSpread,
  getDefaultQuestionForIntent,
} from "@/lib/tarot/default-reading";
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

type ReturnDialogSnapshot = {
  spreadSlug: string;
  question: string;
  readingIntent: ReadingIntent;
  cards: DrawnCard[];
  drawLog: DrawLog | null;
  interpretation: string;
  sharePath: string | null;
};

const returnDialogStorageKey = "arcana-flow:return-result-dialog";
const recentQuestionStorageKey = "arcana-flow:recent-question-rituals";
const repeatQuestionWindowMs = 24 * 60 * 60 * 1000;

type RecentQuestionRitual = {
  spreadSlug: string;
  questionKey: string;
  createdAt: number;
};

const phaseLabelFull: Record<FlowPhase, string> = {
  idle: "01 · 提问",
  shuffling: "02 · 洗牌",
  cutting: "03 · 切牌",
  selecting: "04 · 选牌",
  revealing: "05 · 翻牌",
  revealed: "06 · 准备解读",
  reading: "07 · 解读",
  done: "08 · 完成",
};

const phaseLabelSingle: Record<FlowPhase, string> = {
  idle: "01 · 提问",
  shuffling: "02 · 洗牌",
  cutting: "02 · 洗牌",
  selecting: "03 · 抽牌",
  revealing: "04 · 翻牌",
  revealed: "05 · 准备解读",
  reading: "06 · 解读",
  done: "07 · 完成",
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

function getConfiguredReversedRate() {
  const rawValue = process.env.NEXT_PUBLIC_TAROT_REVERSED_RATE;
  if (!rawValue) return DEFAULT_REVERSED_RATE;

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1
    ? parsed
    : DEFAULT_REVERSED_RATE;
}

function normalizeQuestionKey(question: string) {
  return question.trim().replace(/\s+/g, " ").toLowerCase();
}

function readRecentQuestionRituals(now = Date.now()): RecentQuestionRitual[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(recentQuestionStorageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is RecentQuestionRitual => {
      if (!item || typeof item !== "object") return false;
      const record = item as Record<string, unknown>;
      return (
        typeof record.spreadSlug === "string" &&
        typeof record.questionKey === "string" &&
        typeof record.createdAt === "number" &&
        now - record.createdAt < repeatQuestionWindowMs
      );
    });
  } catch {
    return [];
  }
}

function writeRecentQuestionRituals(entries: RecentQuestionRitual[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(recentQuestionStorageKey, JSON.stringify(entries.slice(0, 80)));
  } catch {
    // 隐私模式或配额失败时，不阻断主流程。
  }
}

function getRecentQuestionMatch(spreadSlug: string, question: string) {
  const now = Date.now();
  const questionKey = normalizeQuestionKey(question);
  const entries = readRecentQuestionRituals(now);
  writeRecentQuestionRituals(entries);

  return entries.find(
    (entry) => entry.spreadSlug === spreadSlug && entry.questionKey === questionKey,
  );
}

function rememberQuestionRitual(spreadSlug: string, question: string) {
  const now = Date.now();
  const questionKey = normalizeQuestionKey(question);
  const entries = readRecentQuestionRituals(now).filter(
    (entry) => !(entry.spreadSlug === spreadSlug && entry.questionKey === questionKey),
  );

  writeRecentQuestionRituals([{ spreadSlug, questionKey, createdAt: now }, ...entries]);
}

function defaultModeFor(spread: SpreadDefinition): SelectMode {
  if (spread.cardCount <= 1) return "focus";
  if (spread.cardCount === 3) return "fan";
  return "piles";
}

export function ReadingExperience({ spread }: ReadingExperienceProps) {
  const [question, setQuestion] = useState("");
  const [readingIntent, setReadingIntent] = useState<ReadingIntent>(() =>
    getDefaultIntentForSpread(spread.slug),
  );
  const [phase, setPhase] = useState<FlowPhase>("idle");
  const [selectMode, setSelectMode] = useState<SelectMode>(() => defaultModeFor(spread));
  const [includeReversals, setIncludeReversals] = useState(true);
  const [shuffled, setShuffled] = useState<ShuffledDeck | null>(null);
  const [cutPosition, setCutPosition] = useState<number | null>(null);
  const [cards, setCards] = useState<DrawnCard[]>([]);
  const [drawLog, setDrawLog] = useState<DrawLog | null>(null);
  const [interpretation, setInterpretation] = useState("");
  const [sharePath, setSharePath] = useState<string | null>(null);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stickyDeckVisible, setStickyDeckVisible] = useState(false);
  const [postRevealContentVisible, setPostRevealContentVisible] = useState(false);
  const ritualRef = useRef<HTMLDivElement | null>(null);
  const mainSpreadRef = useRef<HTMLDivElement | null>(null);
  const revealPauseTimeoutRef = useRef<number | null>(null);
  const interpretAbortControllerRef = useRef<AbortController | null>(null);

  const isSingleCard = spread.cardCount <= 1;
  const phaseLabel = isSingleCard ? phaseLabelSingle : phaseLabelFull;

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
    const reversedCount = resolvedCards.filter((item) => item.reversed).length;

    return {
      oneLine: lead
        ? `${leadPosition?.name ?? "核心牌位"}的「${lead.card.nameZh}」先把问题落在“${themes[0] ?? lead.card.nameZh}”上。`
        : "牌面已经展开，可以直接进入解读。",
      tone:
        reversedCount > resolvedCards.length / 2
          ? "这组牌先把阻滞、犹豫或尚未承认的部分推到台前。"
          : "这组牌的第一层信息偏向流动、显化与可执行的下一步。",
      themes,
    };
  }, [cardsRevealed, resolvedCards, spread.positions]);

  useEffect(() => {
    const rawSnapshot = window.sessionStorage.getItem(returnDialogStorageKey);
    if (!rawSnapshot) return;

    try {
      const snapshot = JSON.parse(rawSnapshot) as Partial<ReturnDialogSnapshot>;
      window.sessionStorage.removeItem(returnDialogStorageKey);

      if (
        snapshot.spreadSlug !== spread.slug ||
        !Array.isArray(snapshot.cards) ||
        typeof snapshot.interpretation !== "string"
      ) {
        return;
      }

      const frameId = window.requestAnimationFrame(() => {
        setQuestion(typeof snapshot.question === "string" ? snapshot.question : "");
        if (snapshot.readingIntent) setReadingIntent(snapshot.readingIntent);
        setCards(snapshot.cards ?? []);
        setDrawLog(snapshot.drawLog ?? null);
        setInterpretation(snapshot.interpretation ?? "");
        setSharePath(snapshot.sharePath ?? null);
        setPhase("done");
        setPostRevealContentVisible(true);
        setResultDialogOpen(true);
      });

      return () => window.cancelAnimationFrame(frameId);
    } catch {
      window.sessionStorage.removeItem(returnDialogStorageKey);
    }
  }, [spread.slug]);

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

  useEffect(() => {
    return () => {
      if (revealPauseTimeoutRef.current !== null) {
        window.clearTimeout(revealPauseTimeoutRef.current);
      }
      if (interpretAbortControllerRef.current) {
        interpretAbortControllerRef.current.abort();
      }
    };
  }, []);

  function updateIntent(nextIntent: Partial<ReadingIntent>) {
    setReadingIntent((current) => ({ ...current, ...nextIntent }));
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
    setDrawLog(null);
    setCards([]);
    setCutPosition(null);
    setStickyDeckVisible(false);
    setPostRevealContentVisible(false);
    if (revealPauseTimeoutRef.current !== null) {
      window.clearTimeout(revealPauseTimeoutRef.current);
      revealPauseTimeoutRef.current = null;
    }
    if (interpretAbortControllerRef.current) {
      interpretAbortControllerRef.current.abort();
      interpretAbortControllerRef.current = null;
    }
  }

  function handleStartShuffle() {
    resetReadingState();
    const finalQuestion = resolveQuestion();
    const recentMatch = getRecentQuestionMatch(spread.slug, finalQuestion);

    if (recentMatch) {
      const availableAt = new Date(recentMatch.createdAt + repeatQuestionWindowMs);
      setPhase("idle");
      setError(
        `这件事牌已经回答过了。请给它一点时间沉淀，${availableAt.toLocaleString("zh-CN", {
          month: "numeric",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })} 之后再重新问会更清晰。`,
      );
      return;
    }

    rememberQuestionRitual(spread.slug, finalQuestion);

    const reversedRate = includeReversals ? getConfiguredReversedRate() : 0;
    const newDeck = shuffleDeck({ reversedRate });
    setShuffled(newDeck);
    setPhase("shuffling");

    requestAnimationFrame(() => {
      ritualRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function handleShuffleAnimationDone() {
    if (isSingleCard) {
      setPhase("selecting");
      return;
    }
    setPhase("cutting");
  }

  function handleCutDone(cutPosition: number) {
    if (!shuffled) return;
    const cutDeck = applyCut(shuffled, cutPosition);
    setShuffled(cutDeck);
    setCutPosition(cutPosition);
    setPhase("selecting");
  }

  function handleSelectionDone(indices: number[]) {
    if (!shuffled) return;

    resolveQuestion();
    const drawn = drawFromIndices(shuffled, indices);
    setCards(drawn);
    setDrawLog({
      seed: shuffled.seed,
      drawRule: `${DEFAULT_DRAW_RULE}::${selectMode}::orientation_settle`,
      reversedRate: shuffled.reversedRate,
      createdAt: new Date().toISOString(),
    });
    setPhase("revealing");
    setPostRevealContentVisible(false);
    if (revealPauseTimeoutRef.current !== null) {
      window.clearTimeout(revealPauseTimeoutRef.current);
    }
    revealPauseTimeoutRef.current = window.setTimeout(() => {
      revealPauseTimeoutRef.current = null;
      setPostRevealContentVisible(true);
      setPhase("revealed");
    }, 1200);
  }

  function handleReshuffle() {
    setPhase("idle");
    setShuffled(null);
    resetReadingState();
  }

  async function handleInterpret() {
    const controller = new AbortController();
    interpretAbortControllerRef.current = controller;

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
        signal: controller.signal,
        body: JSON.stringify({
          question: finalQuestion,
          spreadSlug: spread.slug,
          cards,
          drawLog,
          readingIntent,
          locale: "zh-CN",
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("牌面暂时没有回应，请稍后再试。");
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

      if (controller.signal.aborted) return;

      const saveResponse = await fetch("/api/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          question: finalQuestion,
          spreadSlug: spread.slug,
          cards,
          drawLog,
          readingIntent,
          aiInterpretation: fullText,
          model,
        }),
      });

      if (saveResponse.ok && !controller.signal.aborted) {
        const payload = (await saveResponse.json()) as { sharePath?: string };
        if (payload.sharePath) {
          setSharePath(payload.sharePath);
          const tokenMatch = payload.sharePath.match(/\/r\/([^/?#]+)/);
          const shareToken = tokenMatch ? tokenMatch[1] : null;
          if (shareToken) {
            const domainLabel = domainOptions.find(
              (option) => option.value === readingIntent.domain,
            )?.label;
            const goalLabel = goalOptions.find(
              (option) => option.value === readingIntent.goal,
            )?.label;
            const intentLabel =
              domainLabel && goalLabel ? `${domainLabel} · ${goalLabel}` : null;
            addLocalReading({
              shareToken,
              spreadSlug: spread.slug,
              spreadName: spread.nameZh,
              question: finalQuestion,
              cardCount: cards.length,
              reversedCount: cards.filter((card) => card.reversed).length,
              intentLabel,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }

      setPhase("done");
    } catch (caughtError) {
      if (caughtError instanceof Error && caughtError.name === "AbortError") {
        console.log("Interpretation aborted by user.");
        return;
      }
      const message = caughtError instanceof Error ? caughtError.message : "这次解读没有顺利展开。";
      setError(message);
      setPhase("revealed");
    } finally {
      if (interpretAbortControllerRef.current === controller) {
        interpretAbortControllerRef.current = null;
      }
    }
  }

  function preserveResultDialogForBackNavigation() {
    if (!interpretation.trim()) return;

    const snapshot: ReturnDialogSnapshot = {
      spreadSlug: spread.slug,
      question,
      readingIntent,
      cards,
      drawLog,
      interpretation,
      sharePath,
    };

    window.sessionStorage.setItem(returnDialogStorageKey, JSON.stringify(snapshot));
  }

  const interactionBusy =
    phase === "shuffling" ||
    phase === "cutting" ||
    phase === "selecting" ||
    phase === "reading";
  const showRitualOnly = phase === "shuffling" || phase === "cutting" || phase === "selecting";

  return (
    <div className="relative isolate space-y-10">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
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

      <MobileStickyDeck
        visible={cardsRevealed && stickyDeckVisible}
        spread={spread}
        cards={resolvedCards}
      />

      <StreamingInterpretation
        open={resultDialogOpen || phase === "reading"}
        onClose={() => {
          setResultDialogOpen(false);
          if (phase === "reading") {
            if (interpretAbortControllerRef.current) {
              interpretAbortControllerRef.current.abort();
            }
            setPhase("revealed");
          }
        }}
        text={interpretation}
        isStreaming={phase === "reading"}
        sharePath={sharePath}
        spreadName={spread.nameZh}
        question={question}
        readingIntent={readingIntent}
        onShareNavigate={preserveResultDialogForBackNavigation}
        cards={resolvedCards.map(({ card, reversed, positionOrder }) => ({
          card,
          reversed,
          positionOrder,
          positionName: spread.positions.find((position) => position.order === positionOrder)?.name,
        }))}
      />

      <header className="space-y-5 border-b border-[var(--line)] pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="eyebrow">{spread.hero}</p>
          <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            <span
              className={cn(
                "inline-block h-1.5 w-1.5 rounded-full",
                interactionBusy ? "bg-[var(--coral)] animate-shimmer" : "bg-[var(--ink-faint)]",
              )}
            />
            {phaseLabel[phase]}
          </div>
        </div>
        <h1 className="font-serif-display text-[clamp(2.4rem,4.6vw,3.8rem)] leading-[1.02] text-[var(--ink)]">
          {spread.nameZh}
          <span className="ml-3 font-light text-[var(--ink-muted)]">
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
          repeatNotice={error}
          onQuestionChange={(nextQuestion) => {
            setError(null);
            setQuestion(nextQuestion);
          }}
          onIntentChange={updateIntent}
          includeReversals={includeReversals}
          onIncludeReversalsChange={setIncludeReversals}
          onStart={handleStartShuffle}
        />
      ) : null}

      {showRitualOnly ? (
        <div ref={ritualRef} className="min-h-[calc(100vh-9rem)] scroll-mt-24">
          <RitualShell phase={phase} phaseLabel={phaseLabel}>
            <InteractiveDeck
              phase={phaseToDeckPhase[phase]}
              cardCount={spread.cardCount}
              selectMode={selectMode}
              cutPosition={cutPosition}
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
            <RitualShell phase={phase} phaseLabel={phaseLabel}>
              <SpreadLayout
                spread={spread}
                cards={resolvedCards}
                quiet={!postRevealContentVisible}
              />
              {postRevealContentVisible ? (
                <>
                  <CardOpenTip />
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
                    <Button variant="ghost" onClick={handleReshuffle} disabled={interactionBusy}>
                      重新开始
                    </Button>
                  </div>
                </>
              ) : null}
            </RitualShell>
          </div>

          <aside className="min-w-0 xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:self-start xl:overflow-y-auto xl:pr-2">
            {postRevealContentVisible ? (
              <div className="animate-fade-in relative space-y-5 before:absolute before:left-0 before:top-2 before:hidden before:h-[calc(100%-1rem)] before:w-px before:bg-[linear-gradient(180deg,var(--coral-edge),var(--line),transparent)] xl:pl-6 xl:before:block">
                {preliminaryOverview ? (
                  <PreliminaryOverview overview={preliminaryOverview} />
                ) : null}
                <DirectReadingPanel
                  onSubmit={handleInterpret}
                  busy={interactionBusy}
                  phase={phase}
                />
                {error ? (
                  <div className="rounded-[12px] border border-[var(--coral-edge)] bg-[var(--coral-wash)] px-4 py-3 text-sm leading-6 text-[var(--coral-deep)]">
                    {error}
                  </div>
                ) : null}
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
  repeatNotice,
  onQuestionChange,
  onIntentChange,
  includeReversals,
  onIncludeReversalsChange,
  onStart,
}: {
  question: string;
  questionLength: number;
  readingIntent: ReadingIntent;
  spread: SpreadDefinition;
  repeatNotice: string | null;
  onQuestionChange: (question: string) => void;
  onIntentChange: (intent: Partial<ReadingIntent>) => void;
  includeReversals: boolean;
  onIncludeReversalsChange: (includeReversals: boolean) => void;
  onStart: () => void;
}) {
  const hasQuestion = question.trim().length > 0;

  return (
    <section className="relative border-t border-[var(--line)] pt-16">
      <div className="grid gap-16 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start xl:grid-cols-[minmax(0,1fr)_460px]">
        <div className="min-w-0 space-y-12">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <span className="h-px w-12 bg-[var(--coral)] opacity-40" />
              <p className="eyebrow !tracking-[0.3em]">THE STAGE IS SET</p>
            </div>
            <div>
              <h2 className="font-serif-display text-[clamp(2.5rem,5vw,4.2rem)] leading-[1.05] tracking-tight text-[var(--ink)]">
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
            <div className="absolute -inset-4 -z-10 rounded-[24px] bg-[var(--surface-raised)]/30 blur-xl" />
            <SpreadPreview spread={spread} />
          </div>
        </div>

        <div className="relative min-w-0 lg:pt-[22rem] xl:pt-[24rem]">
          <div className="top-20 space-y-9 lg:sticky lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-2">
            <div className="relative space-y-8 px-1 py-2">
              <div className="absolute -left-5 top-1 hidden h-[calc(100%-0.5rem)] w-px bg-[linear-gradient(180deg,var(--coral-edge),var(--line),transparent)] lg:block" />
              <div className="space-y-7">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="journal-label max-w-full leading-tight">YOUR INQUIRY · 提问</p>
                      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--ink-faint)] leading-tight">
                        {questionLength} / 280
                      </span>
                    </div>
                    <div className="h-px w-full bg-[var(--line)]" />
                  </div>
                  <label className="block group">
                    <textarea
                      value={question}
                      onChange={(event) => onQuestionChange(event.target.value.slice(0, 280))}
                      rows={5}
                      placeholder="例如：这段关系接下来最需要看清什么？"
                      className="journal-hand journal-writing-area w-full resize-none border-0 bg-transparent py-2 pl-5 pr-0 text-[23px] leading-[3rem] text-[var(--ink)] outline-none transition placeholder:text-[rgba(74,59,50,0.30)] focus:text-[var(--ink)]"
                    />
                  </label>
                </div>

                <div className="space-y-5 pt-1">
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

                <div className="border-t border-[var(--line)] pt-5">
                  <label className="mb-4 flex cursor-pointer items-center justify-between gap-4 border-b border-[var(--line)] pb-4 text-[14px] text-[var(--ink-soft)]">
                    <span className="journal-hand text-[17px]">{"包含逆位"}</span>
                    <input
                      type="checkbox"
                      checked={includeReversals}
                      onChange={(event) => onIncludeReversalsChange(event.target.checked)}
                      className="h-4 w-4 accent-[var(--coral)]"
                    />
                  </label>
                  <Button
                    onClick={onStart}
                    className="journal-hand w-full !rounded-none !border-x-0 !border-y !border-[var(--line-strong)] !bg-transparent py-4 text-[22px] !font-normal !text-[var(--coral-deep)] !shadow-none transition hover:!border-[var(--coral-edge)] hover:!bg-transparent hover:!text-[var(--coral)]"
                  >
                    开始洗牌 · START RITUAL
                  </Button>
                  <p className="journal-hand mt-4 text-center text-[16px] leading-relaxed text-[var(--ink-muted)]">
                    {hasQuestion ? "洗牌前先把问题留在牌桌上。" : "留空也可以，我会使用默认问题开始洗牌。"}
                  </p>
                  {repeatNotice ? (
                    <div className="mt-4 border border-[var(--coral-edge)] bg-[var(--coral-wash)] px-4 py-3 text-[13.5px] leading-6 text-[var(--coral-deep)]">
                      {repeatNotice}
                    </div>
                  ) : null}
                  <p className="hidden">
                    即便留空，我也会为这副牌阵注入最契合的通用意图。
                  </p>
                </div>
              </div>
            </div>

            <div className="journal-hand flex items-center gap-3 px-1 py-2 text-[15px] text-[var(--ink-faint)]">
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--coral)] opacity-30" />
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
      <div className="mb-16 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-serif-display text-[28px] leading-tight text-[var(--ink)]">
            {spread.nameZh}
          </p>
          <p className="mt-1.5 text-[13.5px] leading-6 text-[var(--ink-muted)]">
            {spread.hero}
          </p>
        </div>
      </div>

      <div className={cn("relative mx-auto w-full overflow-visible", preset.aspectRatio)}>
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
                <span className="absolute -left-3 -top-3 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--coral-edge)] bg-[var(--surface-tint)] font-mono text-[10px] text-[var(--coral-deep)] shadow-[0_2px_8px_rgba(74,59,50,0.08)]">
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
          <div key={position.order} className="border-t border-[var(--line)] pt-3">
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
    <div className="space-y-2">
      <span className="journal-label block text-[var(--ink-muted)]">
        {label}
      </span>
      <div className="journal-hand flex flex-wrap gap-x-4 gap-y-1">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              type="button"
              key={option.value}
              onClick={() => onChange(option.value)}
              className={cn(
                "relative border-b py-0.5 text-[17px] leading-7 transition-all",
                active
                  ? "border-[var(--coral)] text-[var(--coral-deep)]"
                  : "border-transparent text-[var(--ink-soft)] hover:border-[var(--coral-edge)] hover:text-[var(--coral-deep)]",
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

function RitualShell({
  children,
  phase,
  phaseLabel,
}: {
  children: React.ReactNode;
  phase: FlowPhase;
  phaseLabel: Record<FlowPhase, string>;
}) {
  const phaseTitle = phaseLabel[phase];

  return (
    <section className="relative border-t border-[var(--line)] pt-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow">RITUAL STAGE · 仪式桌面</p>
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--coral-deep)]">
          {phaseTitle}
        </p>
      </div>
      <div className="relative min-h-[420px]">{children}</div>
    </section>
  );
}

function CardOpenTip() {
  return (
    <p className="journal-hand mt-6 border-t border-[var(--line)] pt-4 text-[16px] leading-7 text-[var(--ink-muted)]">
      小提示：点击某个牌面可以查看牌面描述。
    </p>
  );
}

function PreliminaryOverview({
  overview,
}: {
  overview: {
    oneLine: string;
    tone: string;
    themes: string[];
  };
}) {
  return (
    <section className="space-y-4 border-t border-[var(--line)] py-5">
      <div>
        <p className="journal-label">初步概览</p>
        <h2 className="journal-hand mt-1.5 text-[28px] leading-tight text-[var(--ink)]">
          先给你一句牌面提示
        </h2>
      </div>

      <p className="journal-hand text-[23px] leading-[1.55] text-[var(--ink)]">
        {overview.oneLine}
      </p>
      <p className="journal-hand text-[17px] leading-7 text-[var(--ink-soft)]">{overview.tone}</p>

      {overview.themes.length > 0 ? (
        <div className="journal-hand flex flex-wrap gap-x-4 gap-y-1 text-[16px] text-[var(--coral-deep)]">
          {overview.themes.map((theme) => (
            <span
              key={theme}
              className="border-b border-[var(--coral-edge)] leading-6"
            >
              {theme}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function DirectReadingPanel({
  onSubmit,
  busy,
  phase,
}: {
  onSubmit: () => void;
  busy: boolean;
  phase: FlowPhase;
}) {
  return (
    <section className="space-y-5 border-t border-[var(--line)] py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[520px]">
          <p className="journal-label">牌面解读</p>
          <h2 className="journal-hand mt-1.5 text-[31px] leading-tight text-[var(--ink)]">
            牌面已经展开
          </h2>
          <p className="journal-hand mt-2 text-[17px] leading-7 text-[var(--ink-muted)]">
            接下来会基于你的问题、牌阵位置和这次抽出的牌面展开完整读牌。
          </p>
        </div>
        <Button onClick={onSubmit} disabled={busy || phase === "reading"} className="journal-hand shrink-0 !rounded-none !border-x-0 !border-y !border-[var(--line-strong)] !bg-transparent px-5 py-2 text-[19px] !font-normal !text-[var(--coral-deep)] !shadow-none hover:!border-[var(--coral-edge)] hover:!bg-transparent hover:!text-[var(--coral)]">
          {phase === "reading" ? "读牌中..." : "看解读"}
        </Button>
      </div>
      <p className="journal-hand border-t border-[var(--line)] pt-4 text-[15.5px] leading-7 text-[var(--ink-soft)]">
        需要更有针对性的追问与临场判断时，可以把这次牌面记录留给后续的真人占卜预约。
      </p>
    </section>
  );
}
