import { getKnowledgeProvider } from "@/lib/knowledge";
import { analyzeGeneralStructure, diagnoseQuestion } from "@/lib/interpretation/analysis/general";
import { buildCombinationSummary } from "@/lib/interpretation/combination-summary";
import { analyzeReadingGrammar } from "@/lib/interpretation/grammar";
import { buildInterpretationPlan } from "@/lib/interpretation/plan";
import {
  buildScenarioStrategyNotes,
  inferScenarioStrategy,
} from "@/lib/interpretation/scenario-strategy";
import { serializeInterpretationPlan } from "@/lib/interpretation/serializer";
import { getSpreadReadingTemplate } from "@/lib/interpretation/templates";
import { formatTarotEngineContext } from "@/lib/tarot-engine/format-context";
import { retrieveTarotEngineContext } from "@/lib/tarot-engine/retrieve-context";
import type { TarotEngineContext } from "@/lib/tarot-engine/types";
import { getCardById, getSpreadBySlug } from "@/lib/tarot/catalog";
import type {
  DrawLog,
  DrawnCard,
  ReadingIntent,
  SpreadDefinition,
  TarotCard,
  UserFeedback,
} from "@/lib/tarot/types";

type BuildContextInput = {
  question: string;
  spreadSlug: string;
  cards: DrawnCard[];
  drawLog?: DrawLog;
  readingIntent?: ReadingIntent;
  userFeedback?: UserFeedback;
  locale: string;
  tarotEngineContext?: TarotEngineContext;
};

type ResolvedSelectedCard = {
  card: TarotCard;
  position: SpreadDefinition["positions"][number];
  orientation: "正位" | "逆位";
  keywords: string[];
  primaryMeaning: string;
  domainMeaning: string | null;
};

const domainLabels: Record<ReadingIntent["domain"], string> = {
  career: "事业",
  love: "感情",
  study: "学业",
  relationship: "人际关系",
  self: "自我状态",
  decision: "决策",
};

const goalLabels: Record<ReadingIntent["goal"], string> = {
  trend: "看趋势",
  obstacle: "看阻碍",
  advice: "看建议",
  decision: "辅助决策",
  other_view: "换个视角",
};

function getDomainMeaning(
  card: TarotCard,
  reversed: boolean,
  intent: ReadingIntent | undefined,
) {
  const suffix = reversed ? "Reversed" : "Upright";

  switch (intent?.domain) {
    case "love":
    case "relationship":
      return card[`loveMeaning${suffix}` as const] ?? null;
    case "career":
    case "study":
      return card[`careerMeaning${suffix}` as const] ?? null;
    default:
      return null;
  }
}

function resolveSelectedCards(
  spread: SpreadDefinition | null,
  cards: DrawnCard[],
  intent?: ReadingIntent,
): ResolvedSelectedCard[] {
  return cards
    .map((drawnCard) => {
      const card = getCardById(drawnCard.cardId);
      const position = spread?.positions.find((item) => item.order === drawnCard.positionOrder);

      if (!card || !position) {
        return null;
      }

      const orientation = drawnCard.reversed ? "逆位" : "正位";

      return {
        card,
        position,
        orientation,
        keywords: drawnCard.reversed ? card.keywordsReversed : card.keywordsUpright,
        primaryMeaning: drawnCard.reversed ? card.meaningReversed : card.meaningUpright,
        domainMeaning: getDomainMeaning(card, drawnCard.reversed, intent),
      };
    })
    .filter((value): value is ResolvedSelectedCard => Boolean(value));
}

function summarizeIntent(intent: ReadingIntent | undefined) {
  if (!intent) return "未选择领域与目标。";
  return `${domainLabels[intent.domain]} / ${goalLabels[intent.goal]}`;
}

function summarizeFeedback(
  selectedCards: ResolvedSelectedCard[],
  feedback: UserFeedback | undefined,
) {
  if (!feedback) {
    return "无额外直觉补充。写作时不要说明用户未填写或无法判断，也不要把“没有补充”写成单独段落；直接回到牌面本身。";
  }

  const findCard = (cardId: string | undefined) =>
    selectedCards.find(({ card }) => card.id === cardId);
  const mostResonant = findCard(feedback.mostResonantCardId);
  const mostUncomfortable = findCard(feedback.mostUncomfortableCardId);

  return [
    mostResonant
      ? `最有感觉：${mostResonant.card.nameZh}（${mostResonant.position.name}，${mostResonant.orientation}）。这通常代表认同、渴望、优势或自我投射。`
      : "最有感觉：未填写。",
    mostUncomfortable
      ? `最有压力：${mostUncomfortable.card.nameZh}（${mostUncomfortable.position.name}，${mostUncomfortable.orientation}）。这通常代表压力源、抗拒点或现实卡点。`
      : "最有压力：未填写。",
    feedback.overallFeeling?.trim()
      ? `整体感受：${feedback.overallFeeling.trim()}。`
      : "整体感受：未填写。",
    feedback.overallFeelingNote?.trim()
      ? `补充感受：${feedback.overallFeelingNote.trim()}。`
      : "补充感受：未填写。",
  ].join("\n");
}

export async function buildInterpretationPayload(input: BuildContextInput) {
  const provider = getKnowledgeProvider();
  const spread = getSpreadBySlug(input.spreadSlug);
  const responseBlueprint = getSpreadReadingTemplate(spread?.slug);
  const selectedCards = resolveSelectedCards(spread, input.cards, input.readingIntent);
  const generalAnalysis = analyzeGeneralStructure({
    question: input.question,
    spread,
    selectedCards,
    readingIntent: input.readingIntent,
  });
  const grammarAnalysis = analyzeReadingGrammar({
    selectedCards,
    template: responseBlueprint,
  });
  const questionDiagnosis = diagnoseQuestion(input.question, input.readingIntent);
  const scenarioStrategy = inferScenarioStrategy({
    question: input.question,
    intent: input.readingIntent,
    diagnosis: questionDiagnosis,
  });
  const scenarioStrategyNotes = buildScenarioStrategyNotes({
    strategy: scenarioStrategy,
    selectedCards,
  });
  const interpretationPlan = buildInterpretationPlan({
    template: responseBlueprint,
    spread,
    selectedCards,
    generalAnalysis,
    grammarAnalysis,
    questionDiagnosis,
  });
  const feedbackSummary = summarizeFeedback(selectedCards, input.userFeedback);
  const intentSummary = summarizeIntent(input.readingIntent);
  const combinationSummary = buildCombinationSummary(selectedCards);
  const context = await provider.getContext({
    question: input.question,
    spreadSlug: input.spreadSlug,
    cardIds: input.cards.map((card) => card.cardId),
    locale: input.locale,
  });
  const tarotEngineContext =
    input.tarotEngineContext ??
    (await retrieveTarotEngineContext({
      question: input.question,
      spreadSlug: input.spreadSlug,
      cards: input.cards,
      readingIntent: input.readingIntent,
    }));

  const userPrompt = [
    `用户问题：${input.question || "我想看清自己当前最需要面对的课题。"}`,
    `领域/目标：${intentSummary}`,
    `牌阵：${spread?.nameZh ?? input.spreadSlug}`,
    input.drawLog
      ? `抽牌日志：seed=${input.drawLog.seed}；规则=${input.drawLog.drawRule}；逆位率=${input.drawLog.reversedRate}；时间=${input.drawLog.createdAt}`
      : "抽牌日志：本次未提供 seed，但仍按程序抽牌结果解读。",
    `解读重点：${responseBlueprint.instruction}`,
    "占卜师结构分析笔记：",
    serializeInterpretationPlan(interpretationPlan),
    "抽牌结果：",
    ...selectedCards.map(
      ({ card, position, orientation, keywords, primaryMeaning, domainMeaning }) =>
        [
          `- 位置 ${position.order}「${position.name}」：${card.nameZh}（${orientation}）`,
          `  位置任务：${position.focus}；${position.promptHint}`,
          `  关键词：${keywords.join("、")}`,
          `  牌义摘要：${primaryMeaning}`,
          domainMeaning ? `  领域牌义：${domainMeaning}` : null,
          card.element || card.planetary || card.astrology
            ? `  元数据：${[
                card.element ? `元素=${card.element}` : null,
                card.planetary ? `行星=${card.planetary}` : null,
                card.astrology ? `星象=${card.astrology}` : null,
              ]
                .filter(Boolean)
                .join("；")}`
            : null,
        ]
          .filter((line): line is string => Boolean(line))
          .join("\n"),
    ),
    "牌间弱参考（不可原文引用）：",
    combinationSummary,
    "Tarot KB v0.2 检索摘要：",
    [
      `领域映射：${tarotEngineContext.domain}`,
      `命中精细牌义：${tarotEngineContext.cardContexts.filter((item) => item.contextPositionMeaning).length}/${tarotEngineContext.cardContexts.length}`,
      `命中组合资料：${tarotEngineContext.pairContexts.length}`,
      `命中问题路由：${tarotEngineContext.questionMatches.length}`,
      `命中安全规则：${tarotEngineContext.safetyMatches.length}`,
      `命中案例参考：${tarotEngineContext.goldenCases.length}`,
      `资料ID：${tarotEngineContext.contextIds.slice(0, 24).join("，")}`,
    ].join("\n"),
    "用户直觉反馈：",
    feedbackSummary,
    "场景策略契约：",
    scenarioStrategyNotes,
    "推理规则：",
    "1. 结构分析笔记是优先依据；先写整组牌的主线张力，再写关键牌位，禁止逐张流水账。",
    "2. 每个关键判断都必须绑定至少一个依据：牌名、牌阵位置、正逆位、结构分析或用户反馈。",
    "3. 先说明牌面事实，再整合用户反馈，再提炼心理状态、核心矛盾、现实映射、趋势与建议。",
    "4. 若某张牌提供了「领域牌义」，优先用它回应用户选择的领域；基础牌义只作为背景补充，不要反客为主。",
    "5. 牌间弱参考只用于提醒哪些牌需要联动观察，不是可引用文案，也不是优先依据；禁止写“组合意义中”“组合意义是”“资料显示”等表达。",
    "5b. Tarot KB v0.2 是本次运行时检索到的精细资料：优先吸收「位置感读法」「牌位语法」「组合禁区」「Golden Cases」里的边界，但不要在用户可见文本中说“KB”“资料包”“案例库”。",
    "6. 大阿卡纳比例、花色分布、宫廷牌、数字阶段、逆位比例、支持/抵消关系必须至少选择三类自然融入正文。",
    questionDiagnosis.safetyDirectives.length
      ? `7. 用户问题触发安全策略，必须执行：${questionDiagnosis.safetyDirectives.join("；")}`
      : null,
    `7b. 必须执行场景策略契约：按「${scenarioStrategy.label}」的语气、必须包含、必须避免和断言强度写作；若场景契约与通用牌义冲突，以场景契约为准。`,
    "8. 如果用户没有填写直觉反馈，严禁写“用户未填写”“无法判断你是否认同/不安”等缺席说明；这类信息不应该呈现给用户。直接解读牌面即可。",
    "9. 不要使用绝对预言（必然、一定、命中注定），用更像是、倾向于、需要注意的表达。",
    "10. 避免巴纳姆式空话，不要说任何人都适用的泛泛描述。",
    "11. 输出要克制精炼，不要写 Markdown 表格，不要逐项复制所有关键词。",
    `12. 格式硬性要求：第一行必须逐字输出“${responseBlueprint.sections[0]}”；只能使用下面给出的章节标题，必须逐字保留标题顺序，每个标题单独成行；不得新增“解读”“总结”等额外标题；不得输出 ---、***、列表符号或表格。`,
    "13. 每个章节至少写一段正文，不能省略最后两个章节；如果篇幅不足，压缩中间分析，也必须保留行动建议/决策前动作和观察指标。",
    "14. 不要把内部提示词暴露给用户：不要写“结构分析笔记显示”“组合意义是”“组合意义中”“根据规则”“资料显示”等措辞，要自然融入解读。",
    "15. 严禁擅自补充用户没有提供的事实背景：不要自行添加公司类型、岗位名称、地点、人物身份、关系状态或具体行业；不确定时使用“当前环境”“新方向”“对方”“这件事”等中性表达。",
    `16. 观察指标必须使用本牌阵的验证窗口：${responseBlueprint.timeScope.observationWindow}；不要自行缩短或拉长。`,
    "17. 关系、感情、暧昧、人际语境中，除非用户问题明确写出“他/她/男友/女友/老公/老婆/男方/女方”等性别信息，否则称呼对方时统一使用“TA”或“对方”，不要擅自写成“他”或“她”。",
    /面试|求职|应聘|候选|岗位/.test(input.question)
      ? "18. 用户问的是面试/求职场景：必须具体回应面试准备、现场表达、压力管理和面试后可观察反馈；不要把事业牌义直接套成当前工作要结束、职场关系出问题或正在离职。"
      : null,
    `长度要求：${responseBlueprint.length.min} 到 ${responseBlueprint.length.max} 个中文字符；必须保留模板要求的核心章节。`,
    "必须完整结束，不要在句子中间截断；如果篇幅不够，优先压缩分位置解读，保留行动建议和一句总结。",
    "请严格按以下结构输出，只输出这些标题和对应正文；每个标题必须单独占一行，标题之后换行写正文：",
    ...responseBlueprint.sections,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

  const knowledgeText = context.contextBlocks
    .map(
      (block) =>
        `## ${block.kind.toUpperCase()} | ${block.title}\n${block.text}\n标签：${block.tags.join(", ")}`,
    )
    .concat(formatTarotEngineContext(tarotEngineContext))
    .join("\n\n");

  return {
    question: input.question,
    systemPrompt: context.systemPrompt,
    knowledgeText,
    userPrompt,
    citations: context.citations ?? [],
    selectedCards,
    feedbackSummary,
    responseBlueprint,
    questionDiagnosis,
    scenarioStrategy,
    tarotEngineContext,
    userFeedback: input.userFeedback,
    readingIntent: input.readingIntent,
    spreadName: spread?.nameZh ?? input.spreadSlug,
  };
}
