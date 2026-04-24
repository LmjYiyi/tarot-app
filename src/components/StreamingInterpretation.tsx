import Link from "next/link";

import { Ornament } from "@/components/ui/ornament";
import { Panel } from "@/components/ui/panel";

type StreamingInterpretationProps = {
  text: string;
  isStreaming: boolean;
  sharePath?: string | null;
};

export function StreamingInterpretation({
  text,
  isStreaming,
  sharePath,
}: StreamingInterpretationProps) {
  return (
    <Panel className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">AI Lector · 解读</p>
          <h2 className="mt-1 font-serif-display text-2xl italic text-[var(--ink)]">
            整体牌意
          </h2>
        </div>
        {isStreaming ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--copper)]/40 bg-[rgba(183,94,52,0.08)] px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-[var(--copper)] font-occult">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--copper)] animate-shimmer" />
            正在生成
          </span>
        ) : null}
      </div>
      <Ornament variant="rule" className="max-w-[200px]" />
      <div className="prose prose-neutral max-w-none whitespace-pre-wrap font-serif-display text-[16px] leading-8 text-[var(--ink-soft)]">
        {text || (
          <span className="italic text-[var(--ink-muted)]">
            解读会在这里实时展开。你可以先抽牌，再点击&ldquo;生成 AI 解读&rdquo;。
          </span>
        )}
        {isStreaming ? (
          <span className="ml-1 inline-block h-5 w-1.5 animate-pulse rounded bg-[var(--copper)]" />
        ) : null}
      </div>
      {sharePath ? (
        <div className="rounded-[14px] border border-[var(--gilt)]/50 bg-[rgba(255,249,232,0.72)] px-4 py-3 text-sm text-[var(--ink-soft)]">
          <p className="eyebrow mb-1">分享</p>
          <Link
            className="font-serif-display text-[17px] italic text-[var(--copper)] underline-offset-4 hover:underline"
            href={sharePath}
          >
            {sharePath}
          </Link>
        </div>
      ) : null}
    </Panel>
  );
}
