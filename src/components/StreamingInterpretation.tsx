import Link from "next/link";

import { AnnotatedInterpretation } from "@/components/AnnotatedInterpretation";
import { Panel } from "@/components/ui/panel";
import type { AdaptiveAnswer } from "@/lib/tarot/types";

type StreamingInterpretationProps = {
  text: string;
  isStreaming: boolean;
  sharePath?: string | null;
  adaptiveAnswers?: AdaptiveAnswer[];
};

export function StreamingInterpretation({
  text,
  isStreaming,
  sharePath,
  adaptiveAnswers,
}: StreamingInterpretationProps) {
  const hasContent = Boolean(text);

  return (
    <Panel className="space-y-5">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">解读 · Reading</p>
          <h2 className="mt-1.5 font-serif-display text-[22px] leading-tight text-[var(--ink)]">
            整体牌意
          </h2>
        </div>
        {isStreaming ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--coral-wash)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--coral-deep)]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--coral)] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--coral)]" />
            </span>
            Streaming
          </span>
        ) : null}
      </header>

      <div className="h-px bg-[var(--line)]" />

      {!hasContent && !isStreaming ? (
        <EmptyState />
      ) : (
        <div className="relative">
          <AnnotatedInterpretation
            text={text}
            isStreaming={isStreaming}
            adaptiveAnswers={adaptiveAnswers}
          />
          {isStreaming ? (
            <span className="ml-1 inline-block h-[1.05em] w-[2px] -mb-[3px] translate-y-[3px] animate-pulse bg-[var(--coral)] align-baseline" />
          ) : null}
        </div>
      )}

      {sharePath ? (
        <div className="rounded-[12px] border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
          <p className="eyebrow mb-1">分享 · Share</p>
          <Link
            className="font-serif-display text-[15.5px] text-[var(--coral-deep)] underline-offset-4 hover:underline"
            href={sharePath}
          >
            {sharePath}
          </Link>
        </div>
      ) : null}
    </Panel>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-[var(--coral-edge)] bg-[var(--coral-wash)]">
        <span className="absolute -inset-2 rounded-full border border-[var(--coral-edge)] opacity-50" />
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-[var(--coral-deep)]" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M12 3 L13.4 10.6 L21 12 L13.4 13.4 L12 21 L10.6 13.4 L3 12 L10.6 10.6 Z" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="font-serif-display text-[19px] leading-tight text-[var(--ink)]">
        解读会在这里实时展开
      </p>
      <p className="max-w-[280px] text-[13px] leading-6 text-[var(--ink-muted)]">
        先抽牌、回答追问，然后点击&ldquo;生成解读&rdquo;。
      </p>
    </div>
  );
}
