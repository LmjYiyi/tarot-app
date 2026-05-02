import type { Suit } from "@/lib/tarot/types";

import type {
  AnalyzeGeneralInput,
  CourtCardProfile,
  GeneralAnalysis,
  QuestionDiagnosis,
  RelationPairs,
  SelectedCardForAnalysis,
} from "./types";

const suitLabels: Record<Suit, string> = {
  cups: "圣杯",
  wands: "权杖",
  swords: "宝剑",
  pentacles: "星币",
};

const suitThemes: Record<Suit, string> = {
  cups: "情绪、关系、感受和亲密需求",
  wands: "行动、欲望、热情和推进节奏",
  swords: "认知、沟通、冲突和判断",
  pentacles: "现实资源、身体、金钱和长期执行",
};

const numberStageHints: Record<number, string> = {
  1: "种子、开始与机会出现",
  2: "选择、对照与关系协调",
  3: "扩展、协作与初步成形",
  4: "稳定、结构、边界或停滞",
  5: "冲突、挑战、损耗与失衡",
  6: "修复、过渡、互助与重新协调",
  7: "评估、防御、辨认与内在测试",
  8: "推进、重复、训练与力量管理",
  9: "临界、成熟、个人承担与接近完成",
  10: "完成、饱和、阶段收束与重分配",
};

const tensionSuitPairs = new Set(["cups:swords", "swords:cups", "wands:pentacles", "pentacles:wands"]);

function analyzeArcana(selectedCards: SelectedCardForAnalysis[]) {
  const total = selectedCards.length || 1;
  const majorCount = selectedCards.filter(({ card }) => card.arcana === "major").length;
  const minorCount = selectedCards.length - majorCount;
  const majorRatio = majorCount / total;
  const eventLevel =
    majorRatio >= 0.45 ? "深层转折" : majorRatio >= 0.2 ? "阶段课题" : "日常事件";

  return {
    majorCount,
    minorCount,
    majorRatio,
    eventLevel,
    note:
      eventLevel === "深层转折"
        ? "大阿卡纳占比较高，解读时应优先看人生阶段、价值选择和不可只靠短期技巧解决的结构性课题。"
        : eventLevel === "阶段课题"
          ? "大阿卡纳有存在感，说明这不只是日常小波动，也涉及阶段性调整。"
          : "小阿卡纳占主导，重点更适合落到具体事件、行为、资源和短期调整。",
  } as const;
}

function analyzeSuits(selectedCards: SelectedCardForAnalysis[]) {
  const counts: Record<Suit, number> = { cups: 0, wands: 0, swords: 0, pentacles: 0 };

  selectedCards.forEach(({ card }) => {
    if (card.suit) counts[card.suit] += 1;
  });

  const max = Math.max(...Object.values(counts));
  const dominantSuits = (Object.keys(counts) as Suit[])
    .filter((suit) => counts[suit] > 0 && counts[suit] === max)
    .map((suit) => `${suitLabels[suit]}（${suitThemes[suit]}）`);
  const missingSuits = (Object.keys(counts) as Suit[])
    .filter((suit) => counts[suit] === 0)
    .map((suit) => `${suitLabels[suit]}（${suitThemes[suit]}）`);

  return {
    counts,
    dominantSuits,
    missingSuits,
    note: [
      dominantSuits.length
        ? `主导花色是${dominantSuits.join("、")}，写作时应让它成为局势底色。`
        : "本次没有明显主导花色，说明议题较分散，需要由牌阵位置决定重心。",
      missingSuits.length
        ? `缺失花色是${missingSuits.join("、")}，可作为盲点或尚未被充分调用的能力。`
        : "四元素都有出现，说明局势牵涉情绪、行动、认知与现实资源的综合协调。",
    ].join(""),
  };
}

function analyzeReversed(selectedCards: SelectedCardForAnalysis[]) {
  const total = selectedCards.length || 1;
  const count = selectedCards.filter(({ orientation }) => orientation === "逆位").length;
  const ratio = count / total;
  const mode = ratio >= 0.6 ? "内化" : ratio >= 0.35 ? "阻滞" : ratio > 0 ? "混合" : "流动";

  return {
    count,
    ratio,
    mode,
    note:
      mode === "内化"
        ? "逆位集中，优先解释为能量内化、延迟、压抑或需要重新校准，而不是简单判坏。"
        : mode === "阻滞"
          ? "逆位比例不低，说明局势有明显卡点，行动建议需要先处理节奏和阻力。"
          : mode === "混合"
            ? "少量逆位提示局部阻滞，可结合所在牌位判断具体哪里需要调整。"
            : "没有逆位，局势较直接，重点在如何顺势推进和承担选择。",
  } as const;
}

function inferCourtRole(card: SelectedCardForAnalysis): CourtCardProfile["roleHint"] {
  const text = `${card.position.name}${card.position.focus}`;
  if (/对方|他人|环境|外部|团队|家人|伴侣/.test(text)) return "环境人物";
  if (/我|自己|个人|态度|内在/.test(text)) return "自己";
  if (/建议|优势|资源|帮助|能力|调整/.test(text)) return "顾问/能力";
  if (/关系|连接|互动/.test(text)) return "对方";
  return "未知角色";
}

function analyzeCourtCards(selectedCards: SelectedCardForAnalysis[]) {
  return selectedCards
    .filter(({ card }) => card.arcana === "minor" && card.number >= 11)
    .map<CourtCardProfile>((selectedCard) => {
      const roleHint = inferCourtRole(selectedCard);

      return {
        cardId: selectedCard.card.id,
        cardName: selectedCard.card.nameZh,
        positionName: selectedCard.position.name,
        roleHint,
        note: `${selectedCard.card.nameZh}落在「${selectedCard.position.name}」，可读作人物、角色策略或需要调用的成熟度；不要武断断定某个现实人物。`,
      };
    });
}

function analyzeNumberStage(selectedCards: SelectedCardForAnalysis[]) {
  const numbers = selectedCards
    .map(({ card }) => card.number)
    .filter((number) => number >= 1 && number <= 10);
  const uniqueNumbers = [...new Set(numbers)].sort((a, b) => a - b);

  if (!uniqueNumbers.length) {
    return {
      numbers: [],
      stageHint: "本次数字阶段线索较少，优先参考大阿卡纳、宫廷牌和牌位关系。",
    };
  }

  const low = uniqueNumbers.filter((number) => number <= 3).length;
  const middle = uniqueNumbers.filter((number) => number >= 4 && number <= 7).length;
  const high = uniqueNumbers.filter((number) => number >= 8).length;
  const dominantStage =
    high >= low && high >= middle ? "后段/收束" : middle >= low ? "中段/调整" : "前段/启动";
  const detail = uniqueNumbers.map((number) => `${number}=${numberStageHints[number]}`).join("；");

  return {
    numbers: uniqueNumbers,
    stageHint: `数字集中在${dominantStage}。可用作阶段感线索：${detail}。`,
  };
}

function cardLabel({ card, position, orientation }: SelectedCardForAnalysis) {
  return `${position.name}的${card.nameZh}（${orientation}）`;
}

function analyzeRelations(selectedCards: SelectedCardForAnalysis[]): RelationPairs {
  const support: string[] = [];
  const tension: string[] = [];

  for (let i = 0; i < selectedCards.length; i += 1) {
    for (let j = i + 1; j < selectedCards.length; j += 1) {
      const left = selectedCards[i];
      const right = selectedCards[j];

      if (left.card.suit && left.card.suit === right.card.suit) {
        support.push(`${cardLabel(left)}与${cardLabel(right)}同属${suitLabels[left.card.suit]}，主题互相强化。`);
      }

      if (left.card.arcana === "major" && right.card.arcana === "major") {
        support.push(`${cardLabel(left)}与${cardLabel(right)}都是大阿卡纳，提示这组牌不只是在讲表面事件。`);
      }

      if (
        left.card.number <= 10 &&
        right.card.number <= 10 &&
        Math.abs(left.card.number - right.card.number) === 1
      ) {
        support.push(`${cardLabel(left)}与${cardLabel(right)}数字相邻，呈现连续阶段。`);
      }

      if (left.card.suit && right.card.suit && tensionSuitPairs.has(`${left.card.suit}:${right.card.suit}`)) {
        tension.push(`${cardLabel(left)}与${cardLabel(right)}形成花色拉扯，需要协调${suitThemes[left.card.suit]}和${suitThemes[right.card.suit]}。`);
      }

      if (left.orientation !== right.orientation) {
        tension.push(`${cardLabel(left)}与${cardLabel(right)}正逆位不同，说明一边较顺、一边仍有阻力。`);
      }
    }
  }

  return {
    support: support.slice(0, 5),
    tension: tension.slice(0, 5),
  };
}

export function diagnoseQuestion(question: string, intent?: AnalyzeGeneralInput["readingIntent"]): QuestionDiagnosis {
  const trimmed = question.trim();
  const issues: string[] = [];
  const flags = {
    highRiskDecision: false,
    absolutePrediction: false,
    preciseTiming: false,
    mindReading: false,
  };
  const safetyDirectives: string[] = [];

  if (/一定|必然|注定|肯定|绝对|会不会|能不能|是不是/.test(trimmed)) {
    flags.absolutePrediction = true;
    issues.push("问题带有绝对预测或二选一倾向，解读时需要改写成趋势、条件和可行动空间。");
    safetyDirectives.push(
      "绝对预测纠偏：必须在开头或风险提醒中说明，本次解读只看趋势、条件和可观察信号，不做绝对承诺。",
    );
  }

  if (/他|她|对方|别人|老板|前任/.test(trimmed) && /想|爱|恨|后悔|联系|回来|喜欢/.test(trimmed)) {
    flags.mindReading = true;
    issues.push("问题可能过度读取他人内心，应把重心拉回互动结构、可观察行为和用户自己的选择。");
    safetyDirectives.push(
      "读心纠偏：不要替他人内心下结论，只能讨论互动模式、可观察行为和用户可选择的回应方式。",
    );
  }

  if (/什么时候|几天|几周|几个月|哪天|多久/.test(trimmed)) {
    flags.preciseTiming = true;
    issues.push("问题带有精确时间期待，塔罗更适合给阶段信号和观察指标，而不是精确日期。");
    safetyDirectives.push(
      "时间纠偏：不要给具体日期或精确承诺，只给本牌阵时间尺度内的观察窗口和阶段信号。",
    );
  }

  const asksForAction = /要不要|该不该|是否|是不是该|能不能|可以不可以|值不值得|适合不适合|选|选择|决定|马上|立刻|现在/.test(
    trimmed,
  );
  const materialRisk = /裸辞|辞职|离职|跳槽|离婚|搬家|借钱|贷款|投资|创业|买房|卖房|退学|休学|移民|手术/.test(
    trimmed,
  );
  const relationshipBreakDecision = /(?:要不要|该不该|是否|是不是该|决定|马上|现在).{0,12}(?:分手|离开这段关系)|(?:分手|离开这段关系).{0,12}(?:要不要|该不该|是否|是不是该|决定|马上|现在)/.test(
    trimmed,
  );
  const impulsiveDecision = intent?.domain === "decision" && /马上|立刻|现在|冲动|all in|梭哈|全部/.test(trimmed);

  if ((asksForAction && materialRisk) || relationshipBreakDecision || impulsiveDecision) {
    flags.highRiskDecision = true;
    issues.push("问题涉及高风险现实决策，解读必须先做安全垫检查，不能只给牌面倾向。");
    safetyDirectives.push(
      materialRisk
        ? "高风险决策安全垫：必须在决策前动作中写明资源/现金流、时间线、替代方案、止损点；不得鼓励冲动裸辞、借钱、投资或其他不可逆行动。"
        : "关系高风险决策安全垫：必须先看沟通边界、支持系统、可暂停空间和观察信号；不得替用户一锤定音。",
    );
  }

  if (!trimmed) {
    issues.push("用户没有写具体问题，需要用牌阵和领域目标补足上下文，但不要在结果中责备用户。");
  }

  const riskLevel =
    flags.highRiskDecision || issues.length >= 2 ? "high" : issues.length === 1 ? "medium" : "low";
  const domainHint = intent?.domain === "decision" ? "我需要比较哪些条件，才能做出更稳的选择？" : "我在这件事里最需要看清什么模式，以及下一步能怎么做？";

  return {
    riskLevel,
    issues,
    flags,
    safetyDirectives,
    suggestedReframe: issues.length ? domainHint : undefined,
  };
}

export function analyzeGeneralStructure(input: AnalyzeGeneralInput): GeneralAnalysis {
  return {
    arcanaProfile: analyzeArcana(input.selectedCards),
    suitProfile: analyzeSuits(input.selectedCards),
    reversedProfile: analyzeReversed(input.selectedCards),
    courtCards: analyzeCourtCards(input.selectedCards),
    numberStage: analyzeNumberStage(input.selectedCards),
    relationPairs: analyzeRelations(input.selectedCards),
  };
}
