import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ScrollReveal } from "@/components/ScrollReveal";
import { SpreadRecommender } from "@/components/SpreadRecommender";
import { Ornament, toRoman } from "@/components/ui/ornament";
import { getAllSpreads } from "@/lib/tarot/catalog";

const spreadThumbnails: Record<string, string> = {
  "career-five": "/spreads/career-five-thumbnail-ai-v1.jpg",
  "three-card": "/spreads/three-card-thumbnail-ai-v1.jpg",
  "single-guidance": "/spreads/single-guidance-thumbnail-ai-v1.jpg",
  "cross-five": "/spreads/cross-five-thumbnail-ai-v1.jpg",
  "relationship-six": "/spreads/relationship-six-thumbnail-ai-v1.jpg",
  "lovers-pyramid": "/spreads/lovers-pyramid-thumbnail-ai-v1.jpg",
  "path-of-choice": "/spreads/path-of-choice-thumbnail-ai-v1.jpg",
  "self-state": "/spreads/self-state-thumbnail-ai-v1.jpg",
  "celtic-cross": "/spreads/celtic-cross-thumbnail-ai-v1.jpg",
};

export const metadata: Metadata = {
  title: "选择牌阵 | Arcana Flow",
  description: "从单张建议牌、三张牌到凯尔特十字，选择适合当前问题复杂度的塔罗牌阵。",
};

export default function SpreadsPage() {
  const spreads = getAllSpreads();

  return (
    <div className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
      >
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

      <section className="relative mx-auto grid w-full max-w-[1320px] grid-cols-1 gap-10 px-5 pb-10 pt-16 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14 lg:px-12 lg:pb-16 lg:pt-24">
        <div className="relative z-10 flex min-w-0 flex-col justify-center">
          <p className="eyebrow mb-5">Spread Index · 牌阵索引</p>
          <h1 className="font-serif-display text-[clamp(2.55rem,5.6vw,4.6rem)] leading-[1.04] text-[var(--ink)]">
            <span className="sm:hidden">
              选择今天
              <br />
              要使用的
              <br />
              <span className="text-[var(--coral)]">牌阵。</span>
            </span>
            <span className="hidden sm:inline">
              选择今天要使用
              <br />
              <span className="text-[var(--coral)]">的牌阵。</span>
            </span>
          </h1>
          <p className="mt-6 w-full max-w-[350px] break-all text-[16.5px] leading-[1.75] text-[var(--ink-soft)] sm:max-w-[590px]">
            先问问自己“我现在想看什么”。轻一点的问题，用少量牌照见方向；关系、选择和长期课题，再交给更完整的牌阵慢慢摊开。
          </p>
          <div
            className="mt-12 grid w-full max-w-[350px] grid-cols-3 gap-4 border-t border-[var(--line)] pt-6 sm:max-w-[560px] sm:gap-6"
          >
            <SpreadStat figure={String(spreads.length)} caption="可选牌阵" />
            <SpreadStat figure="1-10" caption="抽牌数量" />
            <SpreadStat figure="2-12" caption="分钟左右" />
          </div>
        </div>

        <div className="relative min-h-[390px] min-w-0 overflow-hidden lg:min-h-[560px]">
          <div
            className="absolute left-1/2 top-1/2 h-[520px] w-[min(98vw,720px)] -translate-x-1/2 -translate-y-1/2 sm:h-[600px] lg:h-[680px]"
            style={{
              maskImage:
                "radial-gradient(ellipse at center, black 0%, rgba(0,0,0,0.72) 38%, rgba(0,0,0,0.22) 66%, transparent 84%)",
              WebkitMaskImage:
                "radial-gradient(ellipse at center, black 0%, rgba(0,0,0,0.72) 38%, rgba(0,0,0,0.22) 66%, transparent 84%)",
            }}
          >
            <Image
              src="/visuals/spread-selection-background-clean.jpg"
              alt=""
              fill
              sizes="(max-width: 1024px) 92vw, 660px"
              priority
              className="scale-[1.02] object-contain object-center opacity-[0.50] mix-blend-multiply"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,240,200,0.03)_0%,rgba(251,240,200,0.20)_58%,rgba(251,240,200,0.76)_100%)]" />
          </div>
          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 sm:inset-x-10">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
              {spreads.slice(0, 6).map((spread, index) => (
                <Link
                  key={spread.slug}
                  href={`/spreads/${spread.slug}`}
                  className={`group relative min-h-[92px] min-w-0 border-t border-[rgba(74,59,50,0.18)] pt-4 transition duration-300 hover:-translate-y-1 sm:min-h-[120px] ${
                    index % 3 === 1 ? "sm:translate-y-8" : index % 3 === 2 ? "sm:translate-y-2" : ""
                  }`}
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                    {toRoman(index + 1)}
                  </span>
                  <span className="mt-2 block break-words font-serif-display text-[20px] leading-tight text-[var(--ink)] transition group-hover:text-[var(--coral-deep)] sm:text-[26px]">
                    {spread.nameZh}
                  </span>
                  <span className="mt-2 block text-[12px] text-[var(--ink-muted)]">
                    {spread.cardCount} 张牌
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SpreadRecommender spreads={spreads} />

      <section className="mx-auto w-full max-w-[1320px] px-5 pb-28 pt-16 sm:px-8 lg:px-12">
        <div className="mb-4 grid gap-6 border-t border-[var(--line)] pt-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div className="min-w-0">
            <p className="eyebrow">All Spreads · 全部牌阵</p>
            <h2 className="mt-3 w-full max-w-[350px] break-all font-serif-display text-[clamp(2.3rem,4vw,3.5rem)] leading-[1.06] text-[var(--ink)] sm:max-w-none">
              按问题的重量，
              <br />
              选择展开的方式。
            </h2>
          </div>
          <p className="w-full max-w-[350px] break-all text-[15.5px] leading-8 text-[var(--ink-soft)] sm:max-w-2xl">
            每一种牌阵都对应一种观看问题的距离。短牌阵适合快速校准，长牌阵适合拆开背景、阻力、关系和下一步行动。
          </p>
        </div>

        <div className="divide-y divide-[var(--line)]">
          {spreads.map((spread, index) => (
            <ScrollReveal key={spread.slug} delay={index * 0.05}>
              <Link
                href={`/spreads/${spread.slug}`}
                className="group relative grid min-w-0 gap-6 py-9 transition duration-300 sm:grid-cols-[190px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1.15fr)_minmax(220px,0.55fr)] lg:gap-10 lg:py-11"
              >
                <span className="pointer-events-none absolute right-0 top-4 select-none font-serif-display text-[88px] italic leading-none text-[var(--coral)] opacity-[0.055] transition duration-500 group-hover:opacity-[0.10] sm:text-[120px]">
                  {toRoman(index + 1)}
                </span>

                <div className="relative isolate aspect-[16/10] w-full max-w-[300px] overflow-hidden sm:max-w-none">
                  <Image
                    src={spreadThumbnails[spread.slug] ?? "/spreads/astrology-chart-background-v2.png"}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 300px, (max-width: 1024px) 190px, 240px"
                    className="scale-[1.18] object-cover opacity-[0.24] blur-[12px] sepia-[0.26] saturate-[0.62] brightness-[1.08] transition duration-700 group-hover:scale-[1.22] group-hover:opacity-[0.30]"
                    style={{
                      maskImage:
                        "radial-gradient(ellipse at center, black 0%, rgba(0,0,0,0.70) 44%, rgba(0,0,0,0.20) 68%, transparent 86%)",
                      WebkitMaskImage:
                        "radial-gradient(ellipse at center, black 0%, rgba(0,0,0,0.70) 44%, rgba(0,0,0,0.20) 68%, transparent 86%)",
                    }}
                  />
                  <Image
                    src={spreadThumbnails[spread.slug] ?? "/spreads/astrology-chart-background-v2.png"}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 300px, (max-width: 1024px) 190px, 240px"
                    className="object-cover opacity-[0.88] sepia-[0.10] saturate-[0.86] brightness-[1.01] contrast-[1.14] mix-blend-multiply transition duration-700 group-hover:scale-[1.018] group-hover:opacity-[0.96]"
                    style={{
                      maskImage:
                        "radial-gradient(ellipse at center, black 0%, black 50%, rgba(0,0,0,0.72) 62%, rgba(0,0,0,0.20) 72%, transparent 82%)",
                      WebkitMaskImage:
                        "radial-gradient(ellipse at center, black 0%, black 50%, rgba(0,0,0,0.72) 62%, rgba(0,0,0,0.20) 72%, transparent 82%)",
                    }}
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,240,200,0)_0%,rgba(251,240,200,0.24)_42%,rgba(251,240,200,0.72)_68%,rgba(251,240,200,0.96)_100%)]"
                  />
                </div>

                <div className="relative z-10 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                      {toRoman(index + 1)}
                    </span>
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                      {spread.cardCount} 张牌 · {spread.positions.length} 个牌位 · 约 {Math.max(2, Math.ceil(spread.cardCount * 1.2))} 分钟
                    </span>
                  </div>

                  <h3 className="mt-3 break-all font-serif-display text-[clamp(2rem,3vw,3rem)] leading-[1.06] text-[var(--ink)] transition group-hover:text-[var(--coral-deep)]">
                    {spread.nameZh}
                  </h3>
                  <p className="mt-2 break-all text-[14px] leading-6 text-[var(--ink-muted)]">
                    {spread.hero}
                  </p>
                  <p className="mt-5 max-w-2xl break-all text-[15px] leading-8 text-[var(--ink-soft)]">
                    {spread.summary}
                  </p>
                </div>

                <div className="relative z-10 flex min-w-0 flex-col justify-end gap-5 text-[13px] leading-7 text-[var(--ink-soft)] lg:border-l lg:border-[var(--line)] lg:pl-8">
                  <div>
                    <p className="eyebrow-ink mb-2">适合</p>
                    <p>{spread.suitableFor.slice(0, 3).join(" · ")}</p>
                  </div>
                  <span className="inline-flex items-center font-medium text-[var(--coral-deep)] transition group-hover:translate-x-1">
                    开始这局 →
                  </span>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>

        <div className="mx-auto mt-14 flex max-w-md items-center gap-4">
          <div className="h-px flex-1 bg-[var(--line)]" />
          <Ornament variant="quatrefoil" />
          <div className="h-px flex-1 bg-[var(--line)]" />
        </div>
      </section>
    </div>
  );
}

function SpreadStat({ figure, caption }: { figure: string; caption: string }) {
  return (
    <div>
      <p className="font-serif-display text-[34px] leading-none text-[var(--ink)]">
        {figure}
      </p>
      <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        {caption}
      </p>
    </div>
  );
}
