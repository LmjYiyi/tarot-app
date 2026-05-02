import { describe, expect, it } from "vitest";

import { getSpreadReadingTemplate } from "./templates";
import { sanitizeInterpretationText, shouldNeutralizeRelationshipPronouns } from "./output";

describe("sanitizeInterpretationText", () => {
  it("removes prompt leakage, markdown dividers and unsafe combination copy", () => {
    const template = getSpreadReadingTemplate("self-state");
    const text = [
      "---",
      "组合意义中，你喜欢的个性让身边的每个人都嫉妒。",
      "",
      "根据规则，这里需要调整。",
    ].join("\n");

    const sanitized = sanitizeInterpretationText(text, template);

    expect(sanitized).toContain("1. 牌面先说");
    expect(sanitized).not.toContain("---");
    expect(sanitized).not.toContain("组合意义中");
    expect(sanitized).not.toContain("根据规则");
    expect(sanitized).not.toContain("嫉妒");
    expect(sanitized).toContain("外在评价");
  });

  it("fills an empty first conclusion section from the next section body", () => {
    const template = getSpreadReadingTemplate("self-state");
    const text = [
      "1. 牌面先说",
      "",
      "当前心理结构",
      "你目前处于一种表面还在维持，内心已经透支的阶段。外在状态太阳逆位与内在情绪圣杯九逆位形成落差。",
      "",
      "压力源",
      "宝剑九正位指向精神层面的持续紧绷。",
    ].join("\n");

    const sanitized = sanitizeInterpretationText(text, template);

    expect(sanitized).toContain(
      "1. 牌面先说\n你目前处于一种表面还在维持，内心已经透支的阶段。",
    );
    expect(sanitized).toContain("当前心理结构");
  });

  it("neutralizes relationship pronouns when the question does not specify gender", () => {
    const template = getSpreadReadingTemplate("relationship-six");
    const text = [
      "1. 牌面先说",
      "对方他的节奏还不稳定，她可能也在观察关系里的边界。",
    ].join("\n");

    const sanitized = sanitizeInterpretationText(text, template, {
      neutralizeRelationshipPronouns: true,
    });

    expect(sanitized).toContain("对方TA的节奏");
    expect(sanitized).toContain("TA可能也在观察");
  });

  it("replaces canned reminder sentences", () => {
    const template = getSpreadReadingTemplate("three-card");
    const sanitized = sanitizeInterpretationText(
      "1. 牌面先说\n近期提醒：别忽视“评估”这个信号，真正的变化会从你停止重复旧节奏开始。",
      template,
    );

    expect(sanitized).not.toContain("别忽视");
    expect(sanitized).not.toContain("停止重复旧节奏");
    expect(sanitized).toContain("可观察的动作");
  });

  it("keeps gendered pronouns when the user names a gender", () => {
    expect(
      shouldNeutralizeRelationshipPronouns("我和她接下来会怎样？", {
        domain: "relationship",
        goal: "trend",
      }),
    ).toBe(false);

    expect(
      shouldNeutralizeRelationshipPronouns("这段关系接下来会怎样？", {
        domain: "relationship",
        goal: "trend",
      }),
    ).toBe(true);
  });
});
