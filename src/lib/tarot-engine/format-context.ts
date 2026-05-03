import type {
  RetrievedCardContext,
  RetrievedPairContext,
  TarotEngineContext,
} from "./types";

function oneLine(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function formatCardContext(item: RetrievedCardContext) {
  const orientationLabel = item.orientation === "upright" ? "正位" : "逆位";
  const positionName = item.appPosition?.name ?? item.contextPositionMeaning?.position_name_cn ?? "牌位";
  const precise = item.contextPositionMeaning;
  const profile = item.contextMeaning;
  const rule = item.positionRule;
  const doSay = Array.isArray(precise?.do_say) ? precise.do_say.slice(0, 2).join("；") : "";
  const doNotSay = Array.isArray(precise?.do_not_say)
    ? precise.do_not_say.slice(0, 4).join("；")
    : "";

  return [
    `### ${positionName}：${item.appCard.nameZh}（${orientationLabel}）`,
    `KB键：${item.kbCardId} / ${item.orientation} / ${item.kbPositionId}`,
    precise ? `位置感读法：${oneLine(precise.position_reading)}` : null,
    precise?.advice_direction ? `建议方向：${oneLine(precise.advice_direction)}` : null,
    profile ? `场景核心：${oneLine(profile.core_reading)}` : null,
    rule ? `牌位语法：${oneLine(rule.interpretation_rule)}；${oneLine(rule.function)}` : null,
    doSay ? `推荐表达：${doSay}` : null,
    doNotSay ? `禁止说法：${doNotSay}` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

function formatPairContext(item: RetrievedPairContext, domain: TarotEngineContext["domain"]) {
  const source = item.curated ?? item.highFrequency ?? item.base;
  if (!source) return null;

  const humanLike =
    domain === "love"
      ? oneLine(source.human_like_love)
      : domain === "career"
        ? oneLine(source.human_like_career)
        : domain === "decision"
          ? oneLine(source.human_like_decision)
          : oneLine(source.human_like_self);
  const domainReading = oneLine(source[domain]);

  return [
    `### ${source.card_names_cn?.join(" + ") ?? `${item.cardA} + ${item.cardB}`}`,
    `组合ID：${source.combo_id}`,
    source.theme ? `主题：${oneLine(source.theme)}` : null,
    humanLike ? `真人式表达参考：${humanLike}` : null,
    domainReading ? `场景解释：${domainReading}` : null,
    source.advice ? `组合建议：${oneLine(source.advice)}` : null,
    Array.isArray(source.avoid) ? `组合禁区：${source.avoid.slice(0, 3).join("；")}` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

export function formatTarotEngineContext(context: TarotEngineContext) {
  const cardBlocks = context.cardContexts.map(formatCardContext);
  const questionBlocks = context.questionMatches.map(({ item, score }) =>
    [
      `### ${item.id} / score=${score}`,
      `原问题样本：${oneLine(item.raw_question)}`,
      `分类：${item.domain} / ${item.intent} / ${item.risk_level}`,
      item.should_rewrite ? `安全改写：${oneLine(item.rewritten_question)}` : null,
      item.recommended_spread ? `推荐牌阵：${item.recommended_spread}` : null,
      Array.isArray(item.allowed) ? `允许：${item.allowed.slice(0, 4).join("；")}` : null,
      Array.isArray(item.forbidden) ? `禁止：${item.forbidden.slice(0, 4).join("；")}` : null,
    ]
      .filter((line): line is string => Boolean(line))
      .join("\n"),
  );
  const safetyBlocks = context.safetyMatches.map(({ rule, matchedTriggers }) =>
    [
      `### ${rule.risk_type} / ${rule.risk_level}`,
      `命中样本：${matchedTriggers.join("；")}`,
      `动作：${rule.action}`,
      Array.isArray(rule.forbidden) ? `禁止：${rule.forbidden.slice(0, 5).join("；")}` : null,
      rule.fallback_template ? `兜底模板：${oneLine(rule.fallback_template)}` : null,
    ]
      .filter((line): line is string => Boolean(line))
      .join("\n"),
  );
  const pairBlocks = context.pairContexts
    .slice(0, 6)
    .map((item) => formatPairContext(item, context.domain))
    .filter((item): item is string => Boolean(item));
  const caseBlocks = context.goldenCases.map(({ case: item, score }) =>
    [
      `### ${item.case_id} / score=${score}`,
      `问题：${oneLine(item.question)}`,
      item.rewritten_question ? `安全改写：${oneLine(item.rewritten_question)}` : null,
      item.good_answer ? `好案例：${oneLine(item.good_answer)}` : null,
      Array.isArray(item.why_good) ? `好在哪里：${item.why_good.slice(0, 3).join("；")}` : null,
      Array.isArray(item.why_bad) ? `避免问题：${item.why_bad.slice(0, 3).join("；")}` : null,
    ]
      .filter((line): line is string => Boolean(line))
      .join("\n"),
  );

  return [
    `## TAROT_KB_V0_2 | domain=${context.domain} | version=${context.kbVersion}`,
    context.spread
      ? `牌阵映射：${context.spread.name_cn}（${context.spread.spread_id}）`
      : "牌阵映射：未命中 KB 牌阵，仍使用单牌/组合资料。",
    questionBlocks.length ? "\n## 问题路由资料" : null,
    ...questionBlocks,
    safetyBlocks.length ? "\n## 安全边界资料" : null,
    ...safetyBlocks,
    "",
    "## 单牌与牌位精细资料",
    ...cardBlocks,
    pairBlocks.length ? "\n## 组合牌资料" : null,
    ...pairBlocks,
    caseBlocks.length ? "\n## Golden Cases 参考" : null,
    ...caseBlocks,
    context.missing.length ? `\n## 缺失项\n${context.missing.slice(0, 20).join("\n")}` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n\n");
}
