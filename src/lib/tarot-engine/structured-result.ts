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
    summary: string;
  }>;
  reading: {
    opening: string;
    overallTheme: string;
    summary: string;
    advice: string[];
    feedbackQuestions: string[];
  };
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
  };
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

function buildReflectionQuestions(cardContext: RetrievedCardContext) {
  const positionName =
    cardContext.appPosition?.name ??
    cardContext.contextPositionMeaning?.position_name_cn ??
    cardContext.positionRule?.name_cn ??
    "这个位置";
  const keyword =
    cardContext.appCard.keywordsUpright[0] ??
    cardContext.appCard.keywordsReversed[0] ??
    cardContext.appCard.nameZh;

  return [
    `这张${cardContext.appCard.nameZh}让你最有感觉的是哪一部分？`,
    `放在${positionName}里，你现在最想先确认的现实信号是什么？`,
    `如果围绕“${keyword}”做一个小调整，今天可以从哪里开始？`,
  ];
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
          .map((card) => card.appCard.nameZh);

      return {
        cardIds: [pair.cardA, pair.cardB],
        cardNames: Array.isArray(cardNames) ? cardNames.map(String) : [],
        summary,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

function buildSafetyNote(context: TarotEngineContext) {
  if (!context.safetyMatches.length) return undefined;

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

function collectAdvice(cards: TarotInterpretationV2Result["cards"], safetyNote?: string) {
  return unique([
    safetyNote ? "先把现实边界和专业支持放在牌面判断之前。" : "",
    ...cards.flatMap((card) => card.advice ?? []),
    "把这次牌面当成观察框架：先确认一个可验证信号，再决定下一步。",
  ]).slice(0, 6);
}

function collectFeedbackQuestions(cards: TarotInterpretationV2Result["cards"]) {
  return unique(
    cards.flatMap((card) => card.reflectionQuestions ?? []),
  ).slice(0, 5);
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

export function buildKbStructuredResult(
  input: BuildKbStructuredResultInput,
): TarotInterpretationV2Result {
  const context = input.tarotEngineContext;
  const safetyNote = buildSafetyNote(context);
  const cards = context.cardContexts.map((cardContext) => ({
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
    reflectionQuestions: buildReflectionQuestions(cardContext),
  }));
  const combinations = buildCombinations(context);
  const opening = buildOpening({
    question: input.question,
    context,
    cards,
    safetyNote,
  });
  const overallTheme = buildOverallTheme({ context, cards, combinations });
  const summary = buildSummary({ context, cards, combinations, safetyNote });
  const advice = collectAdvice(cards, safetyNote);
  const feedbackQuestions = collectFeedbackQuestions(cards);

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
    reading: {
      opening,
      overallTheme,
      summary,
      advice,
      feedbackQuestions,
    },
    safety: {
      passed: true,
      hits: context.safetyMatches.length,
      note: safetyNote,
    },
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
