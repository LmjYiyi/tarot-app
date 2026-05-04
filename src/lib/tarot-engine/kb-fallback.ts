import type { SpreadReadingTemplate } from "@/lib/interpretation/templates/types";
import type { ReadingIntent, SpreadDefinition, TarotCard } from "@/lib/tarot/types";
import type { DailyAstrologyGuidance } from "@/lib/astrology/daily-guidance";

import type {
  RetrievedCardContext,
  RetrievedPairContext,
  RetrievedSafetyRule,
  TarotEngineContext,
} from "./types";

type SelectedCardForFallback = {
  card: TarotCard;
  position: SpreadDefinition["positions"][number];
  orientation: "正位" | "逆位";
  keywords: string[];
};

type KbDrivenFallbackInput = {
  question: string;
  spreadName: string;
  responseBlueprint: SpreadReadingTemplate;
  selectedCards: SelectedCardForFallback[];
  readingIntent?: ReadingIntent;
  dailyAstrology?: DailyAstrologyGuidance;
  tarotEngineContext: TarotEngineContext;
};

const domainLabels = {
  love: "感情",
  career: "事业",
  self_state: "自我状态",
  decision: "决策",
} as const;

function cleanText(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function sentence(value: string | null | undefined, fallback = "") {
  const text = cleanText(value);
  return text || fallback;
}

function getSelectedLabel(item: RetrievedCardContext) {
  const orientation = item.orientation === "reversed" ? "逆位" : "正位";
  const positionName = item.appPosition?.name ?? item.contextPositionMeaning?.position_name_cn ?? "这个位置";
  return `${positionName}的${item.appCard.nameZh}（${orientation}）`;
}

function getCardReading(item: RetrievedCardContext) {
  const precise = item.contextPositionMeaning;
  const profile = item.contextMeaning;

  return sentence(
    precise?.position_reading,
    sentence(
      profile?.core_reading,
      `${getSelectedLabel(item)}把重点放在${item.appCard.keywordsUpright.slice(0, 2).join("、") || "当前主题"}上。`,
    ),
  );
}

function getCardAdvice(item: RetrievedCardContext) {
  return sentence(
    item.contextPositionMeaning?.advice_direction,
    item.appPosition?.promptHint
      ? `这里更适合先做一个小步验证：${item.appPosition.promptHint}`
      : "先把牌面提示落到一个能观察、能沟通、能复盘的小动作上。",
  );
}

function findContextByPosition(context: TarotEngineContext, ...positionIds: string[]) {
  return context.cardContexts.find((item) => positionIds.includes(item.kbPositionId)) ?? null;
}

function firstContext(context: TarotEngineContext) {
  return context.cardContexts[0] ?? null;
}

function trimSentenceEnd(value: string) {
  return value.replace(/[。！？!?；;，,\s]+$/u, "");
}

function optionContext(context: TarotEngineContext, positionId: "option_a" | "option_b") {
  return context.cardContexts.find((item) => item.kbPositionId === positionId) ?? null;
}

function formatCardSentence(item: RetrievedCardContext | null) {
  if (!item) return "这次没有解析到足够的牌位资料，因此只保留温和的现实提醒。";

  return `${getSelectedLabel(item)}更像是在说：${getCardReading(item)}`;
}

function formatCardAdvice(item: RetrievedCardContext | null) {
  if (!item) return "先暂停直接下结论，把问题拆成一个今天能确认的小信号。";

  return `${getSelectedLabel(item)}给出的动作是：${getCardAdvice(item)}`;
}

function pairText(pair: RetrievedPairContext, domain: TarotEngineContext["domain"]) {
  const source = pair.curated ?? pair.highFrequency ?? pair.base;
  if (!source) return "";

  const domainText =
    domain === "love"
      ? source.human_like_love ?? source.love
      : domain === "career"
        ? source.human_like_career ?? source.career
        : domain === "decision"
          ? source.human_like_decision ?? source.decision
          : source.human_like_self ?? source.self_state;

  return sentence(
    typeof domainText === "string" ? domainText : null,
    sentence(source.theme, ""),
  );
}

function buildPairSummary(context: TarotEngineContext) {
  const texts = context.pairContexts
    .map((pair) => pairText(pair, context.domain))
    .filter(Boolean)
    .slice(0, 2);

  if (!texts.length) {
    return "牌与牌之间没有出现需要强行放大的特殊组合，重点仍然放在每张牌所在的位置任务上。";
  }

  return `牌与牌之间还有一个联动信号：${texts.join(" ")}这里不能把组合读成铁口直断，只能作为理解整体氛围和行动边界的辅助线索。`;
}

function safetyOpening(safetyMatches: RetrievedSafetyRule[]) {
  const safety = safetyMatches[0];
  if (!safety) return null;

  return sentence(
    safety.rule.fallback_template,
    "这个问题不适合用塔罗做确定预测，我会把它转成压力、边界和现实准备方向来读。",
  );
}

function isBlockedSafety(safetyMatches: RetrievedSafetyRule[]) {
  return safetyMatches.some(({ rule }) => rule.risk_level === "high" || rule.risk_level === "critical");
}

function buildSafetyOnlyFallback(input: KbDrivenFallbackInput) {
  const { responseBlueprint, tarotEngineContext } = input;
  const opening =
    safetyOpening(tarotEngineContext.safetyMatches) ??
    "这个问题触发了安全边界，因此这次不会把牌读成确定预测。";

  return responseBlueprint.sections
    .map((section, index) => {
      let body = "";

      if (index === 0) {
        body = opening;
      } else if (/风险|提醒|边界|误解|隐藏/.test(section)) {
        body = "这里最重要的不是从牌面判断结果，而是把现实风险先摆出来：哪些信息需要专业人士确认，哪些决定不能只靠情绪或占卜推动。";
      } else if (/行动|建议|决策/.test(section)) {
        body = "下一步先做现实支持动作：整理事实、保存必要信息、联系可信的人或专业服务，并把任何高成本决定延后到信息更清楚之后。";
      } else if (/观察/.test(section)) {
        body = `观察窗口放在${responseBlueprint.timeScope.observationWindow}。重点看现实状况是否缓和、信息是否更完整，以及你是否已经获得专业或可信支持。`;
      } else {
        body = "这部分不展开普通牌义，避免把高风险问题误读成命运判断。牌面只作为情绪整理和现实准备的辅助。";
      }

      return `${section}\n${body}`;
    })
    .join("\n\n");
}

function buildOpening(input: KbDrivenFallbackInput) {
  const { tarotEngineContext, spreadName, question, dailyAstrology } = input;
  const domain = domainLabels[tarotEngineContext.domain];
  const cards = tarotEngineContext.cardContexts.map((item) => item.appCard.nameZh).join("、");
  const matchedQuestion = tarotEngineContext.questionMatches[0]?.item;
  const rewritten =
    matchedQuestion?.should_rewrite && matchedQuestion.rewritten_question
      ? `我会把它先放回“${matchedQuestion.rewritten_question}”这个更稳的角度。`
      : "";

  const astrologyTip = dailyAstrology
    ? `今天落在${dailyAstrology.signNameZh}季节，${dailyAstrology.elementNameZh}的底色会提醒你：${dailyAstrology.dailyFocus}温馨小tips是，${dailyAstrology.watchPoint}`
    : "";

  return `这次问题${question.trim() ? `“${question.trim()}”` : ""}更接近${domain}方向，我会按${spreadName}的牌位来读。牌面是${cards || "当前抽牌"}。${astrologyTip}${rewritten}这不是绝对预测，而是把当前状态、阻碍和可调整的方向摊开看。`;
}

function buildStructure(input: KbDrivenFallbackInput) {
  const contexts = input.tarotEngineContext.cardContexts;
  if (!contexts.length) {
    return "这次没有拿到可用的精细牌义，不能假装已经读到牌位。更稳的做法是重新抽牌或检查牌面数据。";
  }

  return contexts
    .map((item) => {
      const rule = item.positionRule?.interpretation_rule
        ? `这个位置要${trimSentenceEnd(item.positionRule.interpretation_rule)}`
        : "这个位置要按牌位任务来读";
      return `${getSelectedLabel(item)}：${getCardReading(item)}${rule ? ` ${rule}。` : ""}`;
    })
    .join("\n");
}

function buildTension(input: KbDrivenFallbackInput) {
  const context = input.tarotEngineContext;
  const obstacle = findContextByPosition(context, "obstacle");
  const current = findContextByPosition(context, "current_state", "self_state", "relationship_dynamic");

  if (obstacle && current && obstacle !== current) {
    return `核心矛盾在${current.appCard.nameZh}和${obstacle.appCard.nameZh}之间：前者说明当前能量如何呈现，后者指出真正卡住的机制。${getCardReading(obstacle)}这提示你先处理卡点，而不是急着问最后会怎样。`;
  }

  return `${formatCardSentence(current ?? firstContext(context))}关键不在于马上下结论，而是看这个主题如何影响你的节奏、判断和下一步行动。`;
}

function buildReality(input: KbDrivenFallbackInput) {
  const pairSummary = buildPairSummary(input.tarotEngineContext);
  const safetyNote = safetyOpening(input.tarotEngineContext.safetyMatches);
  const base =
    input.tarotEngineContext.domain === "love"
      ? "放到关系里，重点是看互动证据、回应节奏和边界，而不是替对方读心。"
      : input.tarotEngineContext.domain === "career"
        ? "放到事业里，重点是看资源、节奏、协作条件和现实代价，而不是直接判断成败。"
        : input.tarotEngineContext.domain === "decision"
          ? "放到决策里，重点是拆开选择的收益、代价和验证动作，而不是替你选答案。"
          : "放到自我状态里，重点是看能量、压力和真实需求，而不是给自己贴标签。";

  return [base, pairSummary, safetyNote].filter(Boolean).join(" ");
}

function buildRiskOrHidden(input: KbDrivenFallbackInput) {
  const hidden = findContextByPosition(
    input.tarotEngineContext,
    "external_influence",
    "inner_need",
    "obstacle",
  );

  return `${formatCardSentence(hidden ?? firstContext(input.tarotEngineContext))}这里的风险是把牌面直接读成结果，或者把情绪投射当成现实证据。更稳的做法是先确认信息，再决定推进、沟通或暂停。`;
}

function buildAdvice(input: KbDrivenFallbackInput) {
  const advice = findContextByPosition(input.tarotEngineContext, "advice");
  const fallback = input.tarotEngineContext.cardContexts.at(-1) ?? firstContext(input.tarotEngineContext);
  const astrologyAction = input.dailyAstrology
    ? ` 结合今天的星座小提醒，可以把动作收得更轻一点：${input.dailyAstrology.modalityAdvice}${input.dailyAstrology.microPrompt}`
    : "";

  return `${formatCardAdvice(advice ?? fallback)}${astrologyAction}`;
}

function getDailyCard(input: KbDrivenFallbackInput) {
  return firstContext(input.tarotEngineContext);
}

function getOrientationSpecificMeaning(
  item: RetrievedCardContext | null,
  field: "love" | "career" | "finance",
) {
  if (!item) return "";

  const card = item.appCard;
  const reversed = item.orientation === "reversed";

  if (field === "love") {
    return cleanText(
      reversed
        ? card.loveMeaningReversed ?? card.loveMeaning ?? card.meaningReversed
        : card.loveMeaningUpright ?? card.loveMeaning ?? card.meaningUpright,
    );
  }

  if (field === "career") {
    return cleanText(
      reversed
        ? card.careerMeaningReversed ?? card.careerMeaning ?? card.meaningReversed
        : card.careerMeaningUpright ?? card.careerMeaning ?? card.meaningUpright,
    );
  }

  return cleanText(
    reversed
      ? card.financeMeaningReversed ?? card.meaningReversed
      : card.financeMeaningUpright ?? card.meaningUpright,
  );
}

function buildDailyLove(input: KbDrivenFallbackInput) {
  const item = getDailyCard(input);
  if (!item) return formatCardSentence(null);

  const meaning = getOrientationSpecificMeaning(item, "love") || getCardReading(item);
  return `${getSelectedLabel(item)}放到感情里，更像是在提醒你：${meaning}今天不需要把关系读成最终答案，只要观察互动里有没有更自然的回应、更清楚的边界，或更愿意靠近的一点点信号。`;
}

function buildDailyCareer(input: KbDrivenFallbackInput) {
  const item = getDailyCard(input);
  if (!item) return formatCardSentence(null);

  const meaning = getOrientationSpecificMeaning(item, "career") || getCardReading(item);
  return `${getSelectedLabel(item)}放到事业和日常事务里，重点是：${meaning}今天适合把注意力放在一个能推进的小环节上，不必急着证明结果，先看沟通、协作或执行节奏是否变得更顺。`;
}

function buildDailyFinance(input: KbDrivenFallbackInput) {
  const item = getDailyCard(input);
  if (!item) return formatCardSentence(null);

  const meaning = getOrientationSpecificMeaning(item, "finance") || getCardReading(item);
  return `${getSelectedLabel(item)}放到财务和资源感里，可以读成：${meaning}这不是投资或消费建议，更像是提醒你今天看清资源如何流动：哪些支出值得，哪些承诺可以先慢一点，哪些支持可以被好好接住。`;
}

function buildDailyTip(input: KbDrivenFallbackInput) {
  const item = getDailyCard(input);
  const cardName = item?.appCard.nameZh ?? "这张牌";
  const cardAdvice = item ? getCardAdvice(item) : "先做一个能让今天更清楚的小动作。";

  if (!input.dailyAstrology) {
    return `${cardName}给你的温馨小tips是：${cardAdvice}把它收成今天能完成的一件小事就好，不必把一张牌读成一整天的命运。`;
  }

  return `今天落在${input.dailyAstrology.signNameZh}季节，${input.dailyAstrology.elementNameZh}的底色提醒你：${input.dailyAstrology.dailyFocus}${input.dailyAstrology.watchPoint}结合${cardName}，可以试试这个小动作：${cardAdvice}${input.dailyAstrology.modalityAdvice}${input.dailyAstrology.microPrompt}`;
}

function buildObservation(input: KbDrivenFallbackInput) {
  return `观察窗口放在${input.responseBlueprint.timeScope.observationWindow}。重点看三个信号：现实反馈是否更具体，你的身体和情绪是否更稳定，以及下一步行动后局面是变清楚，还是继续让你消耗。`;
}

function buildPathSection(input: KbDrivenFallbackInput, positionId: "option_a" | "option_b") {
  const context = optionContext(input.tarotEngineContext, positionId);
  const label = positionId === "option_a" ? "路径 A" : "路径 B";

  if (!context) return `${label}这边没有独立命中的牌位资料，所以不适合硬编机会和代价。`;

  return `${label}对应${context.appCard.nameZh}。${getCardReading(context)}这条路的机会在于它能让某个主题浮上台面，代价是你需要确认自己是否愿意承接它带来的现实成本。`;
}

function buildSectionBody(input: KbDrivenFallbackInput, section: string, index: number) {
  if (input.dailyAstrology && /今日感情/.test(section)) return buildDailyLove(input);
  if (input.dailyAstrology && /今日事业/.test(section)) return buildDailyCareer(input);
  if (input.dailyAstrology && /今日财运/.test(section)) return buildDailyFinance(input);
  if (input.dailyAstrology && /温馨小tips/.test(section)) return buildDailyTip(input);
  if (index === 0 || /牌面先说/.test(section)) return buildOpening(input);
  if (/路径 A/.test(section)) return buildPathSection(input, "option_a");
  if (/路径 B/.test(section)) return buildPathSection(input, "option_b");
  if (/结构|线索|阶段|双方状态|事业结构|心理结构|本质差异/.test(section)) {
    return buildStructure(input);
  }
  if (/矛盾|卡点|压力源|阻碍|误解|边界/.test(section)) return buildTension(input);
  if (/优势|资源/.test(section)) {
    const strength = findContextByPosition(input.tarotEngineContext, "strength");
    return `${formatCardSentence(strength ?? firstContext(input.tarotEngineContext))}这部分更适合读成可以调用的资源，而不是最终结果。`;
  }
  if (/未来|近期|发展|趋势|修复路径|长期/.test(section)) {
    const trend = findContextByPosition(input.tarotEngineContext, "near_future_trend", "outcome");
    return `${formatCardSentence(trend ?? firstContext(input.tarotEngineContext))}这只是当前路径延续下的倾向，不是命运判决；真正要看的是接下来是否有新的沟通、资源或行动介入。`;
  }
  if (/现实映射|关系本身|内外因素/.test(section)) return buildReality(input);
  if (/风险|隐藏|被忽略|希望|担心/.test(section)) return buildRiskOrHidden(input);
  if (/行动|建议|决策前|调整方向/.test(section)) return buildAdvice(input);
  if (/观察/.test(section)) return buildObservation(input);

  const fallbackCard = input.tarotEngineContext.cardContexts[index - 1] ?? input.tarotEngineContext.cardContexts[0] ?? null;
  return formatCardSentence(fallbackCard);
}

export function buildKbDrivenFallback(input: KbDrivenFallbackInput) {
  if (isBlockedSafety(input.tarotEngineContext.safetyMatches)) {
    return buildSafetyOnlyFallback(input);
  }

  return input.responseBlueprint.sections
    .map((section, index) => `${section}\n${buildSectionBody(input, section, index)}`)
    .join("\n\n");
}
