import { describe, expect, it } from "vitest";

import { getSpreadReadingTemplate } from "./templates";
import { sanitizeInterpretationText } from "./output";

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

    expect(sanitized).toContain("1. 一句话结论");
    expect(sanitized).not.toContain("---");
    expect(sanitized).not.toContain("组合意义中");
    expect(sanitized).not.toContain("根据规则");
    expect(sanitized).not.toContain("嫉妒");
    expect(sanitized).toContain("外在评价");
  });

  it("fills an empty first conclusion section from the next section body", () => {
    const template = getSpreadReadingTemplate("self-state");
    const text = [
      "1. 一句话结论",
      "",
      "当前心理结构",
      "你目前处于一种表面还在维持，内心已经透支的阶段。外在状态太阳逆位与内在情绪圣杯九逆位形成落差。",
      "",
      "压力源",
      "宝剑九正位指向精神层面的持续紧绷。",
    ].join("\n");

    const sanitized = sanitizeInterpretationText(text, template);

    expect(sanitized).toContain(
      "1. 一句话结论\n你目前处于一种表面还在维持，内心已经透支的阶段。",
    );
    expect(sanitized).toContain("当前心理结构");
  });
});
