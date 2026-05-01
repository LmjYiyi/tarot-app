import { describe, expect, it } from "vitest";

import { getSpreadReadingTemplate } from "./index";

describe("spread reading templates", () => {
  it("gives complex choice readings enough token budget and mandatory closing sections", () => {
    const template = getSpreadReadingTemplate("path-of-choice");

    expect(template.maxTokens).toBeGreaterThanOrEqual(3800);
    expect(template.sections.at(-2)).toContain("决策前动作");
    expect(template.sections.at(-1)).toContain("观察指标");
    expect(template.forbiddenPatterns.join("\n")).toContain("不要省略");
    expect(template.positionRules.join("\n")).toContain("1-2 周");
    expect(template.forbiddenPatterns.join("\n")).toContain("不要擅自");
  });

  it("keeps celtic cross above the default token budget", () => {
    const template = getSpreadReadingTemplate("celtic-cross");

    expect(template.maxTokens).toBeGreaterThan(3800);
  });
});
