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
  domainMeaning: string | null;
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
        sections: ["1. 牌面总览", "2. 牌面线索", "3. 核心讯息", "4. 今日行动", "5. 一句提醒"],
        instruction: "把重点压缩到一张牌的核心提醒，不展开成大而全分析。",
      };
    case "career-five":
      return {
        sections: [
          "1. 牌面总览",
          "2. 直觉补充",
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
          "2. 直觉补充",
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
          "2. 直觉补充",
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
          "2. 直觉补充",
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
          "2. 直觉补充",
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
          "2. 直觉补充",
          "3. 整体概览",
          "4. 分位置解读",
          "5. 行动建议",
          "6. 一句近期提醒",
        ],
        instruction: "结合问题、领域目标、位置、牌义和用户反馈做结构化中文解读。",
      };
  }
}

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

function normalizeCombinationSlug(slug: string) {
  return slug.replace(/^the-(justice|judgement|wheel-of-fortune)$/, "$1");
}

function buildCombinationSummary(selectedCards: ResolvedSelectedCard[]) {
  const lines: string[] = [];

  selectedCards.forEach(({ card, position }) => {
    card.combinations?.forEach((combination) => {
      const matchedCard = selectedCards.find(
        (candidate) =>
          candidate.card.id !== card.id &&
          normalizeCombinationSlug(candidate.card.slug) ===
            normalizeCombinationSlug(combination.cardSlug),
      );

      if (!matchedCard) {
        return;
      }

      lines.push(
        `- ${card.nameZh}（位置${position.order}「${position.name}」） + ${matchedCard.card.nameZh}（位置${matchedCard.position.order}「${matchedCard.position.name}」）：${combination.meaning}`,
      );
    });
  });

  return lines.length ? lines.join("\n") : "本次抽到的牌之间暂无结构化组合意义，请只按牌阵位置和单牌含义整合。";
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

function summarizeAdaptiveAnswers(answers: AdaptiveAnswer[] | undefined) {
  if (!answers?.length) {
    return "无额外补充回应。写作时不要说明用户未回答追问，也不要围绕缺席信息分析；直接依据牌面解读。";
  }

  return answers
    .map(
      (answer, index) =>
        `- A${index + 1}：${answer.question}\n  用户感受：${answer.answerLabel || answer.answer}`,
    )
    .join("\n");
}

function buildAnnotationRule(answers: AdaptiveAnswer[] | undefined) {
  if (!answers?.length) {
    return null;
  }

  const ids = answers.map((_, index) => `A${index + 1}`).join("、");
  return [
    "回指标记（重要指令）：",
    `- 本次解读包含用户的具体回应（编号 ${ids}）。`,
    `- 当你的某段分析是直接基于某个回答（如 A1）推导出来时，请务必将该判断相关的「关键短语」用特定的标记包起来。`,
    `- 格式示例：[[a:A1]]你提到的事业转折[[/a]]。其中 A1 对应具体的回答编号。`,
    "- 标记要求：短语长度 4-20 字，必须是自然语句的一部分。严禁包裹整段文字或仅包裹一两个词。",
    "- 数量限制：全篇总计标记 3-5 处即可，不要过度标记。同一自然段最多 2 处。",
    "- 作用：这些标记将用于前端高亮展示，并允许用户悬停查看对应的原始回答。请确保被包裹的短语确实与该回答逻辑相关。",
  ].join("\n");
}

export async function buildInterpretationPayload(input: BuildContextInput) {
  const provider = getKnowledgeProvider();
  const spread = getSpreadBySlug(input.spreadSlug);
  const responseBlueprint = getResponseBlueprint(spread);
  const selectedCards = resolveSelectedCards(spread, input.cards, input.readingIntent);
  const feedbackSummary = summarizeFeedback(selectedCards, input.userFeedback);
  const adaptiveSummary = summarizeAdaptiveAnswers(input.adaptiveAnswers);
  const intentSummary = summarizeIntent(input.readingIntent);
  const combinationSummary = buildCombinationSummary(selectedCards);
  const context = await provider.getContext({
    question: input.question,
    spreadSlug: input.spreadSlug,
    cardIds: input.cards.map((card) => card.cardId),
    locale: input.locale,
  });

  const annotationRule = buildAnnotationRule(input.adaptiveAnswers);

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
    "本次牌组组合意义：",
    combinationSummary,
    "用户直觉反馈：",
    feedbackSummary,
    "适配追问反馈：",
    adaptiveSummary,
    "推理规则：",
    "1. 每个关键判断都必须绑定至少一个依据：牌名、牌阵位置、正逆位、用户反馈或适配追问答案。",
    "2. 先说明牌面事实，再整合用户反馈，再提炼心理状态、核心矛盾、趋势与建议。",
    "3. 若某张牌提供了「领域牌义」，优先用它回应用户选择的领域；基础牌义只作为背景补充，不要反客为主。",
    "4. 权重指令：若提供了「本次牌组组合意义」，应将其作为解读局势结构或核心矛盾的优先依据，而不是只平铺单牌解析。",
    "5. 元素、行星、星象和数字只作为辅助线索：当它们能解释重复模式（多张同号牌）、显著冲突、互补或趋势时再使用。禁止为了显得神秘而硬凑或堆砌这些术语。",
    "6. 用户的适配追问答案只代表看牌后的感受，不要把它当作客观事实。",
    "7. 如果用户没有填写直觉反馈或补充回应，严禁写“用户未填写”“未回答”“无法判断你是否认同/不安”等缺席说明；这类信息不应该呈现给用户。直接解读牌面即可。",
    "8. 不要使用绝对预言（必然、一定、命中注定），用更像是、倾向于、需要注意的表达。",
    "9. 避免巴纳姆式空话，不要说任何人都适用的泛泛描述。",
    "10. 输出要克制精炼，不要写 Markdown 表格，不要逐项复制所有关键词。",
    annotationRule,
    selectedCards.length <= 5
      ? "长度要求：700 到 1000 个中文字符，优先保留核心矛盾和行动建议。"
      : "长度要求：1000 到 1400 个中文字符，复杂牌阵也要整合，不要平铺所有牌。",
    "必须完整结束，不要在句子中间截断；如果篇幅不够，优先压缩分位置解读，保留行动建议和一句总结。",
    "请严格按以下结构输出：",
    ...responseBlueprint.sections,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

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
