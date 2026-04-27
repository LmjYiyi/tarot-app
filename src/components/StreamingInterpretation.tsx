import Image from "next/image";
import Link from "next/link";

import { AnnotatedInterpretation } from "@/components/AnnotatedInterpretation";
import { Ornament } from "@/components/ui/ornament";
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
  return (
    <Panel className="space-y-4 border-[var(--gilt-dim)] bg-[var(--nebula)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow-gold">AI Lector · 解读</p>
          <h2 className="mt-1 font-serif-display text-2xl italic text-[var(--text-primary)]">
            整体牌意
          </h2>
        </div>
        {isStreaming ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--ember)]/40 bg-[rgba(196,90,42,0.08)] px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-[var(--ember)] font-occult">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--ember)] animate-shimmer" />
            正在生成
          </span>
        ) : null}
      </div>
      <Ornament variant="rule" className="max-w-[200px]" />
      {!text && !isStreaming ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="relative h-[200px] w-[200px]">
            <Image
              src="/visuals/interpretation-empty-oracle.png"
              alt=""
              fill
              sizes="200px"
              className="object-contain"
            />
          </div>
          <p className="font-serif-display text-[18px] italic text-[var(--text-primary)]">
            解读会在这里实时展开
          </p>
          <p className="max-w-[260px] text-[13px] leading-6 text-[var(--text-muted)]">
            先抽牌、回答追问，然后点击&ldquo;生成解读&rdquo;。
          </p>
        </div>
      ) : (
        <AnnotatedInterpretation
          text={text}
          isStreaming={isStreaming}
          adaptiveAnswers={adaptiveAnswers}
        />
      )}
      {sharePath ? (
        <div className="rounded-[14px] border border-[var(--gilt-dim)] bg-[var(--velvet)] px-4 py-3 text-sm text-[var(--text-muted)]">
          <p className="eyebrow-gold mb-1">分享</p>
          <Link
            className="font-serif-display text-[17px] italic text-[var(--glow-gold-bright)] underline-offset-4 hover:underline"
            href={sharePath}
          >
            {sharePath}
          </Link>
        </div>
      ) : null}
    </Panel>
  );
}
