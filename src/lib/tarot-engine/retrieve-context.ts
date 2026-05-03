import { getCardById, getSpreadBySlug } from "@/lib/tarot/catalog";
import type { ReadingIntent, SpreadDefinition, TarotCard } from "@/lib/tarot/types";
import { loadTarotKb } from "@/lib/tarot-kb/loader";
import {
  getCardContext,
  getCardPositionContext,
  getCombinationContext,
} from "@/lib/tarot-kb/query";
import type { GoldenCase, TarotKb } from "@/lib/tarot-kb/types";

import type {
  RetrievedGoldenCase,
  RetrievedQuestionTaxonomy,
  RetrievedSafetyRule,
  RetrievedPairContext,
  TarotEngineContext,
  TarotEngineInput,
  TarotKbDomain,
} from "./types";

const spreadSlugToKbSpreadId: Record<string, string> = {
  "single-guidance": "single_card_daily",
  "career-five": "career_5",
  "three-card": "three_state_obstacle_advice",
  "relationship-six": "love_5",
  "lovers-pyramid": "three_self_relation_other",
  "path-of-choice": "three_option_a_b_advice",
  "self-state": "self_exploration_5",
};

const explicitPositionMap: Record<string, Record<number, string>> = {
  "single-guidance": {
    1: "advice",
  },
  "career-five": {
    1: "current_state",
    2: "obstacle",
    3: "strength",
    4: "near_future_trend",
    5: "advice",
  },
  "three-card": {
    1: "external_influence",
    2: "current_state",
    3: "near_future_trend",
  },
  "cross-five": {
    1: "current_state",
    2: "external_influence",
    3: "current_state",
    4: "near_future_trend",
    5: "obstacle",
  },
  "relationship-six": {
    1: "self_state",
    2: "other_person_state",
    3: "relationship_dynamic",
    4: "obstacle",
    5: "near_future_trend",
    6: "advice",
  },
  "lovers-pyramid": {
    1: "self_state",
    2: "other_person_state",
    3: "relationship_dynamic",
    4: "near_future_trend",
  },
  "path-of-choice": {
    1: "option_a",
    2: "outcome",
    3: "option_b",
    4: "outcome",
    5: "external_influence",
    6: "advice",
    7: "outcome",
  },
  "self-state": {
    1: "current_state",
    2: "inner_need",
    3: "obstacle",
    4: "strength",
    5: "advice",
  },
  "celtic-cross": {
    1: "current_state",
    2: "obstacle",
    3: "external_influence",
    4: "inner_need",
    5: "external_influence",
    6: "near_future_trend",
    7: "self_state",
    8: "external_influence",
    9: "inner_need",
    10: "outcome",
  },
};

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeQuestion(value: string) {
  return value
    .toLowerCase()
    .replace(/[？?！!。.,，；;：:\s]/g, "")
    .replace(/妳/g, "你")
    .replace(/祂/g, "他")
    .replace(/她/g, "他")
    .replace(/ta/g, "他")
    .trim();
}

function resolveKbDomain(input: {
  question: string;
  spreadSlug: string;
  readingIntent?: ReadingIntent;
}): TarotKbDomain {
  switch (input.readingIntent?.domain) {
    case "love":
    case "relationship":
      return "love";
    case "career":
    case "study":
      return "career";
    case "self":
      return "self_state";
    case "decision":
      return "decision";
    default:
      break;
  }

  if (/relationship|lovers/.test(input.spreadSlug)) return "love";
  if (/career/.test(input.spreadSlug)) return "career";
  if (/choice|path/.test(input.spreadSlug)) return "decision";
  if (/self/.test(input.spreadSlug)) return "self_state";

  if (/感情|喜欢|复合|暧昧|关系|对方|TA|他|她/.test(input.question)) return "love";
  if (/事业|工作|离职|跳槽|面试|职业|项目|offer/i.test(input.question)) return "career";
  if (/要不要|该不该|选择|选A|选 B|还是/.test(input.question)) return "decision";

  return "self_state";
}

function buildKbCardIdByAppCard(kb: TarotKb) {
  const byNameEn = new Map(
    [...kb.cardsById.values()].map((card) => [normalizeName(card.name_en), card.card_id]),
  );

  return (card: TarotCard) =>
    kb.cardsById.has(card.id) ? card.id : byNameEn.get(normalizeName(card.nameEn)) ?? null;
}

function resolveKbPositionId(input: {
  spreadSlug: string;
  positionOrder: number;
  position?: SpreadDefinition["positions"][number] | null;
}) {
  const explicit = explicitPositionMap[input.spreadSlug]?.[input.positionOrder];
  if (explicit) return explicit;

  const source = `${input.position?.name ?? ""} ${input.position?.focus ?? ""}`;

  if (/阻碍|压力|卡点|干扰/.test(source)) return "obstacle";
  if (/建议|调整|行动|方向|提醒/.test(source)) return "advice";
  if (/优势|资源|能力|帮助/.test(source)) return "strength";
  if (/未来|近期|发展|趋势|走向/.test(source)) return "near_future_trend";
  if (/结果|总结|落点/.test(source)) return "outcome";
  if (/对方|TA/.test(source)) return "other_person_state";
  if (/关系|连接|互动/.test(source)) return "relationship_dynamic";
  if (/内在|需求|情绪|希望|担心/.test(source)) return "inner_need";
  if (/环境|外部|他人/.test(source)) return "external_influence";
  if (/选 A|路径 A|A /.test(source)) return "option_a";
  if (/选 B|路径 B|B /.test(source)) return "option_b";
  if (/我|自己|个人|用户/.test(source)) return "self_state";

  return "current_state";
}

function parseGoldenCaseCardIds(item: GoldenCase) {
  return new Set(
    (item.cards ?? [])
      .map((card) => card.replace(/_(upright|reversed)$/u, ""))
      .filter(Boolean),
  );
}

function retrieveGoldenCases(input: {
  kb: TarotKb;
  domain: TarotKbDomain;
  appSpreadSlug: string;
  kbSpreadId: string | null;
  cardIds: string[];
  limit: number;
}): RetrievedGoldenCase[] {
  const drawnCardIds = new Set(input.cardIds);
  const scored = input.kb.goldenCases.map((item) => {
    let score = 0;

    if (item.domain === input.domain) score += 3;
    if (item.spread_id && item.spread_id === input.kbSpreadId) score += 2;

    const caseCardIds = parseGoldenCaseCardIds(item);
    for (const cardId of caseCardIds) {
      if (drawnCardIds.has(cardId)) score += 1;
    }

    if (input.appSpreadSlug.includes("relationship") && item.domain === "love") score += 1;
    if (item.risk_level === "medium" && input.domain === "love") score += 1;

    return { case: item, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, input.limit);
}

function retrieveQuestionMatches(input: {
  kb: TarotKb;
  question: string;
  domain: TarotKbDomain;
  limit: number;
}): RetrievedQuestionTaxonomy[] {
  const normalizedQuestion = normalizeQuestion(input.question);
  const scored = input.kb.questionTaxonomy.map((item) => {
    const normalizedRaw = normalizeQuestion(
      typeof item.normalized_question === "string" ? item.normalized_question : item.raw_question,
    );
    let score = 0;

    if (normalizedQuestion && normalizedRaw) {
      if (normalizedQuestion === normalizedRaw) score += 12;
      else if (normalizedQuestion.includes(normalizedRaw) || normalizedRaw.includes(normalizedQuestion)) {
        score += 8;
      }
    }

    if (item.domain === input.domain) score += 3;
    if (Array.isArray(item.query_tags)) {
      for (const tag of item.query_tags) {
        if (typeof tag === "string" && normalizedQuestion.includes(normalizeQuestion(tag))) {
          score += 1;
        }
      }
    }

    return { item, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, input.limit);
}

function retrieveSafetyMatches(input: { kb: TarotKb; question: string }): RetrievedSafetyRule[] {
  const normalizedQuestion = normalizeQuestion(input.question);
  const broadRiskPatterns: Record<string, RegExp[]> = {
    medical_health: [/病|癌症|怀孕|症状|恶化|严重|医生|医院|治疗|能活多久/u],
    legal: [/官司|诉讼|起诉|合同|律师|坐牢|判刑|违法/u],
    financial_investment: [/股票|基金|投资|币|理财|彩票|收益|赚钱|亏钱|买入|买|卖出|加仓|梭哈/u],
    self_harm_crisis: [/不想活|自杀|轻生|伤害自己|活不下去/u],
    death_disaster: [/死亡|死|灾祸|灾难|车祸|意外/u],
    privacy_invasion: [/偷看|监听|查.*手机|查.*聊天|隐私|跟踪/u],
  };

  return input.kb.safetyRules
    .map((rule) => {
      const matchedTriggers = rule.trigger_examples.filter((example) => {
        const normalizedExample = normalizeQuestion(example);
        return (
          normalizedQuestion.includes(normalizedExample) ||
          normalizedExample.includes(normalizedQuestion)
        );
      });
      const broadMatches =
        broadRiskPatterns[rule.risk_type]
          ?.filter((pattern) => pattern.test(input.question))
          .map((pattern) => `pattern:${pattern.source}`) ?? [];

      return { rule, matchedTriggers: [...matchedTriggers, ...broadMatches] };
    })
    .filter((item) => item.matchedTriggers.length > 0);
}

function buildPairContexts(input: { kb: TarotKb; cardIds: string[] }) {
  const pairContexts: RetrievedPairContext[] = [];

  for (let i = 0; i < input.cardIds.length; i += 1) {
    for (let j = i + 1; j < input.cardIds.length; j += 1) {
      const cardA = input.cardIds[i];
      const cardB = input.cardIds[j];
      if (!cardA || !cardB) continue;

      const context = getCombinationContext({ kb: input.kb, cardA, cardB });

      if (context.curated || context.highFrequency || context.base) {
        pairContexts.push({
          cardA,
          cardB,
          curated: context.curated ?? null,
          highFrequency: context.highFrequency ?? null,
          base: context.base ?? null,
        });
      }
    }
  }

  return pairContexts;
}

export async function retrieveTarotEngineContext(
  input: TarotEngineInput,
): Promise<TarotEngineContext> {
  const kb = await loadTarotKb();
  const appSpread = getSpreadBySlug(input.spreadSlug);
  const kbSpreadId = spreadSlugToKbSpreadId[input.spreadSlug] ?? null;
  const kbSpread = kbSpreadId ? kb.spreadsById.get(kbSpreadId) ?? null : null;
  const resolveKbCardId = buildKbCardIdByAppCard(kb);
  const domain = resolveKbDomain({
    question: input.question,
    spreadSlug: input.spreadSlug,
    readingIntent: input.readingIntent,
  });
  const missing: string[] = [];
  const kbCardIds: string[] = [];

  const cardContexts = input.cards
    .map((drawnCard) => {
      const appCard = getCardById(drawnCard.cardId);
      const appPosition =
        appSpread?.positions.find((position) => position.order === drawnCard.positionOrder) ?? null;

      if (!appCard) {
        missing.push(`card:${drawnCard.cardId}`);
        return null;
      }

      const kbCardId = resolveKbCardId(appCard);
      if (!kbCardId) {
        missing.push(`kb-card:${appCard.nameEn}`);
        return null;
      }

      kbCardIds.push(kbCardId);
      const orientation = drawnCard.reversed ? ("reversed" as const) : ("upright" as const);
      const kbPositionId = resolveKbPositionId({
        spreadSlug: input.spreadSlug,
        positionOrder: drawnCard.positionOrder,
        position: appPosition,
      });
      const contextMeaning =
        getCardContext({
          kb,
          cardId: kbCardId,
          orientation,
          domain,
        }) ?? null;
      const contextPositionMeaning =
        getCardPositionContext({
          kb,
          cardId: kbCardId,
          orientation,
          domain,
          positionId: kbPositionId,
        }) ?? null;

      if (!contextMeaning) missing.push(`ctxp:${kbCardId}:${orientation}:${domain}`);
      if (!contextPositionMeaning) {
        missing.push(`ctx:${kbCardId}:${orientation}:${domain}:${kbPositionId}`);
      }

      return {
        drawnCard,
        appCard,
        kbCardId,
        orientation,
        appPosition,
        kbPositionId,
        positionRule: kb.positionsById.get(kbPositionId) ?? null,
        contextMeaning,
        contextPositionMeaning,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const pairContexts = buildPairContexts({ kb, cardIds: kbCardIds });
  const questionMatches = retrieveQuestionMatches({
    kb,
    question: input.question,
    domain,
    limit: 3,
  });
  const safetyMatches = retrieveSafetyMatches({ kb, question: input.question });
  const goldenCases = retrieveGoldenCases({
    kb,
    domain,
    appSpreadSlug: input.spreadSlug,
    kbSpreadId,
    cardIds: kbCardIds,
    limit: 3,
  });
  const contextIds = [
    ...cardContexts.flatMap((item) =>
      [
        item.contextPositionMeaning?.id,
        item.contextMeaning?.profile_id,
        item.positionRule?.position_id ? `pos::${item.positionRule.position_id}` : null,
      ].filter((value): value is string => Boolean(value)),
    ),
    ...pairContexts
      .map((item) => item.curated?.combo_id ?? item.highFrequency?.combo_id ?? item.base?.combo_id)
      .filter((value): value is string => Boolean(value)),
    ...goldenCases.map((item) => item.case.case_id),
  ];

  return {
    kbVersion: kb.manifest.version,
    domain,
    spread: kbSpread,
    questionMatches,
    safetyMatches,
    cardContexts,
    pairContexts,
    goldenCases,
    contextIds,
    missing,
  };
}
