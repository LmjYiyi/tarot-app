import type { ReadingDomain, ReadingIntent } from "@/lib/tarot/types";

export function getDefaultIntentForSpread(spreadSlug: string): ReadingIntent {
  if (spreadSlug === "career-five") return { domain: "career", goal: "trend" };
  if (spreadSlug === "relationship-six" || spreadSlug === "lovers-pyramid") {
    return { domain: "relationship", goal: "other_view" };
  }
  if (spreadSlug === "path-of-choice") return { domain: "decision", goal: "decision" };
  if (spreadSlug === "self-state") return { domain: "self", goal: "advice" };
  return { domain: "self", goal: "advice" };
}

export function getDefaultQuestionForIntent(intent: ReadingIntent, spreadNameZh: string): string {
  const domainPrompts: Record<ReadingDomain, string> = {
    career: "我想看看接下来的事业发展趋势和建议。",
    love: "我想了解目前的感情状态和未来的指引。",
    study: "我想看看近期的学习状态和提升建议。",
    relationship: "我想了解这段关系的现状和平衡点。",
    self: "我想看看当前的个人能量状态和内在指引。",
    decision: "针对眼前的这个选择，我想听听塔罗的指引。",
  };

  return `针对“${spreadNameZh}”，${domainPrompts[intent.domain] || "我想通过这组牌获得一些当下的指引。"}`;
}
