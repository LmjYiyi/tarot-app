import { getKnowledgeProvider } from "@/lib/knowledge";
import { getCardById, getSpreadBySlug } from "@/lib/tarot/catalog";
import type {
  AdaptiveAnswer,
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
  adaptiveAnswers?: AdaptiveAnswer[];
  locale: string;
};

type ResolvedSelectedCard = {
  card: TarotCard;
  position: SpreadDefinition["positions"][number];
  orientation: "正位" | "逆位";
  keywords: string[];
  primaryMeaning: string;
};

type ResponseBlueprint = {
  sections: string[];
  instruction: string;
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

function getResponseBlueprint(spread: SpreadDefinition | null): ResponseBlueprint {
  switch (spread?.slug) {
    case "single-guidance":
      return {
        sections: ["1. 牌面总览", "2. 反馈线索", "3. 核心讯息", "4. 今日行动", "5. 一句提醒"],
        instruction: "把重点压缩到一张牌的核心提醒，不展开成大而全分析。",
      };
    case "career-five":
      return {
        sections: [
          "1. 牌面总览",
          "2. 用户反馈摘要",
          "3. 当前状态一句话",
          "4. 逐张牌解读",
          "5. 整组牌关系",
          "6. 近期趋势",
          "7. 注意事项与行动建议",
          "8. 一句话总结",
        ],
        instruction:
          "围绕事业问题整合现状、阻碍、优势、近期发展和建议，重点输出核心矛盾、短期趋势与可执行行动。",
      };
    case "relationship-six":
    case "lovers-pyramid":
      return {
        sections: [
          "1. 牌面总览",
          "2. 用户反馈摘要",
          "3. 关系现状",
          "4. 双方与连接断裂点",
          "5. 修复路径",
          "6. 近期关系提醒",
        ],
        instruction:
          "说明双方状态如何错位、仍有什么连接资源，以及更现实的沟通修复路径。",
      };
    case "path-of-choice":
      return {
        sections: [
          "1. 牌面总览",
          "2. 用户反馈摘要",
          "3. 决策核心",
          "4. A/B 路径对比",
          "5. 情绪上的倾向",
          "6. 建议方向",
        ],
        instruction: "比较两条路径带来的感受、机会与代价，不替用户做绝对决定。",
      };
    case "self-state":
      return {
        sections: [
          "1. 牌面总览",
          "2. 用户反馈摘要",
          "3. 当前心理状态",
          "4. 压力源与需求",
          "5. 调整方向",
          "6. 一句话总结",
        ],
        instruction: "把问题外化为压力、需求和调整方向，避免给用户贴负面标签。",
      };
    case "celtic-cross":
      return {
        sections: [
          "1. 牌面总览",
          "2. 用户反馈摘要",
          "3. 局势总览",
          "4. 关键结构解读",
          "5. 近期走向与结果趋势",
          "6. 行动建议",
        ],
        instruction: "重点整合核心议题、挑战、内外部环境与趋势，避免逐张平铺。",
      };
    default:
      return {
        sections: [
          "1. 牌面总览",
          "2. 用户反馈摘要",
          "3. 整体概览",
          "4. 分位置解读",
          "5. 行动建议",
          "6. 一句近期提醒",
        ],
        instruction: "结合问题、领域目标、位置、牌义和用户反馈做结构化中文解读。",
      };
  }
}

function resolveSelectedCards(
  spread: SpreadDefinition | null,
  cards: DrawnCard[],
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
    return "用户未填写直觉反馈，请只做基础牌面解读。";
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

function summarizeAdaptiveAnswers(answers: AdaptiveAnswer[] | undefined) {
  if (!answers?.length) {
    return "适配追问：未回答。不要自行编造用户感受。";
  }

  return answers
    .map((answer) => `- ${answer.question}\n  用户感受：${answer.answerLabel || answer.answer}`)
    .join("\n");
}

export async function buildInterpretationPayload(input: BuildContextInput) {
  const provider = getKnowledgeProvider();
  const spread = getSpreadBySlug(input.spreadSlug);
  const responseBlueprint = getResponseBlueprint(spread);
  const selectedCards = resolveSelectedCards(spread, input.cards);
  const feedbackSummary = summarizeFeedback(selectedCards, input.userFeedback);
  const adaptiveSummary = summarizeAdaptiveAnswers(input.adaptiveAnswers);
  const intentSummary = summarizeIntent(input.readingIntent);
  const context = await provider.getContext({
    question: input.question,
    spreadSlug: input.spreadSlug,
    cardIds: input.cards.map((card) => card.cardId),
    locale: input.locale,
  });

  const userPrompt = [
    `用户问题：${input.question || "我想看清自己当前最需要面对的课题。"}`,
    `领域/目标：${intentSummary}`,
    `牌阵：${spread?.nameZh ?? input.spreadSlug}`,
    input.drawLog
      ? `抽牌日志：seed=${input.drawLog.seed}；规则=${input.drawLog.drawRule}；逆位率=${input.drawLog.reversedRate}；时间=${input.drawLog.createdAt}`
      : "抽牌日志：本次未提供 seed，但仍按程序抽牌结果解读。",
    `解读重点：${responseBlueprint.instruction}`,
    "抽牌结果：",
    ...selectedCards.map(
      ({ card, position, orientation, keywords, primaryMeaning }) =>
        `- 位置 ${position.order}「${position.name}」：${card.nameZh}（${orientation}）\n  位置任务：${position.focus}；${position.promptHint}\n  关键词：${keywords.join("、")}\n  牌义摘要：${primaryMeaning}`,
    ),
    "用户直觉反馈：",
    feedbackSummary,
    "适配追问反馈：",
    adaptiveSummary,
    "推理规则：",
    "1. 每个关键判断都必须绑定至少一个依据：牌名、牌阵位置、正逆位、用户反馈或适配追问答案。",
    "2. 先说明牌面事实，再整合用户反馈，再提炼心理状态、核心矛盾、趋势与建议。",
    "3. 用户的适配追问答案只代表看牌后的感受，不要把它当作客观事实。",
    "4. 不要使用“必然、一定、命中注定”等绝对预言。用“更像是、倾向于、需要注意”的表达。",
    "5. 避免巴纳姆式空话，不要说任何人都适用的泛泛描述。",
    "6. 输出要克制精炼，不要写 Markdown 表格，不要逐项复制所有关键词。",
    selectedCards.length <= 5
      ? "长度要求：700 到 1000 个中文字符，优先保留核心矛盾和行动建议。"
      : "长度要求：1000 到 1400 个中文字符，复杂牌阵也要整合，不要平铺所有牌。",
    "必须完整结束，不要在句子中间截断；如果篇幅不够，优先压缩分位置解读，保留行动建议和一句总结。",
    "请严格按以下结构输出：",
    ...responseBlueprint.sections,
  ].join("\n");

  const knowledgeText = context.contextBlocks
    .map(
      (block) =>
        `## ${block.kind.toUpperCase()} | ${block.title}\n${block.text}\n标签：${block.tags.join(", ")}`,
    )
    .join("\n\n");

  return {
    systemPrompt: context.systemPrompt,
    knowledgeText,
    userPrompt,
    citations: context.citations ?? [],
    selectedCards,
    feedbackSummary,
    adaptiveSummary,
    responseBlueprint,
    spreadName: spread?.nameZh ?? input.spreadSlug,
  };
}
