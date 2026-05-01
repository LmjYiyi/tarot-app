import type { Suit } from "@/lib/tarot/types";

import type { SelectedCardForAnalysis } from "@/lib/interpretation/analysis/types";

import type { GrammarNote, SuitDynamics } from "./types";

const suitLabels: Record<Suit, string> = {
  cups: "圣杯",
  wands: "权杖",
  swords: "宝剑",
  pentacles: "星币",
};

const interactionRules: Record<string, string> = {
  "cups:swords": "圣杯与宝剑形成感受和理性的拉扯，重点是把情绪翻译成事实、需求和请求。",
  "cups:wands": "圣杯与权杖让情感被热情点燃，优势是有生命力，风险是凭感觉冲太快。",
  "cups:pentacles": "圣杯与星币强调情感需要现实承接，温柔要落到时间、资源和行动。",
  "swords:wands": "宝剑与权杖让判断和行动互相加速，优势是决策快，风险是沟通变成攻击。",
  "swords:pentacles": "宝剑与星币强调计划和资源的匹配，先做事实核对，再做现实配置。",
  "pentacles:wands": "权杖与星币形成速度和耐力的张力，愿景需要工序，执行也需要点火。",
};

const missingSuitRules: Record<Suit, string> = {
  cups: "圣杯缺失：情绪确认、关系滋养和真实感受没有被充分调动；不要说用户没有感情。",
  swords: "宝剑缺失：事实核对、清晰表达和边界沟通不足；适合提醒把猜测与事实分开。",
  wands: "权杖缺失：行动力、热情和主动推进不足；适合提醒需要点火，而不是说没有希望。",
  pentacles: "星币缺失：资源、执行、身体感和现实承托不足；适合提醒把抽象问题落到实际安排。",
};

function pairKey(left: Suit, right: Suit) {
  return [left, right].sort().join(":");
}

export function analyzeSuitDynamics(selectedCards: SelectedCardForAnalysis[]): SuitDynamics {
  const presentSuits = [...new Set(selectedCards.map(({ card }) => card.suit).filter(Boolean))] as Suit[];
  const counts = presentSuits.map((suit) => ({
    suit,
    count: selectedCards.filter(({ card }) => card.suit === suit).length,
  }));
  const max = Math.max(0, ...counts.map(({ count }) => count));
  const dominantSuits = counts.filter(({ count }) => count === max && count > 0).map(({ suit }) => suit);
  const missingSuits = (["cups", "wands", "swords", "pentacles"] as Suit[]).filter(
    (suit) => !presentSuits.includes(suit),
  );
  const interactions: GrammarNote[] = [];

  for (let i = 0; i < presentSuits.length; i += 1) {
    for (let j = i + 1; j < presentSuits.length; j += 1) {
      const left = presentSuits[i];
      const right = presentSuits[j];
      const rule = interactionRules[pairKey(left, right)];

      if (rule) {
        interactions.push({
          type: `${suitLabels[left]} + ${suitLabels[right]}`,
          severity: "medium",
          note: rule,
        });
      }
    }
  }

  return {
    dominantSuits,
    missingSuits,
    interactions,
    missingNotes: missingSuits.map((suit) => ({
      type: `缺失${suitLabels[suit]}`,
      severity: "medium",
      note: missingSuitRules[suit],
    })),
  };
}
