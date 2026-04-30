const markdownDividerPattern = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;

export const interpretationSectionTitles = [
  "牌面总览",
  "牌面线索",
  "核心讯息",
  "今日行动",
  "直觉补充",
  "当前状态一句话",
  "整体概览",
  "分位置解读",
  "逐张牌解读",
  "整组牌关系",
  "近期趋势",
  "关系现状",
  "双方与连接断裂点",
  "修复路径",
  "近期关系提醒",
  "决策核心",
  "A/B 路径对比",
  "情绪上的倾向",
  "建议方向",
  "当前心理状态",
  "压力源与需求",
  "调整方向",
  "局势总览",
  "关键结构解读",
  "近期走向与结果趋势",
  "行动建议",
  "注意事项与行动建议",
  "一句近期提醒",
  "一句话总结",
  "一句提醒",
  "核心主题",
] as const;

export function cleanInterpretationMarkdown(source: string) {
  return source
    .split("\n")
    .map((line) =>
      line
        .replace(/^\s{0,3}#{1,6}\s*/, "")
        .replace(/^\s{0,3}[-*+]\s+/, "")
        .replace(/^\s{0,3}>\s?/, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/__(.*?)__/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .trimEnd(),
    )
    .filter((line) => !markdownDividerPattern.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function stripSectionNumber(source: string) {
  return source.replace(/^\s*\d+[.)、]\s*/, "").trim();
}

export function isInterpretationSectionTitle(source: string) {
  const normalized = stripSectionNumber(source).replace(/[：:]\s*$/, "");
  return interpretationSectionTitles.includes(
    normalized as (typeof interpretationSectionTitles)[number],
  );
}
