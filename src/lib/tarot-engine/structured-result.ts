import "server-only";

import { randomUUID } from "node:crypto";

import type { TarotQualityResult } from "./quality-gate";
import type {
  RetrievedCardContext,
  RetrievedPairContext,
  RetrievedQuestionTaxonomy,
  RetrievedSafetyRule,
  TarotEngineContext,
} from "./types";

export type InterpretV2Pipeline =
  | "kb_structured_fallback"
  | "ai_structured_enhanced"
  | "ai_structured_failed_fallback"
  | "ai_structured_quality_fallback";

export type TarotInterpretationV2Result = {
  readingId: string;
  kbVersion: string;
  pipeline: InterpretV2Pipeline;
  question: {
    original: string;
    rewritten?: string;
    domain: string;
    riskLevel?: string;
  };
  spread: {
    spreadId: string;
    name: string;
  };
  cards: Array<{
    cardId: string;
    cardName: string;
    orientation: "upright" | "reversed";
    positionId: string;
    positionName: string;
    meaning: string;
    advice?: string[];
    reflectionQuestions?: string[];
  }>;
  combinations: Array<{
    cardIds: string[];
    cardNames: string[];
    positions: Array<{
      positionOrder: number;
      positionId: string;
      positionName: string;
    }>;
    reason: string;
    summary: string;
  }>;
  reading: {
    opening: string;
    overallTheme: string;
    summary: string;
    closingNote: string;
    advice: string[];
    feedbackQuestions: string[];
  };
  sections: TarotInterpretationV2Section[];
  safety: {
    passed: boolean;
    hits: number;
    note?: string;
  };
  quality: {
    score: number;
    passed: boolean;
    issues: string[];
    checks: Record<string, boolean>;
  };
  debug?: {
    kbHits: {
      contextHits: number;
      pairHits: number;
      questionHits: number;
      safetyHits: number;
      goldenCaseHits: number;
    };
    aiEnhancer?: {
      enabled: boolean;
      eligible: boolean;
      allowedDomains: string[];
      skippedReason?: string;
      durationMs?: number;
      failureReason?: string;
      errorName?: string;
    };
  };
};

export type TarotInterpretationV2Section = {
  id: string;
  title: string;
  source: string;
  body?: string;
  items?: Array<{
    id: string;
    title?: string;
    body: string;
    cardId?: string;
    cardName?: string;
    orientation?: "upright" | "reversed";
    positionId?: string;
    positionName?: string;
    cardIds?: string[];
    cardNames?: string[];
  }>;
};

type BuildKbStructuredResultInput = {
  question: string;
  spreadSlug: string;
  tarotEngineContext: TarotEngineContext;
  quality?: TarotQualityResult;
};

function compactText(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function firstText(...values: unknown[]) {
  return values.map(compactText).find(Boolean) ?? "";
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function getQuestionRewrite(matches: RetrievedQuestionTaxonomy[]) {
  return firstText(
    ...matches
      .filter(({ item, score }) => item.should_rewrite && score >= 8)
      .map(({ item }) => item.rewritten_question),
  );
}

function getRiskLevel(input: {
  questionMatches: RetrievedQuestionTaxonomy[];
  safetyMatches: RetrievedSafetyRule[];
}) {
  return firstText(
    input.safetyMatches[0]?.rule.risk_level,
    input.questionMatches[0]?.item.risk_level,
  );
}

function buildCardMeaning(cardContext: RetrievedCardContext) {
  const positionName =
    cardContext.appPosition?.name ??
    cardContext.contextPositionMeaning?.position_name_cn ??
    cardContext.positionRule?.name_cn ??
    cardContext.kbPositionId;
  const baseMeaning = firstText(
    cardContext.contextPositionMeaning?.position_reading,
    cardContext.contextPositionMeaning?.core_reading,
    cardContext.contextMeaning?.core_reading,
    cardContext.appCard.meaningUpright,
  );

  return `${positionName}的${cardContext.appCard.nameZh}显示：${baseMeaning}`;
}

function buildCardAdvice(cardContext: RetrievedCardContext) {
  return unique([
    firstText(cardContext.contextPositionMeaning?.advice_direction),
    ...((cardContext.contextPositionMeaning?.do_say ?? []).map(compactText)),
  ]).slice(0, 3);
}

function combinationText(pair: RetrievedPairContext, domain: TarotEngineContext["domain"]) {
  const source = pair.curated ?? pair.highFrequency ?? pair.base;

  return firstText(
    source?.[`human_like_${domain}`],
    source?.[domain],
    source?.theme,
    source?.advice,
  );
}

function buildCombinations(context: TarotEngineContext) {
  return context.pairContexts
    .map((pair) => {
      const summary = combinationText(pair, context.domain);
      if (!summary) return null;

      const cardNames =
        pair.curated?.card_names_cn ??
        pair.highFrequency?.card_names_cn ??
        pair.base?.card_names_cn ??
        context.cardContexts
          .filter((card) => card.kbCardId === pair.cardA || card.kbCardId === pair.cardB)
          .sort((a, b) => a.drawnCard.positionOrder - b.drawnCard.positionOrder)
          .map((card) => card.appCard.nameZh);

      return {
        cardIds: [pair.cardA, pair.cardB],
        cardNames: Array.isArray(cardNames) ? cardNames.map(String) : [],
        positions: pair.positions,
        reason: pair.reason,
        summary,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

function buildSafetyNote(context: TarotEngineContext) {
  if (!context.safetyMatches.length) return undefined;

  const specificNote = context.safetyMatches
    .map(({ rule }) => {
      switch (rule.risk_type) {
        case "self_harm_crisis":
        case "self_harm_or_immediate_crisis":
          return "这个问题已经触及即时安全边界，这次不继续做塔罗预测。请立刻联系当地紧急服务、身边可信任的人或专业危机支持。";
        case "death_disaster_prediction":
          return "我不能用塔罗预测死亡、重大意外或灾祸，也不会给出这类确定结论。我们先把问题转成现实安全检查、照护准备和可求助资源。";
        case "privacy_sensitive":
        case "third_party_mind_reading_or_privacy":
          return "这个方向涉及对方隐私和关系边界，我不能支持偷看手机、查聊天记录或替对方内心下结论。可以改为整理你的不安、可观察互动和可以坦诚沟通的边界。";
        case "medical_health":
        case "medical_or_health_advice":
          return "这个问题不能用塔罗判断健康结果。请把医生或专业医疗支持放在第一位，塔罗最多只适合整理压力、照护线索和需要确认的问题。";
        case "legal":
        case "legal_advice_or_case_prediction":
          return "这个问题不能用塔罗判断法律结果或替代律师意见。更适合整理事实、证据、沟通记录和需要咨询专业人士的问题。";
        case "financial_investment":
        case "financial_or_investment_advice":
          return "这个问题不能用塔罗做投资判断或给买卖建议。更适合整理风险承受度、现金流、冲动因素和需要独立核验的信息。";
        default:
          return "";
      }
    })
    .find(Boolean);
  if (specificNote) return specificNote;

  const actions = unique(context.safetyMatches.map(({ rule }) => compactText(rule.action)));
  const fallback = unique(
    context.safetyMatches.map(({ rule }) => compactText(rule.fallback_template)),
  );
  const note = firstText(
    ...fallback,
    ...actions,
    "这个问题命中了高风险边界。塔罗不能替代医生、律师、心理咨询师或其他专业支持，只适合帮助你整理压力、条件和下一步求助顺序。",
  );

  return note.includes("专业") || note.includes("医生") || note.includes("律师")
    ? note
    : `${note} 请优先参考医生、律师、心理咨询师或其他专业支持。`;
}

function isCriticalSafetyMatch(match: RetrievedSafetyRule) {
  return (
    match.rule.risk_level === "critical" ||
    match.rule.risk_type === "self_harm_crisis" ||
    match.rule.risk_type === "self_harm_or_immediate_crisis" ||
    match.rule.risk_type === "death_disaster_prediction"
  );
}

function getCriticalSafetyMatch(context: TarotEngineContext) {
  return context.safetyMatches.find(isCriticalSafetyMatch);
}

function buildCriticalSafetyReading(safetyNote: string): TarotInterpretationV2Result["reading"] {
  const supportActions = [
    "先暂停占卜，把人身安全放在第一位。",
    "现在就联系身边可信任的人，让对方陪你待一会儿或帮你联系现实支持。",
    "如果你可能马上伤害自己，请立刻联系当地紧急服务或专业危机支持。",
  ];

  return {
    opening: safetyNote,
    overallTheme: "这次不继续做塔罗预测，重点是让你先获得现实中的即时支持。",
    summary: safetyNote,
    closingNote: "先不要一个人扛着，请马上把这件事告诉一个能真实陪到你的人。",
    advice: supportActions,
    feedbackQuestions: [],
  };
}

function collectAdvice(cards: TarotInterpretationV2Result["cards"], safetyNote?: string) {
  return unique([
    safetyNote ? "先把现实边界和专业支持放在牌面判断之前。" : "",
    ...cards.flatMap((card) => card.advice ?? []),
    "把这次牌面当成观察框架：先确认一个可验证信号，再决定下一步。",
  ]).slice(0, 6);
}

function buildOpening(input: {
  question: string;
  context: TarotEngineContext;
  cards: TarotInterpretationV2Result["cards"];
  safetyNote?: string;
}) {
  const cardNames = input.cards.map((card) => card.cardName).join("、");
  const rewrite = getQuestionRewrite(input.context.questionMatches);
  const questionLine = input.safetyNote
    ? `这次先把问题降级为安全的观察框架：整理压力、现实条件和下一步求助顺序。`
    : rewrite
      ? `这次先把问题从“${input.question}”调整成“${rewrite}”。`
      : `这次围绕“${input.question}”来看牌面。`;
  const safetyLine = input.safetyNote
    ? "因为问题触及现实高风险边界，解读会先降级为整理条件和求助顺序。"
    : "解读会先看牌位任务，再看牌与牌之间如何互相支持或拉扯。";

  return `${questionLine}${safetyLine}${cardNames ? `本次抽到${cardNames}。` : ""}`;
}

function buildOverallTheme(input: {
  context: TarotEngineContext;
  cards: TarotInterpretationV2Result["cards"];
  combinations: TarotInterpretationV2Result["combinations"];
}) {
  const firstCombination = input.combinations[0]?.summary;
  const primaryCard = input.cards[0];

  if (firstCombination) {
    return `整体主题落在牌间联动：${firstCombination}`;
  }

  if (primaryCard) {
    return `整体主题由${primaryCard.positionName}的${primaryCard.cardName}带出，重点是先把当前状态看清，再决定行动顺序。`;
  }

  return `整体主题落在${input.context.domain}领域的现实确认：先整理信号，再做小步验证。`;
}

function buildSummary(input: {
  context: TarotEngineContext;
  cards: TarotInterpretationV2Result["cards"];
  combinations: TarotInterpretationV2Result["combinations"];
  safetyNote?: string;
}) {
  if (input.safetyNote) {
    return `牌面可以帮助你整理压力和观察顺序，但不适合给出医疗、法律、投资或危机问题的确定结论。请把专业支持放在第一位，再用牌面补充自我观察。`;
  }

  const cardLine = input.cards
    .map((card) => `${card.positionName}的${card.cardName}`)
    .join("、");
  const comboLine = input.combinations[0]?.summary;

  return comboLine
    ? `${cardLine}共同指向一个主题：不要把单张牌孤立理解，而要看它们如何形成当前局面和下一步动作。${comboLine}`
    : `${cardLine}提示你先回到现实信号。重点不是得到绝对答案，而是判断哪里可以推进，哪里需要观察。`;
}

function buildClosingNote(input: {
  cards: TarotInterpretationV2Result["cards"];
  safetyNote?: string;
}) {
  if (input.safetyNote) {
    return "最后给你的提醒：先把现实安全和专业支持放在牌面判断之前。";
  }

  const firstAdvice = input.cards.flatMap((card) => card.advice ?? [])[0];
  if (firstAdvice) {
    return `最后给你的提醒：${firstAdvice}`;
  }

  const firstCard = input.cards[0];
  if (firstCard) {
    return `最后给你的提醒：先看清${firstCard.positionName}里的${firstCard.cardName}正在提示什么，再做一个可验证的小行动。`;
  }

  return "最后给你的提醒：把这次解读当作观察框架，而不是替你下结论。";
}

export function buildStructuredSections(input: {
  reading: TarotInterpretationV2Result["reading"];
  cards: TarotInterpretationV2Result["cards"];
  combinations: TarotInterpretationV2Result["combinations"];
  safety: TarotInterpretationV2Result["safety"];
}): TarotInterpretationV2Section[] {
  const sections: TarotInterpretationV2Section[] = [
    {
      id: "opening",
      title: "牌面先说",
      source: "reading.opening",
      body: input.reading.opening,
    },
    {
      id: "position_readings",
      title: "分位置解读",
      source: "cards",
      items: input.cards.map((card) => ({
        id: `${card.positionId}:${card.cardId}`,
        title: `${card.positionName} - ${card.cardName}`,
        body: card.meaning,
        cardId: card.cardId,
        cardName: card.cardName,
        orientation: card.orientation,
        positionId: card.positionId,
        positionName: card.positionName,
      })),
    },
  ];

  if (input.combinations.length) {
    sections.push({
      id: "combinations",
      title: "牌面联动",
      source: "combinations",
      items: input.combinations.map((combination, index) => ({
        id: `combination-${index + 1}`,
        title: `${combination.reason}: ${combination.cardNames.join(" / ")}`,
        body: combination.summary,
        cardIds: combination.cardIds,
        cardNames: combination.cardNames,
      })),
    });
  }

  if (input.safety.note) {
    sections.push({
      id: "safety",
      title: "边界提醒",
      source: "safety.note",
      body: input.safety.note,
    });
  }

  sections.push(
    {
      id: "overall",
      title: "整体主线",
      source: "reading.overallTheme",
      body: input.reading.overallTheme,
    },
    {
      id: "summary",
      title: "当前结论",
      source: "reading.summary",
      body: input.reading.summary,
    },
    {
      id: "advice",
      title: "下一步建议",
      source: "reading.advice",
      items: input.reading.advice.map((body, index) => ({
        id: `advice-${index + 1}`,
        body,
      })),
    },
    {
      id: "closing_note",
      title: "最后给你的提醒",
      source: "reading.closingNote",
      body: input.reading.closingNote,
    },
  );

  return sections.filter(
    (section) =>
      Boolean(section.body?.trim()) || Boolean(section.items?.some((item) => item.body.trim())),
  );
}

export function buildKbStructuredResult(
  input: BuildKbStructuredResultInput,
): TarotInterpretationV2Result {
  const context = input.tarotEngineContext;
  const safetyNote = buildSafetyNote(context);
  const criticalSafetyMatch = getCriticalSafetyMatch(context);
  const isCriticalSafety = Boolean(criticalSafetyMatch && safetyNote);
  const cards = isCriticalSafety ? [] : context.cardContexts.map((cardContext) => ({
    cardId: cardContext.appCard.id,
    cardName: cardContext.appCard.nameZh,
    orientation: cardContext.orientation,
    positionId: cardContext.kbPositionId,
    positionName:
      cardContext.appPosition?.name ??
      cardContext.contextPositionMeaning?.position_name_cn ??
      cardContext.positionRule?.name_cn ??
      cardContext.kbPositionId,
    meaning: buildCardMeaning(cardContext),
    advice: buildCardAdvice(cardContext),
    reflectionQuestions: [],
  }));
  const combinations = isCriticalSafety ? [] : buildCombinations(context);
  const safety = {
    passed: true,
    hits: context.safetyMatches.length,
    note: safetyNote,
  };
  const reading = isCriticalSafety && safetyNote
    ? buildCriticalSafetyReading(safetyNote)
    : {
        opening: buildOpening({
          question: input.question,
          context,
          cards,
          safetyNote,
        }),
        overallTheme: buildOverallTheme({ context, cards, combinations }),
        summary: buildSummary({ context, cards, combinations, safetyNote }),
        closingNote: buildClosingNote({ cards, safetyNote }),
        advice: collectAdvice(cards, safetyNote),
        feedbackQuestions: [],
      };

  return {
    readingId: randomUUID(),
    kbVersion: context.kbVersion,
    pipeline: "kb_structured_fallback",
    question: {
      original: input.question,
      rewritten: getQuestionRewrite(context.questionMatches) || undefined,
      domain: context.domain,
      riskLevel:
        getRiskLevel({
          questionMatches: context.questionMatches,
          safetyMatches: context.safetyMatches,
        }) || undefined,
    },
    spread: {
      spreadId: context.spread?.spread_id ?? input.spreadSlug,
      name: context.spread?.name_cn ?? input.spreadSlug,
    },
    cards,
    combinations,
    reading,
    sections: buildStructuredSections({ reading, cards, combinations, safety }),
    safety,
    quality: {
      score: input.quality?.score ?? 0,
      passed: input.quality?.passed ?? false,
      issues: input.quality?.issues ?? [],
      checks: input.quality?.checks ?? {},
    },
    debug: {
      kbHits: {
        contextHits: context.cardContexts.length,
        pairHits: context.pairContexts.length,
        questionHits: context.questionMatches.length,
        safetyHits: context.safetyMatches.length,
        goldenCaseHits: context.goldenCases.length,
      },
    },
  };
}

export function renderStructuredResultForQuality(result: TarotInterpretationV2Result) {
  return [
    result.question.rewritten,
    result.reading.opening,
    result.reading.overallTheme,
    result.reading.closingNote,
    ...result.cards.map(
      (card) =>
        `${card.positionName}：${card.cardName}。${card.meaning}${card.advice?.length ? ` 建议：${card.advice.join("；")}` : ""}`,
    ),
    ...result.combinations.map(
      (combination) => `组合：${combination.cardNames.join("、")}。${combination.summary}`,
    ),
    result.reading.summary,
    result.safety.note ? `安全边界：${result.safety.note}` : "",
    `行动建议：${result.reading.advice.join("；")}`,
  ]
    .filter(Boolean)
    .join("\n");
}
