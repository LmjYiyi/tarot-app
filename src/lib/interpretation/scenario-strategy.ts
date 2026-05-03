import {
  cardScenarioVariants,
  scenarioStrategies,
  type ScenarioId,
  type ScenarioStrategyData,
} from "../../content/data/interpretation-scenario-data";
import type { QuestionDiagnosis, SelectedCardForAnalysis } from "@/lib/interpretation/analysis/types";
import type { ReadingIntent } from "@/lib/tarot/types";

export type ScenarioStrategy = ScenarioStrategyData & {
  matchedBy: string[];
};

function testAny(question: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(question));
}

function isRelationshipDecision(question: string) {
  return /(?:要不要|该不该|是否|是不是该|决定|马上|现在).{0,14}(?:分手|离开这段关系|复合|结婚|离婚)|(?:分手|离开这段关系|复合|结婚|离婚).{0,14}(?:要不要|该不该|是否|是不是该|决定|马上|现在)/.test(
    question,
  );
}

function isMaterialDecision(question: string, diagnosis: QuestionDiagnosis) {
  return (
    diagnosis.flags.highRiskDecision &&
    testAny(question, [
      /裸辞|辞职|离职|跳槽|搬家|借钱|贷款|投资|创业|买房|卖房|退学|休学|移民|手术/,
      /数字货币|股票|基金|理财|抄底|梭哈|all in/i,
    ])
  );
}

export function inferScenarioStrategy({
  question,
  intent,
  diagnosis,
}: {
  question: string;
  intent?: ReadingIntent;
  diagnosis: QuestionDiagnosis;
}): ScenarioStrategy {
  const normalized = question.trim();
  const matchedBy: string[] = [];
  let id: ScenarioId = "general_reflection";

  if (isRelationshipDecision(normalized)) {
    id = "relationship_decision";
    matchedBy.push("relationship_decision_pattern");
  } else if (isMaterialDecision(normalized, diagnosis)) {
    id = /数字货币|股票|基金|理财|抄底|梭哈|all in/i.test(normalized)
      ? "finance_boundary"
      : "material_decision";
    matchedBy.push("material_risk_decision");
  } else if (
    testAny(normalized, [
      /症状|严重|疼|痛|失眠|疾病|生病|发烧|医院|医生|检查|治疗/,
      /高反|高原反应|拉萨|西藏|海拔|缺氧|呼吸/,
    ])
  ) {
    id = "health_boundary";
    matchedBy.push("health_boundary_terms");
  } else if (testAny(normalized, [/官司|诉讼|律师|法院|起诉|合同纠纷|法律|胜诉|败诉/])) {
    id = "legal_boundary";
    matchedBy.push("legal_boundary_terms");
  } else if (testAny(normalized, [/数字货币|股票|基金|理财|投资|抄底|发财|赚钱|借钱|贷款|预算|现金流/])) {
    id = "finance_boundary";
    matchedBy.push("finance_boundary_terms");
  } else if (
    intent?.domain === "self" ||
    testAny(normalized, [/孤独|分手三个月|大哭|拖延|焦虑|迷茫|空窗期|自我|内耗|难过|怎么处理这种|如何处理.*感/])
  ) {
    id = "emotion_healing";
    matchedBy.push("self_or_emotion_context");
  } else if (
    intent?.domain === "love" ||
    intent?.domain === "relationship" ||
    testAny(normalized, [/关系|感情|恋爱|暧昧|伴侣|对象|对方|复合|分手|喜欢|爱|前任|脱单/])
  ) {
    id = "relationship_reading";
    matchedBy.push("relationship_context");
  } else if (
    intent?.domain === "career" ||
    testAny(normalized, [/老板|VP|报告|职场|职业|事业|工作|跳槽|面试|求职|项目|插画|客户|同事/])
  ) {
    id = "career_work";
    matchedBy.push("career_context");
  } else if (testAny(normalized, [/小说|卡文|创作|灵感|画|插画|写作|作品|素材|修行|灵性/])) {
    id = "creative_exploration";
    matchedBy.push("creative_context");
  } else if (testAny(normalized, [/晚餐|火锅|螺蛳粉|吃什么|排位赛|抢票|演唱会|聚会|宠物|猫|秦始皇/])) {
    id = "light_entertainment";
    matchedBy.push("low_stakes_context");
  } else if (testAny(normalized, [/生命的意义|虚无|宇宙|坐标|人生意义|童年的梦|前世/])) {
    id = "existential_reflection";
    matchedBy.push("existential_context");
  }

  return {
    ...scenarioStrategies[id],
    matchedBy,
  };
}

function positionRole(card: SelectedCardForAnalysis) {
  const text = `${card.position.name}${card.position.focus}`;

  if (/建议|行动|调整|照护|方法/.test(text)) return "advice";
  if (/阻碍|卡点|压力|风险|挑战/.test(text)) return "obstacle";
  if (/隐藏|变量|盲点|潜意识/.test(text)) return "hidden";
  if (/结果|趋势|未来|走向/.test(text)) return "outcome";
  if (/对方|TA|他人|伴侣|对象/.test(text)) return "other";
  if (/自己|我|个人|状态|现状|当前|核心/.test(text)) return "current_state";

  return "general";
}

export function buildScenarioStrategyNotes({
  strategy,
  selectedCards,
}: {
  strategy: ScenarioStrategy;
  selectedCards: SelectedCardForAnalysis[];
}) {
  const cardNotes = selectedCards
    .map((selectedCard) => {
      const role = positionRole(selectedCard);
      const variant = cardScenarioVariants.find(
        (item) =>
          item.cardSlug === selectedCard.card.slug &&
          item.scenario === strategy.id &&
          (item.positions.includes(role) || item.positions.includes("general")),
      );

      if (!variant) return null;

      return `- ${selectedCard.position.name}的${selectedCard.card.nameZh}：${variant.meaning} 避免：${variant.avoid.join("、")}。`;
    })
    .filter((line): line is string => Boolean(line));

  return [
    `场景类型：${strategy.label}（${strategy.id}）。`,
    `匹配依据：${strategy.matchedBy.length ? strategy.matchedBy.join("、") : "默认通用反思"}。`,
    `解释目标：${strategy.goal}`,
    `语气：${strategy.tone.join("、")}。`,
    `必须包含：${strategy.mustInclude.join("；")}。`,
    `必须避免：${strategy.mustAvoid.join("；")}。`,
    `断言强度：${strategy.claimStrength}；降级路径：${strategy.fallback}。`,
    cardNotes.length ? ["本次抽牌的场景化牌义：", ...cardNotes].join("\n") : null,
    `评估维度：${strategy.evalRubric.join("、")}。`,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}
