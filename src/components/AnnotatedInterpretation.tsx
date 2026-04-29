"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, type ReactNode } from "react";

import { Ornament } from "@/components/ui/ornament";
import type { AdaptiveAnswer } from "@/lib/tarot/types";

type AnnotatedInterpretationProps = {
  text: string;
  adaptiveAnswers?: AdaptiveAnswer[];
  isStreaming?: boolean;
};

const inlineSectionTitles = [
  "牌面总览",
  "核心主题",
  "直觉补充",
  "分位置解读",
  "逐张牌解读",
  "关键结构解读",
  "行动建议",
  "一句近期提醒",
];

function hideInternalNotes(source: string) {
  return source
    .split("\n")
    .filter(
      (line) =>
        !/知觉锚点|确认用户|后续解读的落点|避免被牌义牵着走|追问策略/.test(line),
    )
    .join("\n");
}

function isAbsenceExplanation(paragraph: string) {
  return /用户未填写|未填写直觉反馈|未回答适配追问|未回答追问|无法判断你|不做任何投射式解读|没有回答任何|没有提供.*反馈|只能直接回到牌面本身/.test(
    paragraph,
  );
}

export function AnnotatedInterpretation({
  text,
  adaptiveAnswers = [],
  isStreaming = false,
}: AnnotatedInterpretationProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const safeText = useMemo(() => {
    const displayText = hideInternalNotes(text);
    if (!isStreaming) return displayText;
    const lastOpenBracket = displayText.lastIndexOf("[");
    if (lastOpenBracket > displayText.length - 10) {
      const segmentAfter = displayText.substring(lastOpenBracket);
      if (!segmentAfter.includes("]]")) return displayText.substring(0, lastOpenBracket);
    }
    return displayText;
  }, [text, isStreaming]);

  const paragraphs = useMemo(() => {
    return safeText
      .split(/\n\s*\n/)
      .map((paragraph) =>
        paragraph
          .trim()
          .replace(/\*\*/g, "")
          .replace(/反馈线索/g, "牌面线索")
          .replace(/用户反馈摘要/g, "直觉补充")
          .replace(/^[-*]\s+/gm, "")
          .replace(/^\d+[.)]\s+/gm, ""),
      )
      .filter((paragraph) => !isAbsenceExplanation(paragraph))
      .filter(Boolean);
  }, [safeText]);

  function renderAnnotatedText(source: string, keyPrefix: string) {
    const parts: ReactNode[] = [];
    const regex = /\[\[a:(A\d+)\]\](.*?)\[\[\/a\]\]/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(source)) !== null) {
      if (match.index > lastIndex) {
        parts.push(source.substring(lastIndex, match.index));
      }

      const id = match[1];
      const phrase = match[2];
      const annotationKey = `${keyPrefix}-${id}-${match.index}`;
      const answerIndex = Number.parseInt(id.replace("A", ""), 10) - 1;
      const answer = adaptiveAnswers[answerIndex];

      if (answer) {
        parts.push(
          <span
            key={annotationKey}
            className="group relative inline-block cursor-help"
            onMouseEnter={() => setHoveredId(annotationKey)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <span className="relative z-10 border-b border-dashed border-[var(--coral-edge)] bg-[var(--coral-wash)] px-0.5 transition-colors group-hover:border-[var(--coral)] group-hover:bg-[rgba(204,120,92,0.14)]">
              {phrase}
            </span>

            <AnimatePresence>
              {hoveredId === annotationKey ? (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-[10px] border border-[var(--line-strong)] bg-[var(--surface)] p-3 text-[13px] shadow-[0_8px_24px_rgba(26,26,25,0.10)]"
                >
                  <div className="mb-1.5 flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                    <span className="h-px flex-1 bg-[var(--line)]" />
                    回应 {id}
                    <span className="h-px flex-1 bg-[var(--line)]" />
                  </div>
                  <div className="mb-1.5 italic text-[var(--ink-soft)]">
                    &ldquo;{answer.question}&rdquo;
                  </div>
                  <div className="font-medium text-[var(--coral-deep)]">
                    {answer.answerLabel || answer.answer}
                  </div>
                  <div className="absolute left-1/2 top-full -ml-1 border-4 border-transparent border-t-[var(--surface)]" />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </span>,
        );
      } else {
        parts.push(phrase);
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < source.length) {
      parts.push(source.substring(lastIndex));
    }

    return parts.length > 0 ? parts : source;
  }

  if (isStreaming) {
    return (
      <div className="interpretation-content whitespace-pre-wrap text-[15px] leading-[1.85] tracking-[0.005em] text-[var(--ink)]">
        {renderAnnotatedText(safeText, "stream")}
      </div>
    );
  }

  if (paragraphs.length === 0) {
    return null;
  }

  return (
    <div className="interpretation-content space-y-7 text-[15.5px] leading-[1.95] tracking-[0.005em] text-[var(--ink)]">
      {paragraphs.map((paragraph, index) => {
        const headingMatch = paragraph.match(/^(#{1,4})\s*(.+)$/);
        const inlineSectionMatch = paragraph.match(
          new RegExp(`^(${inlineSectionTitles.join("|")})\\s*[：:]\\s*(.*)$`, "s"),
        );
        const standaloneSectionTitle = inlineSectionTitles.includes(paragraph);
        const softHeading =
          !headingMatch &&
          !inlineSectionMatch &&
          !standaloneSectionTitle &&
          paragraph.length <= 18 &&
          !/[。？！.!?]/.test(paragraph) &&
          index > 0;
        const headingText =
          headingMatch?.[2]?.trim() ??
          inlineSectionMatch?.[1]?.trim() ??
          (standaloneSectionTitle || softHeading ? paragraph : "");
        const inlineSectionBody = inlineSectionMatch?.[2]?.trim() ?? "";
        const isFirstHeading =
          Boolean(headingText) &&
          paragraphs.findIndex((other) => {
            const m = other.match(/^(#{1,4})\s*(.+)$/);
            const inline = other.match(
              new RegExp(`^(${inlineSectionTitles.join("|")})\\s*[：:]\\s*(.*)$`, "s"),
            );
            const standalone = inlineSectionTitles.includes(other);
            const soft =
              !m &&
              !inline &&
              !standalone &&
              other.length <= 18 &&
              !/[。？！.!?]/.test(other);
            return Boolean(m?.[2]?.trim()) || Boolean(inline?.[1]?.trim()) || standalone || soft;
          }) === index;

        if (headingText) {
          return (
            <motion.div
              key={`${headingText}-${index}`}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8% 0px -8% 0px" }}
              transition={{ duration: 0.55, ease: [0.22, 0.65, 0.2, 1] }}
              className={isFirstHeading ? "pt-1" : "pt-9"}
            >
              <motion.div
                aria-hidden
                initial={{ opacity: 0, scale: 0.82 }}
                whileInView={{ opacity: 0.7, scale: 1 }}
                viewport={{ once: true, margin: "-8% 0px -8% 0px" }}
                transition={{ duration: 0.7, ease: [0.22, 0.65, 0.2, 1], delay: 0.08 }}
                className="mb-5 flex items-center gap-3 text-[var(--coral)]"
              >
                <Ornament variant="rose" className="opacity-90" />
                <span className="h-px flex-1 bg-gradient-to-r from-[var(--coral-edge)] via-[var(--coral-edge)] to-transparent" />
              </motion.div>
              <h3 className="font-serif-display text-[26px] leading-[1.18] tracking-[-0.012em] text-[var(--ink)]">
                {renderAnnotatedText(headingText, `heading-${index}`)}
              </h3>
              {inlineSectionBody ? (
                <p className="mt-5 whitespace-pre-wrap pl-[14px] indent-[1.4em] text-[15.5px] leading-[1.95] tracking-[0.005em] text-[var(--ink)]">
                  {renderAnnotatedText(inlineSectionBody, `paragraph-${index}`)}
                </p>
              ) : null}
            </motion.div>
          );
        }

        return (
          <motion.p
            key={`${paragraph.slice(0, 32)}-${index}`}
            initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-8% 0px -8% 0px" }}
            transition={{
              duration: 0.58,
              delay: Math.min(index * 0.04, 0.2),
              ease: [0.22, 0.65, 0.2, 1],
            }}
            className="whitespace-pre-wrap pl-[14px] indent-[1.4em]"
          >
            {renderAnnotatedText(paragraph.replace(/^#{1,4}\s*/, ""), `paragraph-${index}`)}
          </motion.p>
        );
      })}
    </div>
  );
}
