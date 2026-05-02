import type { Metadata } from "next";
import Image from "next/image";

import { ReadingHistoryView } from "@/components/ReadingHistoryView";
import { Ornament } from "@/components/ui/ornament";

export const metadata: Metadata = {
  title: "占卜记录 · Arcana Flow",
  description: "查询与回看保存在本机浏览器中的塔罗占卜记录，或粘贴链接直接打开历史读牌。",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ReadingHistoryPage() {
  return (
    <div className="relative isolate overflow-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <Image
          src="/spreads/site-edge-background-clean.jpg"
          alt=""
          fill
          sizes="100vw"
          priority
          className="scale-[1.01] object-cover opacity-[0.68] blur-[0.7px]"
        />
        <div className="absolute inset-0 bg-[rgba(251,240,200,0.22)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(251,240,200,0.06)_0%,rgba(251,240,200,0.16)_56%,rgba(251,240,200,0.44)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[960px] px-5 py-12 lg:px-12 lg:py-20">
        <header className="mb-12 space-y-5 text-center">
          <Ornament variant="quatrefoil" />
          <p className="eyebrow">Reading Journal · 占卜记录</p>
          <h1 className="font-serif-display text-[clamp(2.4rem,4.4vw,3.8rem)] leading-[1.05] tracking-[-0.018em] text-[var(--ink)]">
            把走过的牌面，<br />
            收回到一处。
          </h1>
          <p className="mx-auto max-w-2xl text-[15px] leading-7 text-[var(--ink-soft)]">
            每次占卜会生成一条只属于这次抽牌的链接。可以直接在下面粘贴链接查询，也可以翻看本机浏览器记录的近期占卜。
          </p>
          <Ornament variant="rule" className="mx-auto max-w-xs opacity-90 [--gilt:rgba(200,90,60,0.42)]" />
        </header>

        <ReadingHistoryView />
      </div>
    </div>
  );
}
