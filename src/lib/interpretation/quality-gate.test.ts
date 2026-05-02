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
});
