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

const questionPlaceholderBySpread: Record<string, string> = {
  "single-guidance": "例如：今天我最该留意的提醒是什么？",
  "career-five": "例如：接下来三个月，我的事业最该把力气放在哪里？",
  "three-card": "例如：这件事的背景、现状和下一步走向是什么？",
  "cross-five": "例如：这件事的核心症结和真正的阻碍是什么？",
  "relationship-six": "例如：这段关系现在卡在哪里，怎样沟通会更顺？",
  "lovers-pyramid": "例如：我和对方现在的关系正朝哪里走？",
  "path-of-choice": "例如：A 和 B 这两条路，各自的代价和机会是什么？",
  "self-state": "例如：最近的压力来自哪里，我可以先调整什么？",
  "celtic-cross": "例如：这件事的核心张力、走向和最终落点是什么？",
};

export function getQuestionPlaceholderForSpread(spreadSlug: string): string {
  return questionPlaceholderBySpread[spreadSlug] ?? "例如：我现在最想看清的是什么？";
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
