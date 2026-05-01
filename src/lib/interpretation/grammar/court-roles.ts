import type { Suit } from "@/lib/tarot/types";

import type { SelectedCardForAnalysis } from "@/lib/interpretation/analysis/types";

import type { CourtRoleNote } from "./types";

const rankRoles: Record<number, string> = {
  11: "侍者：学习者、信使、试探者，代表刚入门的姿态或新信息。",
  12: "骑士：行动者、推进者、任务驱动，代表追求方式和行动节奏。",
  13: "王后：向内成熟、承接、滋养与边界，代表内在调节能力。",
  14: "国王：向外掌控、责任、管理与规则，代表外在结构能力。",
};

const suitRoles: Record<Suit, string> = {
  cups: "圣杯：情绪、关系、共情和亲密需求。",
  swords: "宝剑：语言、判断、边界和事实核对。",
  wands: "权杖：热情、行动、创造和推进速度。",
  pentacles: "星币：资源、身体、稳定和长期执行。",
};

const archetypes: Record<string, string> = {
  "cups:11": "圣杯侍者：情感讯息、试探和柔软好奇。",
  "cups:12": "圣杯骑士：浪漫追求、邀请靠近和顺着感觉行动。",
  "cups:13": "圣杯王后：共情型照顾者，温柔但需要边界。",
  "cups:14": "圣杯国王：情绪管理者，成熟包容但也可能冷处理。",
  "swords:11": "宝剑侍者：观察者、提问者、信息哨兵。",
  "swords:12": "宝剑骑士：论点与行动并行的冲锋者。",
  "swords:13": "宝剑王后：清醒的边界维护者。",
  "swords:14": "宝剑国王：制度与判断的执行者。",
  "wands:11": "权杖侍者：火种、冒险心和刚起的点子。",
  "wands:12": "权杖骑士：热情驱动的快速行动者。",
  "wands:13": "权杖王后：有感染力的点火者。",
  "wands:14": "权杖国王：愿景型领导者。",
  "pentacles:11": "星币侍者：务实学习者和现实机会的萌芽。",
  "pentacles:12": "星币骑士：稳定执行者和耐力型推进。",
  "pentacles:13": "星币王后：现实滋养者和生活系统经营者。",
  "pentacles:14": "星币国王：资源与秩序的守成者。",
};

function inferRoleHint(selectedCard: SelectedCardForAnalysis) {
  const text = `${selectedCard.position.name}${selectedCard.position.focus}`;
  if (/对方|他人|环境|外部|团队|家人|伴侣/.test(text)) {
    return "作为对方/环境位，只能读作呈现方式和可观察姿态，不要断言人格本质。";
  }
  if (/我|自己|个人|态度|内在/.test(text)) {
    return "作为自己位，优先读作用户当前调用或拒绝的角色方式。";
  }
  if (/建议|优势|资源|帮助|能力|调整/.test(text)) {
    return "作为建议/资源位，优先读作需要学习或调用的能力。";
  }
  return "作为普通牌位，先读角色策略，再结合牌位决定是人物、能力还是内在声音。";
}

export function analyzeCourtRoles(selectedCards: SelectedCardForAnalysis[]): CourtRoleNote[] {
  return selectedCards
    .filter(({ card }) => card.arcana === "minor" && card.suit && card.number >= 11)
    .map((selectedCard) => {
      const suit = selectedCard.card.suit as Suit;

      return {
        cardName: selectedCard.card.nameZh,
        positionName: selectedCard.position.name,
        orientation: selectedCard.orientation,
        archetype: archetypes[`${suit}:${selectedCard.card.number}`] ?? "宫廷牌：人物、角色或能力原型。",
        rankRole: rankRoles[selectedCard.card.number] ?? "宫廷牌等级线索不明。",
        suitRole: suitRoles[suit],
        roleHint: inferRoleHint(selectedCard),
        caution: "不要按年龄、性别、外貌机械对号入座；只说此刻呈现的角色方式。",
      };
    });
}
