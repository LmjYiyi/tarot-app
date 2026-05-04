import luckyPoolSeed from "../../../tarot-data/daily-tarot-lucky-pool.seed.json";
import dailySignatureDataset from "../../../tarot-data/daily-tarot-signatures.runtime.json";
import type { Suit, TarotCard } from "@/lib/tarot/types";

export type DailyLuckyPool = {
  ruler?: string;
  candidateColors: string[];
  candidateCrystals: string[];
};

export type DailySignatureAttributes = {
  emotionShort: string;
  careerShort: string;
  wealthShort: string;
  dailyReminder: string;
  microAction: string;
  suitableToDo: string[];
  unsuitableToDo: string[];
};

export type DailyTarotSignature = {
  cardSlug: string;
  sourceSlug?: string;
  cardNameZh?: string;
  cardNameEn?: string;
  planetaryZodiacRuler?: string;
  upright: DailySignatureAttributes;
  reversed: DailySignatureAttributes;
  luckyPool: DailyLuckyPool;
};

export type SuitSemanticProfile = {
  suit: Suit | "major";
  element: "fire" | "water" | "air" | "earth" | "major";
  coreThemes: string[];
  priorityField: "careerShort" | "emotionShort" | "wealthShort" | "dailyReminder";
  microActionTone: string;
  dailyReminderLead: string;
  luckyPool: DailyLuckyPool;
};

export const suitSemanticProfiles: Record<Suit | "major", SuitSemanticProfile> = {
  wands: {
    suit: "wands",
    element: "fire",
    coreThemes: ["行动", "热情", "启动", "意志力"],
    priorityField: "careerShort",
    microActionTone: "先做一个小动作，让事情开始流动。",
    dailyReminderLead: "今天的重点不是想得更完整，而是让第一步真的发生。",
    luckyPool: {
      candidateColors: ["暖红色", "日落橙", "烛火金", "珊瑚红"],
      candidateCrystals: ["红玛瑙", "太阳石", "虎眼石", "红玉髓"],
    },
  },
  cups: {
    suit: "cups",
    element: "water",
    coreThemes: ["感受", "关系", "滋养", "直觉"],
    priorityField: "emotionShort",
    microActionTone: "先照顾感受，再决定要不要回应。",
    dailyReminderLead: "今天适合把心放软一点，但边界仍然要清楚。",
    luckyPool: {
      candidateColors: ["海盐蓝", "珍珠白", "浅粉色", "湖水绿"],
      candidateCrystals: ["月光石", "粉晶", "海蓝宝", "珍珠"],
    },
  },
  swords: {
    suit: "swords",
    element: "air",
    coreThemes: ["思考", "沟通", "边界", "逻辑"],
    priorityField: "dailyReminder",
    microActionTone: "少猜一点，多确认一句。",
    dailyReminderLead: "今天适合把混乱拆成一句清楚的话。",
    luckyPool: {
      candidateColors: ["浅蓝色", "银灰色", "雾白色", "冷青色"],
      candidateCrystals: ["白水晶", "萤石", "青金石", "蓝晶石"],
    },
  },
  pentacles: {
    suit: "pentacles",
    element: "earth",
    coreThemes: ["现实", "金钱", "身体", "资源"],
    priorityField: "wealthShort",
    microActionTone: "先稳住一个现实细节，今天就会轻松很多。",
    dailyReminderLead: "今天适合回到身体、时间表和手头资源。",
    luckyPool: {
      candidateColors: ["鼠尾草绿", "大地棕", "麦穗金", "苔藓绿"],
      candidateCrystals: ["黄水晶", "绿东陵", "茶晶", "孔雀石"],
    },
  },
  major: {
    suit: "major",
    element: "major",
    coreThemes: ["阶段主题", "精神提醒", "转折", "自我观察"],
    priorityField: "dailyReminder",
    microActionTone: "把这张牌收成一个今天能完成的小提醒。",
    dailyReminderLead: "今天这张大牌更像一个阶段主题，不需要被读成命运判决。",
    luckyPool: {
      candidateColors: ["象牙白", "星光银", "柔金色", "深靛色"],
      candidateCrystals: ["白水晶", "紫水晶", "青金石", "月光石"],
    },
  },
};

export const majorArcanaLuckyPools = luckyPoolSeed.majorArcanaLuckyPools as Record<
  string,
  DailyLuckyPool
>;

export const dailyTarotSignatures = (
  dailySignatureDataset as { tarotCards: DailyTarotSignature[] }
).tarotCards;

const dailySignatureBySlug = new Map<string, DailyTarotSignature>();

for (const signature of dailyTarotSignatures) {
  dailySignatureBySlug.set(signature.cardSlug, signature);

  if (signature.sourceSlug) {
    dailySignatureBySlug.set(signature.sourceSlug, signature);
  }
}

export function getSuitSemanticProfile(card: TarotCard) {
  return suitSemanticProfiles[card.suit ?? "major"];
}

export function getDailyTarotSignature(card: TarotCard) {
  return dailySignatureBySlug.get(card.slug) ?? null;
}

export function getDailyTarotSignatureState(card: TarotCard, reversed: boolean) {
  const signature = getDailyTarotSignature(card);

  if (!signature) return null;
  return reversed ? signature.reversed : signature.upright;
}

export function getNativeLuckyPool(card: TarotCard): DailyLuckyPool {
  return (
    getDailyTarotSignature(card)?.luckyPool ??
    majorArcanaLuckyPools[card.slug] ??
    getSuitSemanticProfile(card).luckyPool
  );
}
