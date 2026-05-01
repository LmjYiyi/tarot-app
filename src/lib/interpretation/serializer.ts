import type { InterpretationPlan } from "./plan";

function listOrFallback(items: string[], fallback: string) {
  return items.length ? items.join("\n") : fallback;
}

export function serializeInterpretationPlan(plan: InterpretationPlan) {
  const { generalAnalysis, grammarAnalysis, questionDiagnosis, template } = plan;

  return [
    `牌阵模板：${template.slug}`,
    `模板目的：${template.purpose}`,
    `模板重点：${template.instruction}`,
    "",
    "通用结构分析：",
    `- 大阿卡纳比例：${generalAnalysis.arcanaProfile.majorCount} 张大阿卡纳 / ${generalAnalysis.arcanaProfile.minorCount} 张小阿卡纳；事件层级=${generalAnalysis.arcanaProfile.eventLevel}。${generalAnalysis.arcanaProfile.note}`,
    `- 花色分布：圣杯 ${generalAnalysis.suitProfile.counts.cups}、权杖 ${generalAnalysis.suitProfile.counts.wands}、宝剑 ${generalAnalysis.suitProfile.counts.swords}、星币 ${generalAnalysis.suitProfile.counts.pentacles}。${generalAnalysis.suitProfile.note}`,
    `- 逆位状态：${generalAnalysis.reversedProfile.count} 张逆位；模式=${generalAnalysis.reversedProfile.mode}。${generalAnalysis.reversedProfile.note}`,
    `- 数字阶段：${generalAnalysis.numberStage.stageHint}`,
    `- 时间尺度：默认观察窗口=${grammarAnalysis.timeScope.defaultWindow}；验证窗口=${grammarAnalysis.timeScope.observationWindow}。${grammarAnalysis.timeScope.note}`,
    "",
    "牌位权重：",
    listOrFallback(
      grammarAnalysis.weightedPositions.map(
        (position) =>
          `- 位置 ${position.order}「${position.positionName}」=${position.cardName}（${position.orientation}）：权重=${position.weight}；角色=${position.role}。${position.note}`,
      ),
      "无结构化牌位权重。",
    ),
    "",
    "花色/元素动态：",
    listOrFallback(
      [
        ...grammarAnalysis.suitDynamics.interactions.map((item) => `- ${item.note}`),
        ...grammarAnalysis.suitDynamics.missingNotes.map((item) => `- ${item.note}`),
      ],
      "无明显花色互动或缺失花色线索。",
    ),
    "",
    "牌组模式：",
    listOrFallback(
      grammarAnalysis.patterns.map((pattern) => `- ${pattern.type}：${pattern.note}`),
      "无明显牌组模式；以牌位主线为主。",
    ),
    "",
    "宫廷牌线索：",
    listOrFallback(
      grammarAnalysis.courtRoles.map(
        (card) =>
          `- ${card.cardName}（${card.positionName}，${card.orientation}）：${[
            card.archetype,
            card.rankRole,
            card.suitRole,
            card.roleHint,
            card.caution,
          ].join("；")}`,
      ),
      "无明显宫廷牌人物/角色线索。",
    ),
    "",
    "大阿卡纳叙事链：",
    listOrFallback(
      grammarAnalysis.majorArcanaChains.map(
        (chain) => `- ${chain.cards.join(" + ")}：${chain.note}注意：${chain.caution}`,
      ),
      "无命中的预设大阿卡纳叙事链；若大牌较多，仍需按牌位串联故事。",
    ),
    "",
    "逆位牌位语法：",
    listOrFallback(
      grammarAnalysis.reversalNotes.map((note) => `- ${note.type}：${note.note}`),
      "无逆位语法提示。",
    ),
    "",
    "互相支撑的牌：",
    listOrFallback(generalAnalysis.relationPairs.support.map((item) => `- ${item}`), "未发现强支撑关系；写作时以牌位主线为主。"),
    "",
    "互相抵消或拉扯的牌：",
    listOrFallback(generalAnalysis.relationPairs.tension.map((item) => `- ${item}`), "未发现强抵消关系；写作时保持整合表达。"),
    "",
    "牌阵专属结构笔记：",
    listOrFallback(plan.spreadSpecificNotes.map((item) => `- ${item}`), "无额外牌阵专属笔记。"),
    "",
    "用户问题诊断：",
    questionDiagnosis.issues.length
      ? [
          `- 风险等级：${questionDiagnosis.riskLevel}`,
          ...questionDiagnosis.issues.map((issue) => `- ${issue}`),
          ...questionDiagnosis.safetyDirectives.map((directive) => `- 安全策略：${directive}`),
          questionDiagnosis.suggestedReframe
            ? `- 建议在解读中温和改写为：${questionDiagnosis.suggestedReframe}`
            : null,
        ]
          .filter((line): line is string => Boolean(line))
          .join("\n")
      : "- 问题方向基本可读，仍需避免绝对预言。",
    "",
    "模板牌位规则：",
    ...template.positionRules.map((rule) => `- ${rule}`),
    "",
    "模板关系规则：",
    ...template.relationRules.map((rule) => `- ${rule}`),
    "",
    "禁止写法：",
    ...template.forbiddenPatterns.map((rule) => `- ${rule}`),
  ].join("\n");
}
