"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AnnotatedInterpretation } from "@/components/AnnotatedInterpretation";
import { Button } from "@/components/ui/button";
import type { AdaptiveAnswer, TarotCard } from "@/lib/tarot/types";

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
  sharePath?: string | null;
  adaptiveAnswers?: AdaptiveAnswer[];
  spreadName: string;
  question: string;
  cards: ResultCard[];
};

export function StreamingInterpretation({
  open,
  onClose,
  text,
  isStreaming,
  sharePath,
  adaptiveAnswers,
  spreadName,
  question,
  cards,
}: StreamingInterpretationProps) {
  const [copied, setCopied] = useState(false);
  const hasContent = Boolean(text.trim());
  const progress = isStreaming ? Math.min(94, 18 + Math.floor(text.length / 42)) : 100;

  const shareUrl = useMemo(() => {
    if (!sharePath) return null;
    if (typeof window === "undefined") return sharePath;
    return new URL(sharePath, window.location.origin).toString();
  }, [sharePath]);
  const displayText = useMemo(() => cleanMarkdownForDisplay(text), [text]);

  const plainText = useMemo(
    () => buildPlainText({ spreadName, question, cards, text: displayText, shareUrl }),
    [cards, displayText, question, shareUrl, spreadName],
  );

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

  if (!open) return null;

  async function handleCopy() {
    try {
      await copyText(plainText);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Reading result"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(32,24,18,0.45)] px-4 py-5 backdrop-blur-sm"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[24px] border border-[var(--gilt)]/35 bg-[rgba(255,249,232,0.94)] shadow-[0_30px_110px_rgba(32,24,18,0.30)]">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--gilt)]/25 px-5 py-4 sm:px-7">
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
          <div className="border-b border-[var(--gilt)]/20 px-5 py-4 sm:px-7">
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

        <div className="min-h-0 overflow-y-auto px-5 py-6 sm:px-7">
          {!hasContent ? (
            <LoadingState />
          ) : (
            <div className="grid gap-7 xl:grid-cols-[360px_minmax(0,1fr)]">
              <aside className="space-y-4">
                <section className="rounded-[18px] border border-[var(--gilt)]/30 bg-[rgba(255,249,232,0.70)] p-4">
                  <p className="eyebrow-ink">你的问题</p>
                  <p className="mt-2 font-fraunces text-[19px] italic leading-8 text-[var(--ink-soft)]">
                    “{question || "我想看清自己当前最需要面对的课题。"}”
                  </p>
                </section>

                <section className="rounded-[18px] border border-[var(--gilt)]/30 bg-[rgba(255,249,232,0.70)] p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="eyebrow-ink">抽到的牌</p>
                    <span className="text-[12px] text-[var(--ink-muted)]">{cards.length} 张</span>
                  </div>
                  <div className="grid gap-3">
                    {cards.map(({ card, reversed, positionOrder, positionName }) => (
                      <article
                        key={`${card.id}-${positionOrder}`}
                        className="grid grid-cols-[90px_minmax(0,1fr)] gap-4 rounded-[16px] border border-[var(--gilt)]/25 bg-[rgba(255,255,255,0.28)] p-2.5"
                      >
                        <div className="relative aspect-[300/524] overflow-hidden rounded-[10px] border border-[var(--gilt)]/35 bg-[var(--vellum-1)] shadow-[0_8px_20px_rgba(42,32,18,0.12)]">
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
                          <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                            {positionName ?? `牌位 ${positionOrder}`}
                          </p>
                          <p className="mt-1.5 font-serif-display text-[20px] leading-tight text-[var(--ink)]">
                            {card.nameZh}
                          </p>
                          <p className="mt-1 text-[12.5px] text-[var(--ink-muted)]">
                            {reversed ? "逆位" : "正位"}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </aside>

              <article className="rounded-[20px] border border-[var(--gilt)]/35 bg-[rgba(255,249,232,0.78)] px-5 py-6 shadow-[0_18px_50px_rgba(42,32,18,0.10)] sm:px-7">
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
              </article>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[340px] flex-col items-center justify-center gap-4 text-center">
      <span className="relative flex h-12 w-12">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--coral)] opacity-30" />
        <span className="relative inline-flex h-12 w-12 rounded-full border border-[var(--coral-edge)] bg-[var(--coral-wash)]" />
      </span>
      <p className="font-serif-display text-[22px] text-[var(--ink)]">正在整理牌面结果</p>
      <p className="max-w-sm text-[13px] leading-6 text-[var(--ink-muted)]">
        完成后会在这个窗口里出现完整分享卡片。
      </p>
    </div>
  );
}

function buildPlainText({
  spreadName,
  question,
  cards,
  text: displayText,
  shareUrl,
}: {
  spreadName: string;
  question: string;
  cards: ResultCard[];
  text: string;
  shareUrl: string | null;
}) {
  const cardLines = cards.map(
    ({ card, reversed, positionName, positionOrder }) =>
      `${positionName ?? `牌位 ${positionOrder}`}：${card.nameZh}（${reversed ? "逆位" : "正位"}）`,
  );

  return [
    `Arcana Flow · ${spreadName}`,
    question ? `问题：${question}` : null,
    "",
    "抽到的牌：",
    ...cardLines,
    "",
    "完整解读：",
    displayText.trim(),
    shareUrl ? "" : null,
    shareUrl ? `分享链接：${shareUrl}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function cleanMarkdownForDisplay(source: string) {
  return source
    .split("\n")
    .map((line) =>
      line
        .replace(/^\s{0,3}#{1,6}\s*/, "")
        .replace(/^\s{0,3}[-*+]\s+/, "")
        .replace(/^\s{0,3}>\s?/, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/__(.*?)__/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .trimEnd(),
    )
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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
