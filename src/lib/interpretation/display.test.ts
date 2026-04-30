import { describe, expect, it } from "vitest";

import {
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
    expect(isInterpretationSectionTitle("你正站在")).toBe(false);
    expect(stripSectionNumber("4、分位置解读")).toBe("分位置解读");
  });
});
