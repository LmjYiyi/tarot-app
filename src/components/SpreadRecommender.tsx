"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import type { SpreadDefinition } from "@/lib/tarot/types";
import { cn } from "@/lib/utils";

type SpreadRecommenderProps = {
  spreads: SpreadDefinition[];
};

const topicOptions = [
  { value: "career", label: "事业", keywords: ["工作", "事业", "职业", "项目", "跳槽", "升职", "面试"] },
  { value: "love", label: "感情", keywords: ["感情", "恋爱", "喜欢", "复合", "暧昧", "伴侣", "关系"] },
  { value: "decision", label: "选择", keywords: ["选择", "决定", "要不要", "是否", "A", "B", "方向"] },
  { value: "self", label: "自我", keywords: ["自己", "状态", "情绪", "压力", "迷茫", "调整"] },
];

function scoreSpread(spread: SpreadDefinition, question: string, topic: string) {
  const text = `${spread.nameZh} ${spread.summary} ${spread.hero} ${spread.suitableFor.join(" ")}`;
  const matchedTopic = topicOptions.find((item) => item.value === topic);
  let score = 0;

  if (matchedTopic) {
    score += matchedTopic.keywords.some((keyword) => text.includes(keyword)) ? 6 : 0;
    score += matchedTopic.keywords.filter((keyword) => question.includes(keyword)).length * 3;
  }

  if (question.length <= 20 && spread.cardCount <= 3) score += 3;
  if (question.length > 20 && question.length <= 60 && spread.cardCount >= 3 && spread.cardCount <= 6) score += 3;
  if (question.length > 60 && spread.cardCount >= 5) score += 3;
  if (question.includes("A") || question.includes("B") || question.includes("选择")) {
    score += spread.slug === "path-of-choice" ? 8 : 0;
  }
  if (!question.trim() && spread.slug === "three-card") score += 4;

  return score;
}

export function SpreadRecommender({ spreads }: SpreadRecommenderProps) {
  const [question, setQuestion] = useState("");
  const [topic, setTopic] = useState("career");

  const recommended = useMemo(() => {
    return [...spreads].sort(
      (a, b) => scoreSpread(b, question, topic) - scoreSpread(a, question, topic),
    )[0];
  }, [question, spreads, topic]);

  if (!recommended) return null;

  return (
    <section className="mx-auto mt-12 max-w-5xl rounded-[18px] border border-[var(--coral-edge)] bg-[var(--surface-tint)] p-5 sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
        <div className="space-y-4">
          <div>
            <p className="eyebrow">不知道选哪个？</p>
            <h2 className="mt-2 font-serif-display text-[28px] leading-tight text-[var(--ink)]">
              先写下问题，让合适的牌阵自己浮出来
            </h2>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {topicOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTopic(option.value)}
                className={cn(
                  "rounded-[8px] border px-3 py-1.5 text-[13px] transition-all",
                  topic === option.value
                    ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]"
                    : "border-[var(--line-strong)] text-[var(--ink-soft)] hover:border-[var(--ink-soft)] hover:text-[var(--ink)]",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value.slice(0, 180))}
            rows={2}
            placeholder="例如：我该继续现在的工作，还是准备换方向？"
            className="w-full resize-y rounded-[12px] border border-[var(--line-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] leading-7 text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--coral)] focus:shadow-[0_0_0_3px_var(--coral-wash)]"
          />
        </div>

        <div className="rounded-[14px] border border-[var(--line)] bg-[var(--surface)] p-4">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            适合这一问
          </p>
          <h3 className="mt-2 font-serif-display text-[24px] leading-tight text-[var(--ink)]">
            {recommended.nameZh}
          </h3>
          <p className="mt-2 text-[13px] leading-6 text-[var(--ink-soft)]">
            {recommended.cardCount} 张牌 · 约 {Math.max(2, Math.ceil(recommended.cardCount * 1.2))} 分钟
          </p>
          <Link
            className={buttonStyles({ className: "mt-4 w-full" })}
            href={`/spreads/${recommended.slug}`}
          >
            就用这副牌阵
          </Link>
        </div>
      </div>
    </section>
  );
}
