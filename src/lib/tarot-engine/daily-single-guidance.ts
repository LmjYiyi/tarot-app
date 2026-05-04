import type { DailyAstrologyGuidance } from "@/lib/astrology/daily-guidance";
import {
  getDailyTarotSignatureState,
  getNativeLuckyPool,
  getSuitSemanticProfile,
  type DailyLuckyPool,
} from "@/content/data/daily-tarot-guidance";
import { getCardById } from "@/lib/tarot/catalog";
import type { DrawnCard, TarotCard } from "@/lib/tarot/types";
import type { RetrievedCardContext, TarotEngineContext } from "./types";

type BuildDailySingleGuidanceInput = {
  card: DrawnCard;
  dailyAstrology?: DailyAstrologyGuidance;
  tarotEngineContext?: TarotEngineContext;
};

const seasonalLuckyPool: Record<
  string,
  {
    colors: string[];
    crystals: string[];
  }
> = {
  aries: {
    colors: ["绯红色", "亮橙色", "日出金"],
    crystals: ["红玛瑙", "红碧玉", "太阳石"],
  },
  taurus: {
    colors: ["鼠尾草绿", "奶油白", "大地棕"],
    crystals: ["绿东陵", "粉晶", "黄水晶"],
  },
  gemini: {
    colors: ["浅黄色", "雾蓝色", "银白色"],
    crystals: ["萤石", "白水晶", "蓝晶石"],
  },
  cancer: {
    colors: ["月光白", "海盐蓝", "珍珠色"],
    crystals: ["月光石", "珍珠", "海蓝宝"],
  },
  leo: {
    colors: ["灿金色", "暖橙色", "蜂蜜黄"],
    crystals: ["太阳石", "虎眼石", "黄水晶"],
  },
  virgo: {
    colors: ["橄榄绿", "浅灰色", "亚麻白"],
    crystals: ["橄榄石", "茶晶", "白水晶"],
  },
  libra: {
    colors: ["柔粉色", "象牙白", "浅绿色"],
    crystals: ["粉晶", "青金石", "白水晶"],
  },
  scorpio: {
    colors: ["酒红色", "墨黑色", "暗紫色"],
    crystals: ["黑曜石", "石榴石", "黑玛瑙"],
  },
  sagittarius: {
    colors: ["宝蓝色", "亮洋红", "皇家紫"],
    crystals: ["紫水晶", "绿松石", "黄铁矿"],
  },
  capricorn: {
    colors: ["炭褐色", "深灰色", "苔藓绿"],
    crystals: ["黑碧玺", "赤铁矿", "茶晶"],
  },
  aquarius: {
    colors: ["电光蓝", "星光银", "罗兰紫"],
    crystals: ["海蓝宝", "天青石", "白水晶"],
  },
  pisces: {
    colors: ["海藻绿", "珠光银", "湖蓝色"],
    crystals: ["月光石", "紫水晶", "海蓝宝"],
  },
};

function cleanText(value: string | undefined | null) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function pickMeaning(
  card: TarotCard,
  reversed: boolean,
  field: "love" | "career" | "finance",
  context?: RetrievedCardContext | null,
) {
  const contextText = resolveContextMeaning(context, field);
  if (contextText) return contextText;

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

function resolveContextMeaning(
  context: RetrievedCardContext | null | undefined,
  field: "love" | "career" | "finance",
) {
  if (!context) return "";

  const precise = context.contextPositionMeaning;
  const profile = context.contextMeaning;
  const candidates = [
    field === "career" ? precise?.advice_direction : null,
    precise?.position_reading,
    profile?.core_reading,
    profile?.advice,
  ];

  const matched = candidates.find(
    (value): value is string => typeof value === "string" && cleanText(value).length > 0,
  );

  return cleanText(matched);
}

function trimToSentence(value: string, fallback: string) {
  const text = cleanText(value || fallback);
  if (text.length <= 95) return text;

  const boundary = text.slice(0, 95).search(/[。！？.!?][^。！？.!?]*$/u);
  if (boundary > 30) return text.slice(0, boundary + 1);
  return `${text.slice(0, 92)}...`;
}

function hashSeed(seed: string) {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function pickSeeded(values: string[], seed: string) {
  const list = unique(values);
  if (!list.length) return "";
  return list[hashSeed(seed) % list.length];
}

function resolveLuckyChoice(input: {
  card: TarotCard;
  reversed: boolean;
  astrology?: DailyAstrologyGuidance;
}) {
  const nativePool = getNativeLuckyPool(input.card);
  const seasonPool = input.astrology
    ? seasonalLuckyPool[input.astrology.signId]
    : undefined;
  const combined: DailyLuckyPool = {
    ruler: nativePool.ruler,
    candidateColors: unique([
      ...nativePool.candidateColors,
      ...(seasonPool?.colors ?? []),
    ]),
    candidateCrystals: unique([
      ...nativePool.candidateCrystals,
      ...(seasonPool?.crystals ?? []),
    ]),
  };
  const seedBase = [
    input.card.id,
    input.reversed ? "reversed" : "upright",
    input.astrology?.resolvedForDate ?? "no-date",
    input.astrology?.signId ?? "no-sign",
  ].join("|");

  return {
    color: pickSeeded(combined.candidateColors, `${seedBase}:color`),
    crystal: pickSeeded(combined.candidateCrystals, `${seedBase}:crystal`),
    ruler: combined.ruler,
  };
}

function pickFrom<T>(values: readonly T[], seed: string) {
  return values[hashSeed(seed) % values.length];
}

function resolveToneKit(input: {
  card: TarotCard;
  reversed: boolean;
  astrology?: DailyAstrologyGuidance;
}) {
  const suitProfile = getSuitSemanticProfile(input.card);
  const seed = [
    input.card.id,
    input.reversed ? "reversed" : "upright",
    input.astrology?.resolvedForDate ?? "no-date",
  ].join("|");

  const suitKits = {
    wands: {
      loveAction: ["主动表达一点热情", "给关系一点正向回应", "把想靠近的意图说得简单些"],
      careerAction: ["先启动一个小任务", "把想法落到一个动作上", "把拖着的事开个头"],
      financeAction: ["暂停冲动消费", "把精力投向更值得的地方", "先确认资源够不够支撑行动"],
      tipAction: ["做一件能让事情开始的小事", "把一个念头变成三分钟行动", "给今天一点可见的推进"],
    },
    cups: {
      loveAction: ["照顾一次真实感受", "温柔确认彼此的情绪", "把一句关心说出口"],
      careerAction: ["先处理协作里的感受误差", "用更柔和的方式沟通需求", "别让情绪替你做决定"],
      financeAction: ["分清想要和需要", "别用消费安抚一整天的情绪", "先看这笔支出带来的是滋养还是空缺"],
      tipAction: ["给自己留十分钟安静时间", "把感受写成一句话", "做一件让心软下来但边界还在的小事"],
    },
    swords: {
      loveAction: ["少猜一点，直接确认一句", "把边界说得清楚但不刺人", "先分清事实和脑内推演"],
      careerAction: ["整理一个判断依据", "把信息重新排序", "写下最需要确认的一句话"],
      financeAction: ["看清数字再决定", "把支出和焦虑分开", "先核对账目而不是凭感觉行动"],
      tipAction: ["删掉一个不必要的猜测", "发出一句清楚的确认", "把脑子里的混乱写成三条事实"],
    },
    pentacles: {
      loveAction: ["用一个实际动作表达稳定", "别只说感受，也给出一点照顾", "看关系里有没有可靠的日常支持"],
      careerAction: ["完成一个可交付的小环节", "把桌面或待办整理到可执行", "先守住节奏，再谈扩张"],
      financeAction: ["检查一笔固定支出", "把今天的资源流向记下来", "先稳住预算里的一个细节"],
      tipAction: ["整理一个现实细节", "让身体先落地：喝水、走路或收拾桌面", "把今天最小的一件事做稳"],
    },
    major: {
      loveAction: ["观察关系正在进入哪个阶段", "别急着定性，先看这张牌点亮的主题", "把关系里的核心感受放到台面上"],
      careerAction: ["把今天当成阶段提醒，而不是结果判定", "先确认方向感，再决定动作", "看清这件事背后的主线"],
      financeAction: ["把资源问题放进更大的阶段里看", "别用一时数字定义长期安全感", "先看这笔资源服务于什么主题"],
      tipAction: ["把这张牌收成一个今天能完成的小提醒", "找一个动作承接这张牌的主题", "用一件小事回应今天的阶段感"],
    },
  } as const;
  const kit = suitKits[suitProfile.suit];
  const indexSalt = input.reversed ? "r" : "u";

  return {
    loveAction: pickFrom(kit.loveAction, `${seed}:love:${indexSalt}`),
    careerAction: pickFrom(kit.careerAction, `${seed}:career:${indexSalt}`),
    financeAction: pickFrom(kit.financeAction, `${seed}:finance:${indexSalt}`),
    tipAction: pickFrom(kit.tipAction, `${seed}:tip:${indexSalt}`),
    relationshipBridge: input.reversed
      ? "今天先别急着修正别人，比较适合看见自己哪里正在收紧。"
      : "今天不必追求戏剧化进展，能多一点清楚或平稳，就已经算数。",
    careerBridge: input.reversed
      ? "与其硬推，不如先找出真正卡住的环节。"
      : "这股能量适合被放进一个很小但可执行的步骤里。",
    financeBridge: input.reversed
      ? "焦虑上来时，先不要用花钱或过度控制来换安全感。"
      : "资源感会从一个清楚的小安排里慢慢回来。",
  };
}

function createTextStream(text: string) {
  const encoder = new TextEncoder();
  const chunks = text.split(/(\n{2,}|\n|。|！|？|；)/u).filter(Boolean);

  return new ReadableStream<Uint8Array>({
    start(controller) {
      let index = 0;

      function push() {
        if (index >= chunks.length) {
          controller.close();
          return;
        }

        controller.enqueue(encoder.encode(chunks[index]));
        index += 1;
        setTimeout(push, chunks[index - 1].includes("\n") ? 170 : 72);
      }

      push();
    },
  });
}

function fallbackText() {
  return [
    "今日感情",
    "今天这张牌暂时没有找到完整牌义，所以先把它当成一个轻提醒：别急着替关系下结论，先看自己真实的感受。",
    "",
    "今日事业",
    "适合把注意力放回一个具体任务。完成一点点，也比反复想很多更有帮助。",
    "",
    "今日财运",
    "今天不适合把牌当成财务建议。更适合检查支出、资源和承诺有没有让自己更踏实。",
    "",
    "温馨小tips",
    "把今天当成一次轻轻的 check-in 就好。做一件能让心情落地的小事，然后继续生活。",
  ].join("\n");
}

export function buildDailySingleGuidanceText(input: BuildDailySingleGuidanceInput) {
  const card = getCardById(input.card.cardId);
  const reversed = input.card.reversed;
  const orientation = reversed ? "逆位" : "正位";

  if (!card) return fallbackText();

  const astrology = input.dailyAstrology;
  const retrievedCardContext = input.tarotEngineContext?.cardContexts[0] ?? null;
  const suitProfile = getSuitSemanticProfile(card);
  const signatureState = getDailyTarotSignatureState(card, reversed);
  const lucky = resolveLuckyChoice({ card, reversed, astrology });
  const toneKit = resolveToneKit({ card, reversed, astrology });
  const keywords = (reversed ? card.keywordsReversed : card.keywordsUpright)
    .slice(0, 3)
    .join("、");
  const love = trimToSentence(
    signatureState?.emotionShort ?? pickMeaning(card, reversed, "love", retrievedCardContext),
    reversed ? card.meaningReversed : card.meaningUpright,
  );
  const career = trimToSentence(
    signatureState?.careerShort ?? pickMeaning(card, reversed, "career", retrievedCardContext),
    reversed ? card.meaningReversed : card.meaningUpright,
  );
  const finance = trimToSentence(
    signatureState?.wealthShort ?? pickMeaning(card, reversed, "finance", retrievedCardContext),
    reversed ? card.meaningReversed : card.meaningUpright,
  );
  const astrologyLead = astrology
    ? `今天落在${astrology.signNameZh}季节，${astrology.elementNameZh}的底色提醒你：${astrology.dailyFocus}`
    : "今天的星座小提醒先轻轻放在这里：把注意力收回当下。";
  const watchPoint = astrology?.watchPoint ?? "别把一张牌读成一整天的命运。";
  const rulerPhrase = lucky.ruler ? `这张牌的能量也带着${lucky.ruler}的象征感。` : "";
  const dailyReminder =
    signatureState?.dailyReminder ?? suitProfile.dailyReminderLead;
  const microAction = signatureState?.microAction ?? toneKit.tipAction;
  const suitableToDo = signatureState?.suitableToDo.length
    ? pickSeeded(signatureState.suitableToDo, `${card.id}:${orientation}:suitable`)
    : toneKit.careerAction;
  const unsuitableToDo = signatureState?.unsuitableToDo.length
    ? pickSeeded(signatureState.unsuitableToDo, `${card.id}:${orientation}:unsuitable`)
    : toneKit.financeAction;

  return [
    "今日感情",
    `${card.nameZh}（${card.nameEn}，${orientation}）把今天的关系提醒放在“${keywords || card.nameZh}”上。${love}${toneKit.relationshipBridge}可以试着${toneKit.loveAction}。`,
    "",
    "今日事业",
    `${career}${suitProfile.priorityField === "careerShort" ? ` ${dailyReminder}` : ""}${toneKit.careerBridge}今天适合${suitableToDo}。`,
    "",
    "今日财运",
    `${finance}${suitProfile.priorityField === "wealthShort" ? ` ${dailyReminder}` : ""}这不是投资或消费判断，只是一个资源感提醒。${toneKit.financeBridge}今天先避开${unsuitableToDo}。`,
    "",
    "温馨小tips",
    `${astrologyLead}${watchPoint}${rulerPhrase}${dailyReminder} 结合这张${card.nameZh}，今天的小动作是：${microAction}幸运色可以选${lucky.color}，幸运水晶可以参考${lucky.crystal}。`,
  ].join("\n");
}

export function createDailySingleGuidanceStream(text: string) {
  return createTextStream(text);
}
