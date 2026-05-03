import type { TarotEngineContext } from "./types";

export type TarotQualityResult = {
  passed: boolean;
  score: number;
  checks: {
    answersQuestion: boolean;
    readsCards: boolean;
    usesPositions: boolean;
    usesKbContext: boolean;
    usesCombinations: boolean;
    avoidsAbsolutePrediction: boolean;
    avoidsThirdPartyMindReading: boolean;
    safetyPassed: boolean;
    hasActionableAdvice: boolean;
    soundsLikeHumanReader: boolean;
  };
  issues: string[];
  repairInstruction?: string;
};

type QualityGateInput = {
  outputText: string;
  tarotEngineContext: TarotEngineContext;
  pipeline: string;
};

const ABSOLUTE_PATTERNS = [
  /一定会/u,
  /必然/u,
  /注定/u,
  /绝对(?:会|是|没|不可能|没有|不会)/u,
  /百分百/u,
  /肯定会/u,
  /彻底没希望/u,
  /永远不会/u,
  /没有任何机会/u,
];

const THIRD_PARTY_MIND_READING_PATTERNS = [
  /(?:他|她|TA|对方)一定.*(?:爱你|喜欢你|想你)/u,
  /(?:他|她|TA|对方)肯定.*(?:想|爱|喜欢)/u,
  /(?:他|她|TA|对方)心里就是/u,
  /(?:他|她|TA|对方)已经不爱你/u,
  /(?:他|她|TA|对方)根本不爱你/u,
];

const ACTION_PATTERNS = [
  /建议/u,
  /可以先/u,
  /你可以/u,
  /下一步/u,
  /更适合/u,
  /不妨/u,
  /先不要/u,
  /观察/u,
  /确认/u,
];

const HUMAN_READER_PATTERNS = [
  /更像/u,
  /牌面/u,
  /这组牌/u,
  /这个位置/u,
  /倾向/u,
  /提醒/u,
  /不是.*绝对/u,
];

const HIGH_RISK_BOUNDARY_PATTERNS = [
  /不能/u,
  /不适合/u,
  /建议.*(?:医生|律师|专业|医院|咨询)/u,
  /专业/u,
  /现实支持/u,
  /不能.*(?:诊断|判断|预测|替代)/u,
];

const HIGH_RISK_VIOLATION_PATTERNS = [
  /(?:病|疾病|怀孕|癌症|症状).*(?:一定会好|不会恶化|会恶化|严重|不严重)/u,
  /(?:官司|诉讼|合同).*(?:一定赢|一定输|肯定赢|肯定输)/u,
  /(?:股票|基金|投资|币).*(?:可以买|一定涨|一定赚|稳赚|不会亏)/u,
  /(?:死亡|灾祸|灾难).*(?:会发生|不会发生|注定)/u,
];

function normalizeText(text: string) {
  return text.replace(/\s+/g, "");
}

function unique(values: Array<string | undefined | null>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function getCardNames(context: TarotEngineContext) {
  return unique(
    context.cardContexts.flatMap((item) => [
      item.appCard.nameZh,
      item.contextMeaning?.card_name_cn,
      item.contextPositionMeaning?.card_name_cn,
    ]),
  );
}

function getPositionNames(context: TarotEngineContext) {
  return unique(
    context.cardContexts.flatMap((item) => [
      item.appPosition?.name,
      item.contextPositionMeaning?.position_name_cn,
      item.positionRule?.name_cn,
      item.kbPositionId,
    ]),
  );
}

function likelyThirdPartyMindReading(context: TarotEngineContext) {
  return context.questionMatches.some(({ item }) => item.intent.includes("third_party"));
}

function hasPattern(patterns: RegExp[], text: string) {
  return patterns.some((pattern) => pattern.test(text));
}

export function qualityCheckByRules(input: QualityGateInput): TarotQualityResult {
  const outputText = input.outputText.trim();
  const compactOutput = normalizeText(outputText);
  const issues: string[] = [];
  const cardNames = getCardNames(input.tarotEngineContext);
  const positionNames = getPositionNames(input.tarotEngineContext);
  const hasSafetyHits = input.tarotEngineContext.safetyMatches.length > 0;
  const answersQuestion = outputText.length >= 120;
  const readsCards =
    hasSafetyHits ||
    cardNames.length > 0 && cardNames.every((name) => compactOutput.includes(normalizeText(name)));
  const usesPositions =
    hasSafetyHits ||
    positionNames.length > 0 &&
    positionNames.some((name) => compactOutput.includes(normalizeText(name)));
  const usesKbContext = input.tarotEngineContext.cardContexts.some(
    (item) => Boolean(item.contextPositionMeaning) || Boolean(item.contextMeaning),
  );
  const usesCombinations =
    input.tarotEngineContext.pairContexts.length === 0 ||
    input.tarotEngineContext.pairContexts.some((pair) => {
      const source = pair.curated ?? pair.highFrequency ?? pair.base;
      return Boolean(
        source?.theme && compactOutput.includes(normalizeText(String(source.theme).slice(0, 8))),
      );
    }) ||
    /组合|联动|牌与牌|一起/.test(outputText);
  const avoidsAbsolutePrediction = !hasPattern(ABSOLUTE_PATTERNS, outputText);
  const avoidsThirdPartyMindReading =
    !likelyThirdPartyMindReading(input.tarotEngineContext) ||
    !hasPattern(THIRD_PARTY_MIND_READING_PATTERNS, outputText);
  const safetyPassed =
    (!hasSafetyHits || hasPattern(HIGH_RISK_BOUNDARY_PATTERNS, outputText)) &&
    !hasPattern(HIGH_RISK_VIOLATION_PATTERNS, outputText);
  const hasActionableAdvice = hasPattern(ACTION_PATTERNS, outputText);
  const soundsLikeHumanReader = hasPattern(HUMAN_READER_PATTERNS, outputText);

  const checks = {
    answersQuestion,
    readsCards,
    usesPositions,
    usesKbContext,
    usesCombinations,
    avoidsAbsolutePrediction,
    avoidsThirdPartyMindReading,
    safetyPassed,
    hasActionableAdvice,
    soundsLikeHumanReader,
  };

  let score = 100;

  if (!answersQuestion) {
    score -= 15;
    issues.push("输出过短或没有充分回答用户问题。");
  }

  if (!readsCards) {
    score -= 20;
    issues.push("没有完整读到抽到的牌。");
  }

  if (!usesPositions) {
    score -= 15;
    issues.push("没有明显结合牌位解释。");
  }

  if (!usesKbContext) {
    score -= 15;
    issues.push("没有使用 KB 检索上下文。");
  }

  if (!usesCombinations) {
    score -= 5;
    issues.push("没有体现组合牌或牌间联动。");
  }

  if (!avoidsAbsolutePrediction) {
    score -= 20;
    issues.push("出现了过度绝对化或宿命化表达。");
  }

  if (!avoidsThirdPartyMindReading) {
    score -= 20;
    issues.push("存在替第三方读心的风险。");
  }

  if (!safetyPassed) {
    score -= 40;
    issues.push("命中安全规则后，没有正确降级或提示边界。");
  }

  if (!hasActionableAdvice) {
    score -= 10;
    issues.push("缺少可执行建议。");
  }

  if (!soundsLikeHumanReader) {
    score -= 5;
    issues.push("语气偏机械，缺少真人占卜师式表达。");
  }

  score = Math.max(0, score);

  return {
    passed: score >= 75 && safetyPassed,
    score,
    checks,
    issues,
    repairInstruction: issues.length ? `请修复以下问题：${issues.join("；")}` : undefined,
  };
}
