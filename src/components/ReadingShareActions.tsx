"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

export type ReadingShareActionCard = {
  cardId: string;
  cardName: string;
  imageUrl?: string;
  reversed: boolean;
  positionOrder: number;
  positionName?: string;
};

type ReadingShareActionsProps = {
  spreadName: string;
  question: string;
  interpretation: string;
  sharePath: string;
  cards: ReadingShareActionCard[];
  intentLabel?: string | null;
  drawModeLabel?: string | null;
};

type DrawLine = {
  text: string;
  font: string;
  color: string;
  lineHeight: number;
  gapAfter?: number;
};

export function ReadingShareActions({
  spreadName,
  question,
  interpretation,
  sharePath,
  cards,
  intentLabel,
  drawModeLabel,
}: ReadingShareActionsProps) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return sharePath;
    return new URL(sharePath, window.location.origin).toString();
  }, [sharePath]);

  const cleanInterpretation = useMemo(
    () => cleanMarkdownForDisplay(interpretation),
    [interpretation],
  );

  const plainText = useMemo(
    () =>
      buildPlainText({
        spreadName,
        question,
        cards,
        interpretation: cleanInterpretation,
        shareUrl,
        intentLabel,
        drawModeLabel,
      }),
    [cards, cleanInterpretation, drawModeLabel, intentLabel, question, shareUrl, spreadName],
  );

  async function handleCopy() {
    try {
      await copyText(plainText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  async function handleCopyLink() {
    try {
      await copyText(shareUrl);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 1600);
    } catch {
      setLinkCopied(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-3 pt-1">
      <Button variant="secondary" onClick={handleCopy}>
        {copied ? "已复制文字" : "复制文字"}
      </Button>
      <Button onClick={handleCopyLink}>
        {linkCopied ? "已复制链接" : "复制链接"}
      </Button>
    </div>
  );
}

function buildPlainText({
  spreadName,
  question,
  cards,
  interpretation,
  shareUrl,
  intentLabel,
  drawModeLabel,
}: {
  spreadName: string;
  question: string;
  cards: ReadingShareActionCard[];
  interpretation: string;
  shareUrl: string;
  intentLabel?: string | null;
  drawModeLabel?: string | null;
}) {
  const cardLines = cards.map(
    ({ cardName, reversed, positionName, positionOrder }) =>
      `${positionName ?? `牌位 ${positionOrder}`}：${cardName}（${reversed ? "逆位" : "正位"}）`,
  );

  return [
    `Arcana Flow · ${spreadName}`,
    question ? `问题：${question}` : null,
    intentLabel ? `提问方向：${intentLabel}` : null,
    drawModeLabel ? `抽牌方式：${drawModeLabel}` : null,
    "",
    "抽到的牌：",
    ...cardLines,
    "",
    "完整解读：",
    interpretation.trim(),
    "",
    `分享链接：${shareUrl}`,
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
