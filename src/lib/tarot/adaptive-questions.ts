import type {
  AdaptiveQuestion,
  DrawnCard,
  ReadingDomain,
  ReadingGoal,
  ReadingIntent,
  SpreadDefinition,
  TarotCard,
  UserFeedback,
} from "@/lib/tarot/types";

type ResolvedDrawnCard = {
  card: TarotCard;
  reversed: boolean;
  positionOrder: number;
};

type SelectAdaptiveQuestionsInput = {
  intent: ReadingIntent;
  spread: SpreadDefinition;
  cards: ResolvedDrawnCard[];
  feedback: UserFeedback;
  maxQuestions?: number;
};

const feelingOptions = [
  { value: "want_to_move", label: "想往前走" },
  { value: "want_to_hide", label: "想躲一下" },
  { value: "held_back", label: "像被按住" },
  { value: "conflicted", label: "两边拉扯" },
  { value: "clearer", label: "反而更清楚" },
  { value: "numb", label: "没什么感觉" },
];

export const adaptiveQuestions: AdaptiveQuestion[] = [
  {
    id: "career-action-temperature",
    stage: "post_feedback",
    domain: "career",
    goal: "trend",
    trigger: "career + wands or trend",
    question: "看完这组牌，你身体里更明显的是想推进，还是想先停住？",
    answerType: "single_choice",
    options: feelingOptions,
    priority: 90,
  },
  {
    id: "career-pressure-location",
    stage: "post_feedback",
    domain: "career",
    goal: "obstacle",
    trigger: "career obstacle",
    question: "这组牌里那种压力更像压在外部环境上，还是压在你自己身上？",
    answerType: "single_choice",
    options: [
      { value: "outside", label: "外部环境" },
      { value: "inside", label: "自己身上" },
      { value: "both", label: "两边都有" },
      { value: "unclear", label: "说不上来" },
    ],
    priority: 88,
  },
  {
    id: "love-distance-feeling",
    stage: "post_feedback",
    domain: "love",
    goal: "any",
    trigger: "love relationship",
    question: "看完这组牌，你更先感到靠近、距离、委屈，还是不确定？",
    answerType: "single_choice",
    options: [
      { value: "closer", label: "想靠近" },
      { value: "distance", label: "有距离" },
      { value: "hurt", label: "有委屈" },
      { value: "uncertain", label: "不确定" },
      { value: "calm", label: "比较平静" },
    ],
    priority: 90,
  },
  {
    id: "relationship-body-signal",
    stage: "post_feedback",
    domain: "relationship",
    goal: "any",
    trigger: "relationship bridge",
    question: "这组牌让你最明显的身体反应是什么？",
    answerType: "single_choice",
    options: [
      { value: "tight", label: "胸口发紧" },
      { value: "tired", label: "累" },
      { value: "soft", label: "变柔软" },
      { value: "alert", label: "警觉" },
      { value: "blank", label: "空白" },
    ],
    priority: 86,
  },
  {
    id: "self-inner-need",
    stage: "post_feedback",
    domain: "self",
    goal: "any",
    trigger: "self state",
    question: "如果这组牌在替你的内在说话，它更像是在要休息、要边界、要表达，还是要改变？",
    answerType: "single_choice",
    options: [
      { value: "rest", label: "要休息" },
      { value: "boundary", label: "要边界" },
      { value: "expression", label: "要表达" },
      { value: "change", label: "要改变" },
      { value: "company", label: "要被陪伴" },
    ],
    priority: 90,
  },
  {
    id: "decision-felt-choice",
    stage: "post_feedback",
    domain: "decision",
    goal: "decision",
    trigger: "choice spread",
    question: "不考虑现实理由，只看牌面感受，哪一边让你更放松一点？",
    answerType: "single_choice",
    options: [
      { value: "a", label: "A 更放松" },
      { value: "b", label: "B 更放松" },
      { value: "neither", label: "都不放松" },
      { value: "both", label: "都还可以" },
      { value: "unclear", label: "说不上来" },
    ],
    priority: 92,
  },
  {
    id: "study-energy-state",
    stage: "post_feedback",
    domain: "study",
    goal: "any",
    trigger: "study",
    question: "这组牌让你对学习这件事更像是有劲、焦虑、麻木，还是想重新开始？",
    answerType: "single_choice",
    options: [
      { value: "energized", label: "有劲" },
      { value: "anxious", label: "焦虑" },
      { value: "numb", label: "麻木" },
      { value: "restart", label: "想重启" },
      { value: "resistant", label: "有抗拒" },
    ],
    priority: 88,
  },
  {
    id: "swords-pressure",
    stage: "post_feedback",
    domain: "any",
    goal: "any",
    trigger: "swords present",
    question: "如果把这组牌里的压力说成一种声音，它更像催促、批评、担心，还是沉默？",
    answerType: "single_choice",
    options: [
      { value: "push", label: "催促" },
      { value: "criticize", label: "批评" },
      { value: "worry", label: "担心" },
      { value: "silent", label: "沉默" },
      { value: "mixed", label: "混在一起" },
    ],
    priority: 72,
  },
  {
    id: "cups-relationship",
    stage: "post_feedback",
    domain: "any",
    goal: "any",
    trigger: "cups present",
    question: "牌里最触动你的情绪更接近想被理解、想被回应、想放下，还是怕失望？",
    answerType: "single_choice",
    options: [
      { value: "understood", label: "想被理解" },
      { value: "responded", label: "想被回应" },
      { value: "let_go", label: "想放下" },
      { value: "disappointed", label: "怕失望" },
      { value: "unclear", label: "说不上来" },
    ],
    priority: 70,
  },
  {
    id: "pentacles-reality",
    stage: "post_feedback",
    domain: "any",
    goal: "any",
    trigger: "pentacles present",
    question: "这组牌让你对现实层面的感受更像安心、沉重、不够、还是想稳一点？",
    answerType: "single_choice",
    options: [
      { value: "safe", label: "安心" },
      { value: "heavy", label: "沉重" },
      { value: "not_enough", label: "不够" },
      { value: "want_stable", label: "想稳一点" },
      { value: "unclear", label: "说不上来" },
    ],
    priority: 68,
  },
  {
    id: "wands-action",
    stage: "post_feedback",
    domain: "any",
    goal: "any",
    trigger: "wands present",
    question: "这组牌里的行动感更像热起来了、急起来了、被压住了，还是还没点燃？",
    answerType: "single_choice",
    options: [
      { value: "warm", label: "热起来了" },
      { value: "urgent", label: "急起来了" },
      { value: "suppressed", label: "被压住了" },
      { value: "not_lit", label: "还没点燃" },
      { value: "unclear", label: "说不上来" },
    ],
    priority: 66,
  },
  {
    id: "major-life-theme",
    stage: "post_feedback",
    domain: "any",
    goal: "any",
    trigger: "major arcana present",
    question: "这组牌带来的感觉更像一个阶段在开始、结束、卡住，还是被迫看清？",
    answerType: "single_choice",
    options: [
      { value: "beginning", label: "阶段开始" },
      { value: "ending", label: "阶段结束" },
      { value: "stuck", label: "卡住" },
      { value: "seeing", label: "被迫看清" },
      { value: "unclear", label: "说不上来" },
    ],
    priority: 60,
  },
];

function domainMatches(question: AdaptiveQuestion, domain: ReadingDomain) {
  return question.domain === "any" || question.domain === domain;
}

function goalMatches(question: AdaptiveQuestion, goal: ReadingGoal) {
  return !question.goal || question.goal === "any" || question.goal === goal;
}

function triggerScore(question: AdaptiveQuestion, cards: ResolvedDrawnCard[], spread: SpreadDefinition) {
  const hasSuit = (suit: TarotCard["suit"]) => cards.some(({ card }) => card.suit === suit);
  const hasMajor = cards.some(({ card }) => card.arcana === "major");
  const reversedCount = cards.filter((card) => card.reversed).length;
  const trigger = question.trigger ?? "";

  let score = 0;

  if (trigger.includes("wands") && hasSuit("wands")) score += 12;
  if (trigger.includes("cups") && hasSuit("cups")) score += 12;
  if (trigger.includes("swords") && hasSuit("swords")) score += 12;
  if (trigger.includes("pentacles") && hasSuit("pentacles")) score += 12;
  if (trigger.includes("major") && hasMajor) score += 8;
  if (trigger.includes("choice") && spread.slug === "path-of-choice") score += 16;
  if (trigger.includes("relationship") && spread.slug.includes("relationship")) score += 12;
  if (reversedCount >= Math.max(2, Math.ceil(cards.length / 3))) score += 4;

  return score;
}

export function selectAdaptiveQuestions({
  intent,
  spread,
  cards,
  maxQuestions = 1,
}: SelectAdaptiveQuestionsInput): AdaptiveQuestion[] {
  return adaptiveQuestions
    .filter((question) => domainMatches(question, intent.domain))
    .filter((question) => goalMatches(question, intent.goal))
    .map((question) => ({
      question,
      score: (question.priority ?? 0) + triggerScore(question, cards, spread),
    }))
    .sort((a, b) => b.score - a.score || a.question.id.localeCompare(b.question.id))
    .slice(0, maxQuestions)
    .map(({ question }) => question);
}

export function getDefaultIntentForSpread(spreadSlug: string): ReadingIntent {
  if (spreadSlug === "career-five") return { domain: "career", goal: "trend" };
  if (spreadSlug === "relationship-six" || spreadSlug === "lovers-pyramid") {
    return { domain: "relationship", goal: "other_view" };
  }
  if (spreadSlug === "path-of-choice") return { domain: "decision", goal: "decision" };
  if (spreadSlug === "self-state") return { domain: "self", goal: "advice" };
  return { domain: "self", goal: "advice" };
}

export function normalizeDrawnCards(cards: DrawnCard[], resolvedCards: ResolvedDrawnCard[]) {
  return cards
    .map((drawnCard) =>
      resolvedCards.find(
        ({ card, positionOrder }) =>
          card.id === drawnCard.cardId && positionOrder === drawnCard.positionOrder,
      ),
    )
    .filter((card): card is ResolvedDrawnCard => Boolean(card));
}
