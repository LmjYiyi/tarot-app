import { describe, expect, it } from "vitest";

import { runQualityGate } from "./quality-gate";
import type { QuestionDiagnosis } from "./analysis/types";
import type { SpreadReadingTemplate } from "./templates";

const template: SpreadReadingTemplate = {
  slug: "path-of-choice",
  purpose: "比较 A/B 两条路径。",
  sections: [
    "1. 牌面先说",
    "2. 两个选择的本质差异",
    "3. 路径 A 的机会与代价",
    "4. 路径 B 的机会与代价",
    "5. 隐藏变量",
    "6. 决策前动作",
    "7. 观察指标",
  ],
  instruction: "比较条件和代价。",
  positionWeights: {},
  timeScope: {
    defaultWindow: "未来 1-6 周",
    observationWindow: "未来 1-2 周",
    note: "只看观察窗口。",
  },
  positionRules: [],
  relationRules: [],
  forbiddenPatterns: [],
  length: { min: 700, max: 1200 },
  maxTokens: 2000,
};

const highRiskDiagnosis: QuestionDiagnosis = {
  riskLevel: "high",
  issues: ["高风险决策"],
  flags: {
    highRiskDecision: true,
    absolutePrediction: true,
    preciseTiming: true,
    mindReading: false,
  },
  safetyDirectives: [],
};

describe("runQualityGate", () => {
  it("repairs missing safety cushion and A/B labels", () => {
    const result = runQualityGate(
      [
        "1. 牌面先说",
        "",
        "可以比较两条路的节奏。",
        "",
        "2. 两个选择的本质差异",
        "一边是休息，一边是等待。",
        "",
        "3. 路径 A 的机会与代价",
        "机会是恢复，代价是收入压力。",
        "",
        "4. 路径 B 的机会与代价",
        "机会是更稳，代价是继续消耗。",
        "",
        "5. 隐藏变量",
        "关键是身体和资源。",
        "",
        "6. 决策前动作",
        "先列清楚当前条件。",
        "",
        "7. 观察指标",
        "未来 1-2 周看反馈。",
      ].join("\n"),
      {
        question: "我现在要不要裸辞？A是马上辞职休息，B是继续忍到找到下家。",
        template,
        diagnosis: highRiskDiagnosis,
      },
    );

    expect(result.text).toContain("不做绝对承诺");
    expect(result.text).toContain("现金流");
    expect(result.text).toContain("时间线");
    expect(result.text).toContain("替代方案");
    expect(result.text).toContain("止损点");
    expect(result.text).toContain("路径 A 指「马上辞职休息」");
    expect(result.text).toContain("路径 B 指「继续忍到找到下家」");
  });

  it("requests retry for absolute promises", () => {
    const result = runQualityGate("1. 牌面先说\n你一定会成功。", {
      question: "我一定会成功吗？",
      template,
      diagnosis: highRiskDiagnosis,
    });

    expect(result.needsRetry).toBe(true);
    expect(result.issues.map((issue) => issue.id)).toContain("absolute-language");
  });

  it("does not synthesize placeholder sections during repair", () => {
    const result = runQualityGate(
      [
        "1. 牌面先说",
        "火锅和螺蛳粉代表两种不同满足方式。",
        "",
        "2. 两个选择的本质差异",
        "火锅偏热闹，螺蛳粉偏个人化。",
      ].join("\n"),
      {
        question: "今晚是去吃火锅，还是螺蛳粉？",
        template,
        diagnosis: {
          riskLevel: "low",
          issues: [],
          flags: {
            highRiskDecision: false,
            absolutePrediction: false,
            preciseTiming: false,
            mindReading: false,
          },
          safetyDirectives: [],
        },
      },
    );

    expect(result.needsRetry).toBe(true);
    expect(result.text).not.toContain("这一节用于");
    expect(result.text).not.toContain("不新增用户没有提供的背景");
    expect(result.issues.map((issue) => issue.id)).toContain("missing-section:路径 A 的机会与代价");
  });

  it("does not require a money checklist for relationship grief", () => {
    const result = runQualityGate(
      [
        "1. 牌面先说",
        "圣杯四把重点放在情绪停歇和重新照顾自己。分手三个月后仍然会在深夜哭出来，并不说明你恢复失败，而是说明关系留下的空位还没有被新的生活节奏温柔接住。",
        "",
        "2. 牌面线索",
        "这张牌提醒你先承认夜里的孤独感。它不是要求你马上振作，而是让你看见自己正在从强烈的失去感里慢慢回到身体、睡眠和日常。",
        "",
        "3. 当前提醒",
        "现在不需要把恢复速度当成考试。比起问自己为什么还没好，更重要的是辨认哪些时刻最容易坠下去，哪些人、空间或动作能把你稍微托住。",
        "",
        "4. 今日行动",
        "今晚给自己留一个具体的安顿动作：洗澡、换干净床单、给可信任的人发一句很短的消息，或把最难受的三句话写下来。动作要小，重点是让自己被照顾到。",
        "",
        "5. 观察指标",
        "未来 3 天观察哭完之后是否更能被支持。看孤独感是否从完全吞没你，变成可以被命名、被陪伴、被安放一点点。",
      ].join("\n"),
      {
        question: "分手三个月了，我还是在深夜会突然大哭。我该如何处理这种像黑洞一样的孤独感？",
        template: {
          ...template,
          slug: "single-guidance",
          sections: ["1. 牌面先说", "2. 牌面线索", "3. 当前提醒", "4. 今日行动", "5. 观察指标"],
        },
        diagnosis: {
          riskLevel: "low",
          issues: [],
          flags: {
            highRiskDecision: false,
            absolutePrediction: false,
            preciseTiming: false,
            mindReading: false,
          },
          safetyDirectives: [],
        },
      },
    );

    expect(result.needsRetry).toBe(false);
    expect(result.text).not.toContain("现金流");
    expect(result.text).not.toContain("止损点");
  });
});
