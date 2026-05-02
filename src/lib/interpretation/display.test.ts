import { describe, expect, it } from "vitest";

import {
  buildInterpretationItems,
  cleanInterpretationMarkdown,
  isInterpretationSectionTitle,
  stripSectionNumber,
} from "./display";

describe("interpretation display helpers", () => {
  it("removes markdown chrome and horizontal dividers", () => {
    expect(
      cleanInterpretationMarkdown(
        [
          "## 牌面总览",
          "",
          "---",
          "",
          "- **这是一句正文**",
          "> `提醒`",
        ].join("\n"),
      ),
    ).toBe("牌面总览\n\n这是一句正文\n提醒");
  });

  it("recognizes known section titles without treating short prose as a title", () => {
    expect(isInterpretationSectionTitle("6. 一句近期提醒")).toBe(true);
    expect(isInterpretationSectionTitle("牌与牌之间")).toBe(true);
    expect(isInterpretationSectionTitle("整体关系")).toBe(true);
    expect(isInterpretationSectionTitle("你正站在")).toBe(false);
    expect(stripSectionNumber("4、分位置解读")).toBe("分位置解读");
  });

  it("softens legacy reminder headings for display", () => {
    expect(buildInterpretationItems("一句提醒\n先观察对方是否愿意把话说清楚。")).toEqual([
      { kind: "heading", text: "最后看这里" },
      { kind: "paragraph", text: "先观察对方是否愿意把话说清楚。" },
    ]);
  });

  it("splits section headings from dense single-newline interpretation text", () => {
    expect(
      buildInterpretationItems(
        [
          "牌面总览",
          "现状落在星币九（逆位），提示感情：关系中缺乏安全感。事业：表面稳定但内心不满足。",
          "整体关系",
          "整组牌的重心落在圣杯国王。",
          "逐张牌解读",
          "现状：星币九（逆位）",
          "这个位置的任务是：当前事业状态和真实处境。",
          "牌与牌之间",
          "从第一张牌到宝剑国王，牌面呈现的是一个逐步收束的过程。",
        ].join("\n"),
      ),
    ).toEqual([
      { kind: "heading", text: "牌面总览" },
      { kind: "paragraph", text: "现状落在星币九（逆位），提示感情：关系中缺乏安全感。" },
      { kind: "paragraph", text: "事业：表面稳定但内心不满足。" },
      { kind: "heading", text: "整体关系" },
      { kind: "paragraph", text: "整组牌的重心落在圣杯国王。" },
      { kind: "heading", text: "逐张牌解读" },
      { kind: "subheading", text: "现状：星币九（逆位）" },
      { kind: "paragraph", text: "这个位置的任务是：当前事业状态和真实处境。" },
      { kind: "heading", text: "牌与牌之间" },
      { kind: "paragraph", text: "从第一张牌到宝剑国王，牌面呈现的是一个逐步收束的过程。" },
    ]);
  });
});
