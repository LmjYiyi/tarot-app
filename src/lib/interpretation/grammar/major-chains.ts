import type { SelectedCardForAnalysis } from "@/lib/interpretation/analysis/types";

import type { MajorArcanaChainNote } from "./types";

type MajorChainRule = {
  slugs: [string, string];
  theme: string;
  note: string;
  caution: string;
};

const chainRules: MajorChainRule[] = [
  { slugs: ["the-fool", "the-magician"], theme: "起步后的立刻上手", note: "从纯潜能进入主动试做，敢开始也要把灵感落成动作。", caution: "不要写成天赋自动成功。" },
  { slugs: ["the-high-priestess", "the-moon"], theme: "直觉与不确定性的深水区", note: "内在感知很强，但信息未完全显形，需要区分直觉和投射。", caution: "不要把月亮直接读成欺骗。" },
  { slugs: ["the-empress", "the-emperor"], theme: "滋养与结构配对", note: "自然成长需要边界和秩序承托，感受与结构互补。", caution: "不要僵化成性别角色。" },
  { slugs: ["the-lovers", "justice"], theme: "关系选择进入责任结算", note: "喜欢不再只靠感觉，而要面对价值、承诺与后果。", caution: "不要只读爱情，也要读价值一致性。" },
  { slugs: ["the-chariot", "strength"], theme: "外在控制被内在柔性修正", note: "会冲还不够，还要学会稳住自己。", caution: "力量不是更猛，而是更稳。" },
  { slugs: ["the-hermit", "the-star"], theme: "独处之后重新看见希望", note: "先退回内在，再重新建立更真实的方向感。", caution: "不要把隐士写成纯退缩。" },
  { slugs: ["wheel-of-fortune", "judgement"], theme: "周期转动后的召唤", note: "外部变化把人推到必须重新定义自己的节点。", caution: "不要只等时机，要回应召唤。" },
  { slugs: ["the-hanged-man", "death"], theme: "先放下控制，再真正结束", note: "暂停和臣服之后，旧结构才有机会退场。", caution: "不要把停滞误写成完成转化。" },
  { slugs: ["death", "the-world"], theme: "彻底结束带来完整闭环", note: "旧身份退场后，系统终于可以整合。", caution: "世界不是完美，而是合上这一轮。" },
  { slugs: ["the-devil", "death"], theme: "从束缚到断链", note: "看见依赖、沉迷或绑缚之后，才有真正脱身的可能。", caution: "不要把恶魔只读成外部坏人。" },
  { slugs: ["the-devil", "the-tower"], theme: "束缚被强行打破", note: "当人自己不松手，现实可能代替你拆掉牢笼。", caution: "高塔破的是假稳，不一定破真核心。" },
  { slugs: ["the-tower", "the-star"], theme: "崩塌之后的修复", note: "旧外壳裂开后，人才可能回到更真实的希望。", caution: "星星不是立刻变好，而是终于能诚实变好。" },
  { slugs: ["the-moon", "the-sun"], theme: "迷雾后的明朗", note: "想象、焦虑和投射最终要回到真实照明。", caution: "不要在月亮阶段急着宣布太阳已到。" },
  { slugs: ["temperance", "the-lovers"], theme: "爱需要调和", note: "关系若要持续，需要节奏、交换与配比。", caution: "节制不是压抑，而是可持续。" },
  { slugs: ["the-hierophant", "justice"], theme: "共同规范遇到个人责任", note: "信念、制度和传统必须接受现实边界检验。", caution: "不要只讲原则而忽略承担。" },
  { slugs: ["the-emperor", "the-hierophant"], theme: "个人秩序扩展为社会秩序", note: "事情从私人规则进入公共规则和组织框架。", caution: "两张都过强时容易压掉个体弹性。" },
  { slugs: ["the-world", "the-fool"], theme: "完成与重启并存", note: "一个周期收束，新的旅程已经在门口。", caution: "世界不是永久停留，而是完成后再次开始。" },
];

function normalizeSlug(slug: string) {
  return slug.replace(/^the-(justice|judgement|wheel-of-fortune)$/, "$1");
}

function samePair(rule: MajorChainRule, left: string, right: string) {
  const ruleSlugs = rule.slugs.map(normalizeSlug).sort().join(":");
  return ruleSlugs === [normalizeSlug(left), normalizeSlug(right)].sort().join(":");
}

export function analyzeMajorArcanaChains(
  selectedCards: SelectedCardForAnalysis[],
): MajorArcanaChainNote[] {
  const majors = selectedCards.filter(({ card }) => card.arcana === "major");
  const notes: MajorArcanaChainNote[] = [];

  for (let i = 0; i < majors.length; i += 1) {
    for (let j = i + 1; j < majors.length; j += 1) {
      const left = majors[i];
      const right = majors[j];
      const rule = chainRules.find((candidate) => samePair(candidate, left.card.slug, right.card.slug));

      if (rule) {
        notes.push({
          cards: [left.card.nameZh, right.card.nameZh],
          theme: rule.theme,
          note: `${left.card.nameZh}与${right.card.nameZh}形成「${rule.theme}」：${rule.note}`,
          caution: rule.caution,
        });
      }
    }
  }

  return notes.slice(0, 4);
}
