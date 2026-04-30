"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { AnnotatedInterpretation } from "@/components/AnnotatedInterpretation";
import { Button } from "@/components/ui/button";
import { cleanInterpretationMarkdown } from "@/lib/interpretation/display";
import { cn } from "@/lib/utils";
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
  onShareNavigate?: () => void;
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
  onShareNavigate,
}: StreamingInterpretationProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hasContent = Boolean(text.trim());
  const progress = isStreaming ? Math.min(94, 18 + Math.floor(text.length / 42)) : 100;
  const singleCard = cards.length === 1;

  const shareUrl = useMemo(() => {
    if (!sharePath) return null;
    if (typeof window === "undefined") return sharePath;
    return new URL(sharePath, window.location.origin).toString();
  }, [sharePath]);
  const displayText = useMemo(() => cleanInterpretationMarkdown(text), [text]);

  const plainText = useMemo(
    () => buildPlainText({ spreadName, question, cards, text: displayText, shareUrl }),
    [cards, displayText, question, shareUrl, spreadName],
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
      <div className="relative flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-[24px] border border-[var(--gilt)]/35 bg-[rgba(255,249,232,0.94)] shadow-[0_30px_110px_rgba(32,24,18,0.30)]">
        <Image
          src="/visuals/reading-share-modal-background-v1.png"
          alt=""
          fill
          sizes="(max-width: 768px) 94vw, 1152px"
          className="pointer-events-none object-cover opacity-[0.62] mix-blend-multiply"
          priority
        />
        <div className="pointer-events-none absolute inset-0 bg-[rgba(255,249,232,0.36)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,251,238,0.44)_0%,rgba(255,249,232,0.26)_52%,rgba(210,162,92,0.28)_100%)]" />

        <header className="relative z-10 flex flex-wrap items-start justify-between gap-4 border-b border-[var(--gilt)]/25 px-5 py-4 sm:px-7">
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
            {!isStreaming && (
              <button
                type="button"
                onClick={onClose}
                className="grid h-10 w-10 place-items-center rounded-[10px] text-[22px] leading-none text-[var(--ink-soft)] transition hover:bg-[var(--surface-raised)] hover:text-[var(--ink)]"
                aria-label="关闭"
              >
                ×
              </button>
            )}
          </div>
        </header>

        {isStreaming ? (
          <div className="relative z-10 border-b border-[var(--gilt)]/20 px-5 py-4 sm:px-7">
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
          {!hasContent ? (
            <LoadingState />
          ) : (
            <div className="grid gap-7 xl:grid-cols-[400px_minmax(0,1fr)]">
              <aside className="space-y-8">
                <section className="border-t border-[var(--line)] pt-5">
                  <p className="eyebrow-ink">你的问题</p>
                  <p className="mt-2 font-fraunces text-[19px] italic leading-8 text-[var(--ink-soft)]">
                    “{question || "我想看清自己当前最需要面对的课题。"}”
                  </p>
                </section>

                <section className="border-t border-[var(--line)] pt-5">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <p className="eyebrow-ink">抽到的牌</p>
                    <span className="text-[12px] text-[var(--ink-muted)]">{cards.length} 张</span>
                  </div>
                  <div className={singleCard ? "flex justify-center" : "grid grid-cols-2 gap-3"}>
                    {cards.map(({ card, reversed, positionOrder, positionName }) => (
                      <article
                        key={`${card.id}-${positionOrder}`}
                        className={cn(
                          "p-1",
                          singleCard
                            ? "flex w-full max-w-[250px] flex-col items-center gap-4 text-center"
                            : "flex min-w-0 flex-col items-center gap-2.5 text-center",
                        )}
                      >
                        <div
                          className={cn(
                            "relative aspect-[300/524] overflow-hidden rounded-[10px] border border-[var(--gilt)]/35 bg-[var(--vellum-1)] shadow-[0_8px_20px_rgba(42,32,18,0.12)]",
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
                      </article>
                    ))}
                  </div>
                </section>
              </aside>

              <article className="border-t border-[var(--line)] px-1 pt-6 sm:px-3">
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
    </div>,
    document.body,
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
