"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, type ReactNode } from "react";

import type { AdaptiveAnswer } from "@/lib/tarot/types";

type AnnotatedInterpretationProps = {
  text: string;
  adaptiveAnswers?: AdaptiveAnswer[];
  isStreaming?: boolean;
};

export function AnnotatedInterpretation({
  text,
  adaptiveAnswers = [],
  isStreaming = false,
}: AnnotatedInterpretationProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const safeText = useMemo(() => {
    if (!isStreaming) return text;
    const lastOpenBracket = text.lastIndexOf("[");
    if (lastOpenBracket > text.length - 10) {
      const segmentAfter = text.substring(lastOpenBracket);
      if (!segmentAfter.includes("]]")) return text.substring(0, lastOpenBracket);
    }
    return text;
  }, [text, isStreaming]);

  const paragraphs = useMemo(() => {
    return safeText
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
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
            className="annotated-phrase group relative inline-block cursor-help transition-all"
            onMouseEnter={() => setHoveredId(annotationKey)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <span className="relative z-10 border-b-2 border-dashed border-[var(--copper)]/60 bg-[var(--copper)]/5 px-0.5 group-hover:border-[var(--copper)] group-hover:bg-[var(--copper)]/15">
              {phrase}
            </span>

            <AnimatePresence>
              {hoveredId === annotationKey ? (
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-lg bg-zinc-900/95 p-3 text-sm shadow-xl ring-1 ring-white/10 backdrop-blur-md"
                >
                  <div className="mb-1 flex items-center gap-2 font-occult text-[10px] uppercase tracking-wider text-[var(--gilt)]/80">
                    <span className="h-px flex-1 bg-[var(--gilt)]/20" />
                    Echo from Response {id}
                    <span className="h-px flex-1 bg-[var(--gilt)]/20" />
                  </div>
                  <div className="mb-2 italic text-[var(--gilt)]/60">
                    &ldquo;{answer.question}&rdquo;
                  </div>
                  <div className="font-medium text-[var(--gold-soft)]">
                    {answer.answerLabel || answer.answer}
                  </div>
                  <div className="absolute left-1/2 top-full -ml-1 border-4 border-transparent border-t-zinc-900/95" />
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
      <div className="interpretation-content whitespace-pre-wrap leading-relaxed tracking-wide text-[var(--ink-soft)]">
        {renderAnnotatedText(safeText, "stream")}
      </div>
    );
  }

  if (paragraphs.length === 0) {
    return null;
  }

  return (
    <div className="interpretation-content space-y-5 leading-relaxed tracking-wide text-[var(--ink-soft)]">
      {paragraphs.map((paragraph, index) => (
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
          className="whitespace-pre-wrap"
        >
          {renderAnnotatedText(paragraph, `paragraph-${index}`)}
        </motion.p>
      ))}
    </div>
  );
}
