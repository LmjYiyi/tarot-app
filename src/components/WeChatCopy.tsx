"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { triggerHaptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

type WeChatCopyProps = {
  wechatId: string;
  className?: string;
};

export function WeChatCopy({ wechatId, className }: WeChatCopyProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(wechatId);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = wechatId;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      
      triggerHaptic(10);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  }

  return (
    <div className={cn("relative flex items-center gap-3", className)}>
      <motion.button
        onClick={handleCopy}
        className="group relative flex items-center gap-3 focus:outline-none"
        whileHover="hover"
        whileTap="tap"
      >
        <div className="relative flex items-center gap-3">
          <p className="font-mono text-[15px] text-[var(--coral-deep)] transition-colors group-hover:text-[var(--coral)]">
            {wechatId}
          </p>
          
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line-strong)] text-[var(--coral)] transition-all group-hover:border-[var(--coral)] group-hover:bg-[var(--coral-wash)]">
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.svg
                  key="check"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-[var(--coral-deep)]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </motion.svg>
              ) : (
                <motion.svg
                  key="copy"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="8" y="8" width="12" height="12" rx="2" />
                  <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                </motion.svg>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {copied && (
            <motion.span
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: -25, x: "-50%" }}
              exit={{ opacity: 0, y: -35, x: "-50%" }}
              className="absolute left-1/2 whitespace-nowrap rounded-full bg-[var(--coral-deep)] px-2.5 py-0.5 font-mono text-[10px] text-white shadow-lg"
            >
              已复制 · COPIED
            </motion.span>
          )}
        </AnimatePresence>
        
        {/* Subtle underline animation */}
        <motion.div
          className="absolute bottom-0 left-0 h-px w-full bg-[var(--coral)] opacity-0"
          variants={{
            hover: { opacity: 0.4, scaleX: 1, originX: 0 },
            tap: { opacity: 0.6 }
          }}
          initial={{ scaleX: 0 }}
          transition={{ duration: 0.3 }}
        />
      </motion.button>
    </div>
  );
}
