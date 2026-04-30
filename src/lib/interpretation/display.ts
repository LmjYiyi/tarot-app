const markdownDividerPattern = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;

export const interpretationSectionTitles = [
  "牌面总览",
  "牌面线索",
  "核心讯息",
  "今日行动",
  "直觉补充",
  "当前状态一句话",
  "整体概览",
  "整体关系",
  "分位置解读",
  "逐张牌解读",
  "整组牌关系",
  "牌与牌之间",
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

export type InterpretationDisplayItem =
  | { kind: "heading"; text: string }
  | { kind: "subheading"; text: string }
  | { kind: "paragraph"; text: string };

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

function cleanDisplayLine(line: string) {
  return line
    .trim()
    .replace(/\*\*/g, "")
    .replace(/反馈线索/g, "牌面线索")
    .replace(/用户反馈摘要/g, "直觉补充")
    .replace(/^[-*]\s+/, "")
    .replace(/^\d+[.)、]\s+/, "")
    .trim();
}

function isAbsenceExplanation(line: string) {
  return /用户未填写|未填写直觉反馈|未回答适配追问|未回答追问|无法判断你|不做任何投射式解读|没有回答任何|没有提供.*反馈|只能直接回到牌面本身/.test(
    line,
  );
}

function matchSectionLine(line: string) {
  const normalized = stripSectionNumber(line).replace(/[：:]\s*$/, "").trim();
  const title = interpretationSectionTitles.find(
    (item) =>
      normalized === item ||
      normalized.startsWith(`${item}：`) ||
      normalized.startsWith(`${item}:`),
  );

  if (!title) return null;

  const body = normalized.slice(title.length).replace(/^[：:]\s*/, "").trim();
  return { title, body };
}

function isPositionSubheading(line: string) {
  if (line.length > 34 || !/[：:]/.test(line) || /[。？！.!?；;]/.test(line)) {
    return false;
  }

  return /^(现状|阻碍|优势|近期发展|结果\/建议|结果|建议|过去|现在|未来|原因|挑战|机会|自己|对方|关系|选择\s?[AB]|A\s?路径|B\s?路径|核心|环境|潜意识|显意识)[：:]/.test(
    line,
  );
}

function splitBodyLine(line: string) {
  const prepared = line
    .replace(
      /([。！？；])\s*(?=(感情|事业|学业|关系|建议|提醒|这张牌|另一种情况|因此这里更像是在提醒你|放到你选择的领域里))/g,
      "$1\n",
    )
    .replace(/\s+(?=(感情|事业|学业)[：:])/g, "\n");

  return prepared
    .split("\n")
    .flatMap((chunk) => {
      const trimmed = chunk.trim();
      if (!trimmed) return [];
      if (trimmed.length <= 150) return [trimmed];

      const sentences = trimmed.match(/[^。！？；]+[。！？；]?/g) ?? [trimmed];
      const groups: string[] = [];
      let current = "";

      sentences.forEach((sentence) => {
        const next = sentence.trim();
        if (!next) return;

        if (current && `${current}${next}`.length > 150) {
          groups.push(current);
          current = next;
          return;
        }

        current = `${current}${next}`;
      });

      if (current) groups.push(current);
      return groups;
    })
    .filter(Boolean);
}

export function buildInterpretationItems(source: string): InterpretationDisplayItem[] {
  const items: InterpretationDisplayItem[] = [];

  source.split("\n").forEach((rawLine) => {
    const line = cleanDisplayLine(rawLine);

    if (!line || isAbsenceExplanation(line) || markdownDividerPattern.test(line)) {
      return;
    }

    const section = matchSectionLine(line);
    if (section) {
      items.push({ kind: "heading", text: section.title });
      splitBodyLine(section.body).forEach((text) => items.push({ kind: "paragraph", text }));
      return;
    }

    if (isPositionSubheading(line)) {
      items.push({ kind: "subheading", text: line });
      return;
    }

    splitBodyLine(line).forEach((text) => items.push({ kind: "paragraph", text }));
  });

  return items;
}
