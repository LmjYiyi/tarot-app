import type { SpreadReadingTemplate } from "./templates";

const dividerPattern = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/gm;

const leakedPromptPatterns = [
  /组合意义中[，,：:]?/g,
  /组合意义是[，,：:]?/g,
  /结构分析笔记显示[，,：:]?/g,
  /资料显示[，,：:]?/g,
  /根据规则[，,：:]?/g,
];

const unsafeSentenceReplacements: Array<[RegExp, string]> = [
  [
    /[^。！？\n]*身边的每个人都嫉妒[^。！？\n]*[。！？]?/g,
    "这组牌更适合被理解为对自我要求、外在评价和内在力量使用方式的提醒。",
  ],
  [
    /[^。！？\n]*超凡脱俗的个性[^。！？\n]*[。！？]?/g,
    "这组牌更适合被理解为对自我要求、外在评价和内在力量使用方式的提醒。",
  ],
];

function stripSectionNumber(section: string) {
  return section.replace(/^\d+\.\s*/, "").trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasSectionHeading(text: string, section: string) {
  const title = stripSectionNumber(section);
  const pattern = new RegExp(`(^|\\n)\\s*(?:\\d+\\.\\s*)?${escapeRegExp(title)}\\s*(\\n|$)`);

  return pattern.test(text);
}

function findSectionHeadingByLine(text: string, section: string, startIndex = 0) {
  const title = stripSectionNumber(section);
  const pattern = new RegExp(`^\\s*(?:\\d+\\.\\s*)?${escapeRegExp(title)}\\s*$`);
  let index = 0;

  for (const line of text.split(/(\n)/)) {
    const nextIndex = index + line.length;

    if (index >= startIndex && line !== "\n" && pattern.test(line)) {
      return {
        index,
        end: nextIndex + (text[nextIndex] === "\n" ? 1 : 0),
      };
    }

    index = nextIndex;
  }

  return null;
}

function ensureFirstSection(text: string, template: SpreadReadingTemplate) {
  const firstSection = template.sections[0];

  if (!firstSection || hasSectionHeading(text, firstSection)) {
    return text;
  }

  return `${firstSection}\n\n${text}`;
}

function extractFirstSentence(text: string) {
  const withoutHeadings = text
    .split("\n")
    .filter((line) => !/^\s*(?:\d+\.\s*)?[\u4e00-\u9fa5 A-Za-z/]+$/.test(line.trim()))
    .join("\n")
    .trim();
  const firstSentence = withoutHeadings.match(/[^。！？\n]+[。！？]/)?.[0]?.trim();

  if (firstSentence) {
    return firstSentence.length > 90 ? `${firstSentence.slice(0, 88)}。` : firstSentence;
  }

  const compact = withoutHeadings.replace(/\s+/g, "");

  return compact ? `${compact.slice(0, 88)}。` : "";
}

function ensureFirstSectionBody(text: string, template: SpreadReadingTemplate) {
  const firstSection = template.sections[0];
  const secondSection = template.sections[1];

  if (!firstSection || !secondSection) {
    return text;
  }

  const firstMatch = findSectionHeadingByLine(text, firstSection);

  if (!firstMatch) {
    return text;
  }

  const firstBodyStart = firstMatch.end;
  const secondMatch = findSectionHeadingByLine(text, secondSection, firstBodyStart);
  const firstBodyEnd = secondMatch?.index ?? text.length;
  const firstBody = text.slice(firstBodyStart, firstBodyEnd).trim();

  if (firstBody) {
    return text;
  }

  const sourceStart = secondMatch ? secondMatch.end : firstBodyEnd;
  const sourceEnd = template.sections
    .slice(2)
    .map((section) => findSectionHeadingByLine(text, section, sourceStart)?.index)
    .find((index): index is number => typeof index === "number") ?? text.length;
  const conclusion = extractFirstSentence(text.slice(sourceStart, sourceEnd));

  if (!conclusion) {
    return text;
  }

  return `${text.slice(0, firstBodyStart)}${conclusion}\n\n${text.slice(firstBodyStart).trimStart()}`;
}

export function sanitizeInterpretationStreamSegment(text: string) {
  let sanitized = text.replace(dividerPattern, "");

  leakedPromptPatterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "");
  });

  unsafeSentenceReplacements.forEach(([pattern, replacement]) => {
    sanitized = sanitized.replace(pattern, replacement);
  });

  return sanitized.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
}

export function sanitizeInterpretationText(text: string, template: SpreadReadingTemplate) {
  const sanitized = sanitizeInterpretationStreamSegment(text).trim();

  return ensureFirstSectionBody(ensureFirstSection(sanitized, template), template);
}
