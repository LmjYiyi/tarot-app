import { getCardById, getSpreadBySlug } from "@/lib/tarot/catalog";
import {
  getResearchCardEvidence,
  loadResearchDatasets,
  type ResearchSafetyRule,
} from "@/lib/research-datasets/loader";
import type { ReadingIntent, SpreadDefinition, TarotCard } from "@/lib/tarot/types";
import { loadTarotKb } from "@/lib/tarot-kb/loader";
import {
  getCardContext,
  getCardPositionContext,
  getCombinationContext,
} from "@/lib/tarot-kb/query";
import type { GoldenCase, TarotKb } from "@/lib/tarot-kb/types";

import type {
  RetrievedCardContext,
  RetrievedGoldenCase,
  RetrievedQuestionTaxonomy,
  RetrievedSafetyRule,
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
  if (!normalizedQuestion) return [];

  const broadRiskPatterns: Record<string, RegExp[]> = {
    medical_health: [/病|癌症|怀孕|症状|恶化|严重|医生|医院|治疗|能活多久/u],
    legal: [/官司|诉讼|起诉|合同|律师|坐牢|判刑|违法/u],
    financial_investment: [
      /股票|基金|投资|币|理财|彩票|收益|赚钱|亏钱|买入|买|卖出|加仓|梭哈/u,
      /全仓|重仓|all\s*-?\s*in|所有钱|全部钱|存款|投进去/u,
    ],
    self_harm_crisis: [/不想活|自杀|轻生|伤害自己|活不下去/u],
    death_disaster_prediction: [/死亡|会不会死|死不死|重大意外|出.*意外|灾祸|灾难|车祸|出事/u],
    privacy_sensitive: [/偷看|偷偷看|翻.*手机|查.*手机|看.*手机|查.*聊天|聊天记录|监听|隐私|跟踪/u],
  };

  return input.kb.safetyRules
    .map((rule) => {
      const matchedTriggers = rule.trigger_examples.filter((example) => {
        const normalizedExample = normalizeQuestion(example);
        if (!normalizedExample) return false;
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

function retrieveResearchSafetyMatches(input: { question: string }): RetrievedSafetyRule[] {
  const normalizedQuestion = normalizeQuestion(input.question);
  if (!normalizedQuestion) return [];

  const bundle = loadResearchDatasets();
  const broadRiskPatterns: Record<string, RegExp[]> = {
    medical_or_health_advice: [/病|癌症|怀孕|症状|恶化|严重|医生|医院|治疗|手术|吃药|疼痛|失眠/u],
    legal_advice_or_case_prediction: [/法院|官司|诉讼|起诉|胜诉|败诉|律师|合同|判决/u],
    financial_or_investment_advice: [
      /股票|基金|数字货币|抄底|梭哈|贷款|借钱|买房|投资|收益/u,
      /全仓|重仓|all\s*-?\s*in|所有钱|全部钱|存款|投进去/u,
    ],
    self_harm_or_immediate_crisis: [/不想活|自杀|自残|轻生|伤害自己|结束生命|撑不下去/u],
    third_party_mind_reading_or_privacy: [
      /他怎么想|她怎么想|TA怎么想|对方心里|是不是有别人|爱不爱我/u,
      /偷看|偷偷看|翻.*手机|查.*手机|看.*手机|查.*聊天|聊天记录|监听|隐私|跟踪/u,
    ],
    absolute_or_precise_prediction: [
      /一定|必然|注定|百分百|具体哪天|什么时候会/u,
      /会不会死|死不死|什么时候死|哪天死|重大意外|出.*意外/u,
    ],
  };

  return bundle.safetyRules
    .map((rule) => {
      const matchedTriggers = rule.triggers.filter((trigger) => {
        const normalizedTrigger = normalizeQuestion(trigger);
        if (!normalizedTrigger) return false;
        return (
          normalizedQuestion.includes(normalizedTrigger) ||
          normalizedTrigger.includes(normalizedQuestion)
        );
      });
      const broadMatches =
        broadRiskPatterns[rule.riskType]
          ?.filter((pattern) => pattern.test(input.question))
          .map((pattern) => `source-dataset-pattern:${pattern.source}`) ?? [];

      return {
        rule: mapResearchSafetyRule(rule),
        matchedTriggers: [
          ...matchedTriggers.map((trigger) => `source-dataset:${trigger}`),
          ...broadMatches,
        ],
      };
    })
    .filter((item) => item.matchedTriggers.length > 0);
}

function mapResearchSafetyRule(rule: ResearchSafetyRule): RetrievedSafetyRule["rule"] {
  return {
    risk_type: rule.riskType,
    risk_level: rule.riskLevel,
    trigger_examples: rule.triggers,
    action: rule.requiredResponse.join("；"),
    forbidden: rule.forbidden,
    fallback_template:
      rule.riskLevel === "critical"
        ? "这个问题已经触及即时安全边界，这次不继续做塔罗预测。请立刻联系当地紧急服务、身边可信任的人或专业危机支持。"
        : `这个问题触及${rule.riskType}边界，塔罗不能替代专业判断；我会把它转成风险、条件和下一步现实支持来整理。`,
    source_dataset_rule_id: rule.id,
    source_ids: rule.sourceIds,
    backend_hard_control: rule.backendHardControl,
  };
}

function mergeSafetyMatches(
  kbMatches: RetrievedSafetyRule[],
  researchMatches: RetrievedSafetyRule[],
) {
  const seen = new Set<string>();

  return [...researchMatches, ...kbMatches].filter((match) => {
    const key = match.rule.risk_type;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getPairPositionName(card: RetrievedCardContext) {
  return (
    card.appPosition?.name ??
    card.contextPositionMeaning?.position_name_cn ??
    card.positionRule?.name_cn ??
    card.kbPositionId
  );
}

function buildPairCandidate(input: {
  cards: RetrievedCardContext[];
  reason: string;
  priority: number;
}) {
  const [first, second] = input.cards
    .filter(Boolean)
    .sort((a, b) => a.drawnCard.positionOrder - b.drawnCard.positionOrder);

  if (!first || !second || first.kbCardId === second.kbCardId) return null;

  return {
    cardA: first.kbCardId,
    cardB: second.kbCardId,
    positions: [first, second].map((card) => ({
      positionOrder: card.drawnCard.positionOrder,
      positionId: card.kbPositionId,
      positionName: getPairPositionName(card),
    })),
    reason: input.reason,
    priority: input.priority,
  };
}

function getCardsByOrder(cards: RetrievedCardContext[], ...orders: number[]) {
  return orders
    .map((order) => cards.find((card) => card.drawnCard.positionOrder === order))
    .filter((card): card is RetrievedCardContext => Boolean(card));
}

function getSemanticPairCandidates(input: {
  cardContexts: RetrievedCardContext[];
  kbSpreadId: string | null;
}) {
  const cards = [...input.cardContexts].sort(
    (a, b) => a.drawnCard.positionOrder - b.drawnCard.positionOrder,
  );
  if (cards.length <= 1) return [];

  const candidates: NonNullable<ReturnType<typeof buildPairCandidate>>[] = [];
  const add = (pairCards: RetrievedCardContext[], reason: string, priority: number) => {
    const candidate = buildPairCandidate({ cards: pairCards, reason, priority });
    if (candidate) candidates.push(candidate);
  };

  if (input.kbSpreadId === "three_option_a_b_advice") {
    add(getCardsByOrder(cards, 1, 2), "选项 A 的状态与结果", 100);
    add(getCardsByOrder(cards, 3, 4), "选项 B 的状态与结果", 100);
    add(getCardsByOrder(cards, 5, 6), "隐藏因素与建议", 90);
    add(getCardsByOrder(cards, 6, 7), "建议与总结", 80);
    return candidates;
  }

  for (let index = 0; index < cards.length - 1; index += 1) {
    add([cards[index], cards[index + 1]].filter(Boolean), "相邻牌位的连续关系", 50 - index);
  }

  const byPositionId = new Map(cards.map((card) => [card.kbPositionId, card]));
  const addByPosition = (a: string, b: string, reason: string, priority: number) => {
    const first = byPositionId.get(a);
    const second = byPositionId.get(b);
    if (first && second) add([first, second], reason, priority);
  };

  addByPosition("current_state", "obstacle", "现状与阻碍", 85);
  addByPosition("obstacle", "advice", "阻碍与建议", 95);
  addByPosition("near_future_trend", "advice", "趋势与建议", 90);
  addByPosition("external_influence", "advice", "外部影响与建议", 82);
  addByPosition("relationship_dynamic", "advice", "关系现状与建议", 92);
  addByPosition("inner_need", "advice", "内在需求与调整方向", 88);

  return candidates;
}

function getPairCandidateLimit(input: {
  kbSpreadId: string | null;
  cardCount: number;
}) {
  if (input.cardCount <= 1) return 0;
  if (input.kbSpreadId === "three_option_a_b_advice") return 4;
  if (input.cardCount <= 3) return 2;
  if (input.cardCount <= 5) return 3;

  return 4;
}

function buildPairContexts(input: {
  kb: TarotKb;
  cardContexts: RetrievedCardContext[];
  kbSpreadId: string | null;
}) {
  const limit = getPairCandidateLimit({
    kbSpreadId: input.kbSpreadId,
    cardCount: input.cardContexts.length,
  });
  if (limit === 0) return [];

  const seen = new Set<string>();
  const candidates = getSemanticPairCandidates({
    cardContexts: input.cardContexts,
    kbSpreadId: input.kbSpreadId,
  })
    .filter((candidate) => {
      const key = [candidate.cardA, candidate.cardB].sort().join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);

  return candidates.flatMap((candidate) => {
    const context = getCombinationContext({
      kb: input.kb,
      cardA: candidate.cardA,
      cardB: candidate.cardB,
    });

    if (!context.curated && !context.highFrequency && !context.base) return [];

    return [{
      cardA: candidate.cardA,
      cardB: candidate.cardB,
      positions: candidate.positions,
      reason: candidate.reason,
      curated: context.curated ?? null,
      highFrequency: context.highFrequency ?? null,
      base: context.base ?? null,
    }];
  });
}

export async function retrieveTarotEngineContext(
  input: TarotEngineInput,
): Promise<TarotEngineContext> {
  const kb = await loadTarotKb();
  const researchDatasets = loadResearchDatasets();
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
      const researchCardEvidence = getResearchCardEvidence({
        slug: appCard.slug,
        nameEn: appCard.nameEn,
      });

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
        researchCardEvidence,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const pairContexts = buildPairContexts({
    kb,
    cardContexts,
    kbSpreadId,
  });
  const questionMatches = retrieveQuestionMatches({
    kb,
    question: input.question,
    domain,
    limit: 3,
  });
  const researchSafetyMatches = retrieveResearchSafetyMatches({ question: input.question });
  const safetyMatches = mergeSafetyMatches(
    retrieveSafetyMatches({ kb, question: input.question }),
    researchSafetyMatches,
  );
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
    researchDataset: {
      generatedAt: researchDatasets.generatedAt,
      manifestFiles: researchDatasets.manifestFiles,
      matchedCardEvidence: cardContexts.filter((item) => item.researchCardEvidence).length,
      matchedSafetyRules: researchSafetyMatches.length,
    },
    questionMatches,
    safetyMatches,
    cardContexts,
    pairContexts,
    goldenCases,
    contextIds,
    missing,
  };
}
