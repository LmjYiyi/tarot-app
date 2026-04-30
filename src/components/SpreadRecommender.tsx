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
    <section className="mx-auto mt-14 w-full max-w-[1320px] px-5 sm:px-8 lg:px-12">
      <div className="grid gap-8 border-y border-[var(--line)] py-9 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end lg:gap-12">
        <div className="min-w-0 space-y-5">
          <div>
            <p className="eyebrow">不知道选哪个？</p>
            <h2 className="mt-2 w-full max-w-[350px] break-all font-serif-display text-[clamp(1.95rem,3vw,3rem)] leading-[1.08] text-[var(--ink)] sm:max-w-2xl">
              先写下问题，
              <br className="sm:hidden" />
              让合适的牌阵自己浮出来
            </h2>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {topicOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTopic(option.value)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-[13px] transition-all",
                  topic === option.value
                    ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]"
                    : "border-[var(--line-strong)] bg-transparent text-[var(--ink-soft)] hover:border-[var(--ink-soft)] hover:text-[var(--ink)]",
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
            className="w-full max-w-[350px] resize-y border-0 border-b border-[var(--line-strong)] bg-transparent px-0 py-3 text-[16px] leading-7 text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--coral)] sm:max-w-full"
          />
        </div>

        <div className="min-w-0 border-t border-[var(--line)] pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            适合这一问
          </p>
          <h3 className="mt-2 font-serif-display text-[28px] leading-tight text-[var(--ink)]">
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
