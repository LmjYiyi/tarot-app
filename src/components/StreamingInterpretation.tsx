"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { AnnotatedInterpretation } from "@/components/AnnotatedInterpretation";
import { Button } from "@/components/ui/button";
import { cleanInterpretationMarkdown } from "@/lib/interpretation/display";
import { cn } from "@/lib/utils";
import type { AdaptiveAnswer, ReadingIntent, TarotCard } from "@/lib/tarot/types";

type ResultCard = {
  card: TarotCard;
  reversed: boolean;
  positionOrder: number;
  positionName?: string;
};

type StreamingInterpretationProps = {
  open: boolean;
  onClose: () => void;
  text: string;
  isStreaming: boolean;
  cardPreviewText?: string;
  isCardPreviewStreaming?: boolean;
  sharePath?: string | null;
  adaptiveAnswers?: AdaptiveAnswer[];
  spreadName: string;
  question: string;
  cards: ResultCard[];
  readingIntent?: ReadingIntent;
  onShareNavigate?: () => void;
};

export function StreamingInterpretation({
  open,
  onClose,
  text,
  isStreaming,
  cardPreviewText = "",
  isCardPreviewStreaming = false,
  sharePath,
  adaptiveAnswers,
  spreadName,
  question,
  cards,
  readingIntent,
  onShareNavigate,
}: StreamingInterpretationProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expandedCard, setExpandedCard] = useState<ResultCard | null>(null);
  const hasContent = Boolean(text.trim());
  const progress = isStreaming ? Math.min(94, 18 + Math.floor(text.length / 42)) : 100;
  const singleCard = cards.length === 1;
  const showQuestion = question.trim().length > 0;
  const isDailySingleReading = singleCard && !showQuestion;
  const showRetrievedCardPreview =
    isDailySingleReading && (isCardPreviewStreaming || Boolean(cardPreviewText.trim()));
  const showCardMeaningPreview = isStreaming && cards.length > 0 && !isDailySingleReading;

  const shareUrl = useMemo(() => {
    if (!sharePath) return null;
    if (typeof window === "undefined") return sharePath;
    return new URL(sharePath, window.location.origin).toString();
  }, [sharePath]);
  const displayText = useMemo(() => cleanInterpretationMarkdown(text), [text]);
  const previewKey = useMemo(
    () =>
      [
        readingIntent?.domain,
        readingIntent?.goal,
        question,
        ...cards.map(({ card, reversed, positionOrder }) =>
          `${card.id}:${positionOrder}:${reversed ? "r" : "u"}`,
        ),
      ].join("|"),
    [cards, question, readingIntent],
  );

  const plainText = useMemo(
    () =>
      buildPlainText({
        spreadName,
        question,
        cards,
        cardPreviewText,
        text: displayText,
        shareUrl,
      }),
    [cardPreviewText, cards, displayText, question, shareUrl, spreadName],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const timeoutId = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  if (!open || !mounted) return null;

  async function handleCopy() {
    try {
      await copyText(plainText);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Reading result"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(32,24,18,0.45)] px-3 py-3 backdrop-blur-sm sm:px-4 sm:py-5"
    >
      <div className="relative flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-[24px] border border-[var(--coral-edge)] bg-[rgba(251,240,200,0.96)] shadow-[0_30px_110px_rgba(74,59,50,0.32)]">
        <Image
          src="/visuals/reading-share-modal-background-v1.png"
          alt=""
          fill
          sizes="(max-width: 768px) 94vw, 1152px"
          className="pointer-events-none object-cover opacity-[0.40] mix-blend-multiply"
          priority
        />
        <div className="pointer-events-none absolute inset-0 bg-[rgba(251,240,200,0.42)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(253,248,225,0.44)_0%,rgba(251,240,200,0.28)_52%,rgba(200,90,60,0.18)_100%)]" />

        <header className="relative z-10 flex flex-wrap items-start justify-between gap-4 border-b border-[var(--line-strong)] px-5 py-4 sm:px-7">
          <div>
            <p className="eyebrow-ink">Reading Share · 结果解读</p>
            <h2 className="mt-1 font-serif-display text-[clamp(1.8rem,4vw,3rem)] leading-tight text-[var(--ink)]">
              {spreadName}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {sharePath && !isStreaming ? (
              <Link
                href={sharePath}
                onClick={onShareNavigate}
                className="rounded-[10px] border border-[var(--line-strong)] px-4 py-2 text-[13px] text-[var(--ink-soft)] transition hover:bg-[var(--surface-raised)] hover:text-[var(--ink)]"
              >
                打开分享页
              </Link>
            ) : null}
            <Button variant="secondary" onClick={handleCopy} disabled={!hasContent || isStreaming}>
              {copied ? "已复制文字" : "复制文字"}
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-[10px] text-[22px] leading-none text-[var(--ink-soft)] transition hover:bg-[var(--surface-raised)] hover:text-[var(--ink)]"
              aria-label="关闭"
            >
              ×
            </button>
          </div>
        </header>

        {isStreaming ? (
          <div className="relative z-10 border-b border-[var(--line)] px-5 py-4 sm:px-7">
            <div className="mb-2 flex items-center justify-between gap-4">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                正在生成结果解读
              </p>
              <span className="font-mono text-[10.5px] tracking-[0.16em] text-[var(--coral-deep)]">
                {progress}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--line)]">
              <div
                className="h-full rounded-full bg-[var(--coral)] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : null}

        <div className="relative z-10 min-h-0 overflow-y-auto px-5 py-6 sm:px-7">
          <div className="grid gap-7 xl:grid-cols-[400px_minmax(0,1fr)]">
            <aside className="space-y-8 xl:sticky xl:top-0 xl:max-h-[calc(96vh-11.5rem)] xl:self-start xl:overflow-y-auto xl:pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {showQuestion ? (
                <section className="border-t border-[var(--line)] pt-5">
                  <p className="eyebrow-ink">你的问题</p>
                  <p className="mt-2 font-fraunces text-[19px] italic leading-8 text-[var(--ink-soft)]">
                    “{question}”
                  </p>
                </section>
              ) : null}

              <section className="border-t border-[var(--line)] pt-5">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <p className="eyebrow-ink">抽到的牌</p>
                  <span className="text-[12px] text-[var(--ink-muted)]">{cards.length} 张</span>
                </div>
                <div className={singleCard ? "flex justify-center" : "grid grid-cols-2 gap-3"}>
                  {cards.map(({ card, reversed, positionOrder, positionName }) => (
                    <button
                      type="button"
                      key={`${card.id}-${positionOrder}`}
                      onClick={() => setExpandedCard({ card, reversed, positionOrder, positionName })}
                      className={cn(
                        "group p-1 outline-none",
                        singleCard
                          ? "flex w-full max-w-[250px] flex-col items-center gap-4 text-center"
                          : "flex min-w-0 flex-col items-center gap-2.5 text-center",
                      )}
                    >
                      <div
                        className={cn(
                          "relative aspect-[300/524] overflow-hidden rounded-[10px] border border-[var(--coral-edge)] bg-[var(--surface-tint)] shadow-[0_8px_20px_rgba(74,59,50,0.14)] transition group-hover:-translate-y-0.5 group-hover:shadow-[0_14px_28px_rgba(74,59,50,0.20)] group-focus-visible:ring-2 group-focus-visible:ring-[var(--coral)]",
                          singleCard ? "w-[132px] max-w-full" : "w-full max-w-[116px]",
                        )}
                      >
                        {card.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={card.imageUrl}
                            alt={card.nameZh}
                            className={`h-full w-full object-cover ${reversed ? "rotate-180" : ""}`}
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 self-center">
                        <p className="truncate text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]" title={positionName ?? `牌位 ${positionOrder}`}>
                          {positionName ?? `牌位 ${positionOrder}`}
                        </p>
                        <p className={cn(
                          "mt-1 font-serif-display leading-tight text-[var(--ink)]",
                          singleCard ? "text-[20px]" : "text-[18px]",
                        )}>
                          {card.nameZh}
                        </p>
                        <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">
                          {reversed ? "逆位" : "正位"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-center text-[12px] leading-5 text-[var(--ink-muted)]">
                  点击牌面查看这张牌的细节。
                </p>
              </section>
            </aside>

            <article className="space-y-8 border-t border-[var(--line)] px-1 pt-6 sm:px-3">
              {showRetrievedCardPreview ? (
                <RetrievedCardPreview
                  text={cardPreviewText}
                  isStreaming={isCardPreviewStreaming}
                />
              ) : null}

              {showCardMeaningPreview ? (
                <CardMeaningPreview
                  key={previewKey}
                  cards={cards}
                  question={question}
                  readingIntent={readingIntent}
                />
              ) : null}

              {hasContent ? (
                <section>
                  <div className="mb-6">
                    <p className="eyebrow-ink">完整解读</p>
                    <h3 className="mt-2 font-serif-display text-[clamp(1.9rem,3vw,2.8rem)] leading-tight text-[var(--ink)]">
                      这副牌想说的话
                    </h3>
                  </div>
                  <AnnotatedInterpretation
                    text={displayText}
                    isStreaming={isStreaming}
                    adaptiveAnswers={adaptiveAnswers}
                  />
                  {shareUrl ? (
                    <div className="mt-6 rounded-[12px] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-[13px] leading-6 text-[var(--ink-muted)]">
                      分享链接：{shareUrl}
                    </div>
                  ) : null}
                </section>
              ) : (
                <WaitingForInterpretation />
              )}
            </article>
          </div>
        </div>

        {expandedCard ? (
          <CardDetailPopover card={expandedCard} onClose={() => setExpandedCard(null)} />
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

function CardDetailPopover({
  card: entry,
  onClose,
}: {
  card: ResultCard;
  onClose: () => void;
}) {
  const orientation = entry.reversed ? "逆位" : "正位";
  const keywords = entry.reversed ? entry.card.keywordsReversed : entry.card.keywordsUpright;
  const meaning = entry.reversed ? entry.card.meaningReversed : entry.card.meaningUpright;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[rgba(32,24,18,0.22)] px-4 py-5 backdrop-blur-[2px]">
      <div className="relative flex max-h-[88%] w-full max-w-3xl flex-col overflow-hidden rounded-[18px] border border-[var(--coral-edge)] bg-[rgba(253,248,225,0.98)] shadow-[0_26px_80px_rgba(74,59,50,0.34)]">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
          <div>
            <p className="eyebrow-ink">{entry.positionName ?? `牌位 ${entry.positionOrder}`}</p>
            <h3 className="mt-1 font-serif-display text-[clamp(1.7rem,4vw,2.6rem)] leading-tight text-[var(--ink)]">
              {entry.card.nameZh}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] text-[22px] leading-none text-[var(--ink-soft)] transition hover:bg-[var(--surface-raised)] hover:text-[var(--ink)]"
            aria-label="关闭牌面详情"
          >
            ×
          </button>
        </div>
        <div className="grid min-h-0 gap-5 overflow-y-auto px-5 py-5 md:grid-cols-[220px_minmax(0,1fr)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="mx-auto w-[180px] md:w-full">
            <div className="relative aspect-[300/524] overflow-hidden rounded-[12px] border border-[var(--coral-edge)] bg-[var(--surface-tint)] shadow-[0_12px_30px_rgba(74,59,50,0.18)]">
              {entry.card.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={entry.card.imageUrl}
                  alt={entry.card.nameZh}
                  className={`h-full w-full object-cover ${entry.reversed ? "rotate-180" : ""}`}
                />
              ) : null}
            </div>
          </div>
          <div className="min-w-0 space-y-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">
                {orientation}
              </p>
              <p className="mt-2 text-[14.5px] leading-7 text-[var(--ink-soft)]">
                {meaning}
              </p>
            </div>
            {keywords.length ? (
              <div className="flex flex-wrap gap-2">
                {keywords.slice(0, 6).map((keyword) => (
                  <span
                    key={keyword}
                    className="border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-[12px] text-[var(--ink-muted)]"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="border-t border-[var(--line)] pt-4 text-[13px] leading-6 text-[var(--ink-muted)]">
              这层只展开牌面本身，不会中断右侧正在展开的牌义内容。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WaitingForInterpretation() {
  return (
    <section className="border-t border-[var(--line)] pt-6">
      <p className="eyebrow-ink">完整解读</p>
      <div className="mt-4 flex items-center gap-3 text-[14px] leading-7 text-[var(--ink-muted)]">
        <span className="relative flex h-3 w-3 flex-shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--coral)] opacity-30" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--coral)]" />
        </span>
        正在把牌位、正逆位和整组结构合成最终解读。
      </div>
    </section>
  );
}

function RetrievedCardPreview({
  text,
  isStreaming,
}: {
  text: string;
  isStreaming: boolean;
}) {
  return (
    <section className="border-t border-[var(--line)] pt-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow-ink">今日单张牌义预览</p>
          <h3 className="mt-2 font-serif-display text-[clamp(1.75rem,3vw,2.35rem)] leading-tight text-[var(--ink)]">
            今日牌面先声
          </h3>
        </div>
        {isStreaming ? (
          <span className="mt-1 inline-flex items-center gap-2 rounded-full bg-[var(--coral-wash)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--coral-deep)]">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--coral)]" />
            streaming
          </span>
        ) : null}
      </div>
      <div className="max-h-[360px] overflow-y-auto whitespace-pre-wrap border-l border-[var(--coral-edge)] pl-4 text-[14.5px] leading-7 text-[var(--ink-soft)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {text.trim() ? text : "正在从今日单张牌义链路取回牌面预览。"}
      </div>
    </section>
  );
}

function CardMeaningPreview({
  cards,
  question,
  readingIntent,
}: {
  cards: ResultCard[];
  question: string;
  readingIntent?: ReadingIntent;
}) {
  const entries = useMemo(
    () => cards.map((card) => buildCardMeaningPreview(card, question, readingIntent)),
    [cards, question, readingIntent],
  );
  const totalCharacters = entries.reduce((sum, entry) => sum + entry.body.length, 0);
  const [visibleCharacters, setVisibleCharacters] = useState(0);

  useEffect(() => {
    if (totalCharacters === 0) return;

    let frameId: number | null = null;
    let timeoutId: number | null = null;
    const startedAt = performance.now();
    const charactersPerSecond = 34;

    function tick(now: number) {
      const elapsedSeconds = (now - startedAt) / 1000;
      setVisibleCharacters(Math.min(totalCharacters, Math.floor(elapsedSeconds * charactersPerSecond)));

      if (elapsedSeconds * charactersPerSecond < totalCharacters) {
        timeoutId = window.setTimeout(() => {
          frameId = window.requestAnimationFrame(tick);
        }, 28);
      }
    }

    frameId = window.requestAnimationFrame(tick);

    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [entries, totalCharacters]);

  return (
    <section className="border-t border-[var(--line)] pt-6">
      <div className="mb-6">
        <p className="eyebrow-ink">{cards.length === 1 ? "今日单张预览" : "本次牌义预览"}</p>
        <h3 className="mt-2 font-serif-display text-[clamp(1.8rem,3vw,2.5rem)] leading-tight text-[var(--ink)]">
          {cards.length === 1 ? "先看这张牌今天落下的提醒" : "先看每张牌落在这里的意思"}
        </h3>
      </div>
      <div className="space-y-5">
        {entries.map((entry, index) => {
          const consumedCharacters = entries
            .slice(0, index)
            .reduce((sum, current) => sum + current.body.length, 0);
          const visibleBodyLength = Math.max(
            0,
            Math.min(entry.body.length, visibleCharacters - consumedCharacters),
          );
          const visibleBody = entry.body.slice(0, visibleBodyLength);

          return (
            <article
              key={`${entry.title}-${index}`}
              className="relative border-l border-[var(--coral-edge)]/55 pl-5"
            >
              <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border border-[var(--coral-edge)] bg-[var(--surface-tint)]" />
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-faint)]">
                {entry.position}
              </p>
              <h4 className="mt-1 font-serif-display text-[22px] leading-tight text-[var(--ink)]">
                {entry.title}
              </h4>
              <p className="mt-2 min-h-[3.5rem] whitespace-pre-wrap text-[14.5px] leading-7 text-[var(--ink-soft)]">
                {visibleBody}
                {visibleBodyLength < entry.body.length ? (
                  <span className="ml-0.5 inline-block h-4 w-px translate-y-0.5 animate-pulse bg-[var(--coral)]" />
                ) : null}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function buildCardMeaningPreview(
  { card, reversed, positionName, positionOrder }: ResultCard,
  question: string,
  readingIntent?: ReadingIntent,
) {
  const orientation = reversed ? "逆位" : "正位";
  const baseMeaning = reversed ? card.meaningReversed : card.meaningUpright;
  const domainMeaning = getDomainMeaning(card, reversed, readingIntent);
  const keywords = (reversed ? card.keywordsReversed : card.keywordsUpright).slice(0, 3);
  const position = positionName ?? `牌位 ${positionOrder}`;
  const isDailySinglePreview = !question.trim() && positionOrder === 1;
  const body = normalizePreviewPronouns(
    [
      `在“${position}”这个位置，${card.nameZh}的${orientation}先把注意力放到${keywords.join("、") || "当前状态"}上。`,
      domainMeaning ?? baseMeaning,
      isDailySinglePreview
        ? "这一步先作为今日单张牌的检索式牌义提醒，重点是给出当下可感知、可执行的小线索。"
        : getPositionBridge(position, readingIntent),
    ]
      .filter(Boolean)
      .join(""),
    question,
    readingIntent,
  );

  return {
    position,
    title: `${card.nameZh} · ${orientation}`,
    body,
  };
}

function getDomainMeaning(card: TarotCard, reversed: boolean, readingIntent?: ReadingIntent) {
  const suffix = reversed ? "Reversed" : "Upright";

  switch (readingIntent?.domain) {
    case "love":
    case "relationship":
      return card[`loveMeaning${suffix}` as const] ?? card.loveMeaning ?? null;
    case "career":
    case "study":
      return card[`careerMeaning${suffix}` as const] ?? card.careerMeaning ?? null;
    default:
      return null;
  }
}

function getPositionBridge(position: string, readingIntent?: ReadingIntent) {
  if (readingIntent?.domain === "love" || readingIntent?.domain === "relationship") {
    if (/对方/.test(position)) {
      return "放在对方位置时，它更适合被看作TA当下呈现出的互动方式，而不是替TA内心下定论。";
    }
    if (/关系|现状|连接/.test(position)) {
      return "放在关系位置时，它说的是你们之间正在形成的互动结构。";
    }
  }

  if (/建议|行动|提醒/.test(position)) {
    return "放在建议位置时，它更像一个可以先尝试的小动作，而不是最终判决。";
  }

  return "这只是等待完整解读前的牌义预览，最终仍会结合整组牌的结构来判断。";
}

function normalizePreviewPronouns(
  text: string,
  question: string,
  readingIntent?: ReadingIntent,
) {
  const hasExplicitGender =
    /她|女朋友|女友|前女友|老婆|妻子|太太|女生|女孩|女性|女方/.test(question) ||
    /(^|[^其])他(?!人)|男朋友|男友|前男友|老公|丈夫|先生|男生|男孩|男性|男方/.test(question);

  if (
    hasExplicitGender ||
    (readingIntent?.domain !== "love" &&
      readingIntent?.domain !== "relationship" &&
      !/关系|感情|恋爱|暧昧|伴侣|对象|对方/.test(question))
  ) {
    return text;
  }

  return text
    .replace(/她\/他|他\/她|她或他|他或她|她和他|他和她/g, "TA")
    .replace(/男方|女方/g, "TA")
    .replace(/((?:对方|伴侣|对象|暧昧对象)的?)[他她]/g, "$1TA")
    .replace(/(^|[^其])他(?=的|会|是|在|可能|也|更|还|不|想|需要|正在|有|没有|把|被|对|给|从|能|愿意|应该|仍|并)/g, "$1TA")
    .replace(/(^|[^其])她(?=的|会|是|在|可能|也|更|还|不|想|需要|正在|有|没有|把|被|对|给|从|能|愿意|应该|仍|并)/g, "$1TA");
}

function buildPlainText({
  spreadName,
  question,
  cards,
  cardPreviewText,
  text: displayText,
  shareUrl,
}: {
  spreadName: string;
  question: string;
  cards: ResultCard[];
  cardPreviewText: string;
  text: string;
  shareUrl: string | null;
}) {
  const cardLines = cards.map(
    ({ card, reversed, positionName, positionOrder }) =>
      `${positionName ?? `牌位 ${positionOrder}`}：${card.nameZh}（${reversed ? "逆位" : "正位"}）`,
  );
  const readingLabel = "完整解读：";

  return [
    `Arcana Flow · ${spreadName}`,
    question ? `问题：${question}` : null,
    "",
    "抽到的牌：",
    ...cardLines,
    cardPreviewText.trim() ? "" : null,
    cardPreviewText.trim() ? "今日单张牌义预览：" : null,
    cardPreviewText.trim() ? cardPreviewText.trim() : null,
    "",
    readingLabel,
    displayText.trim(),
    shareUrl ? "" : null,
    shareUrl ? `分享链接：${shareUrl}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}
