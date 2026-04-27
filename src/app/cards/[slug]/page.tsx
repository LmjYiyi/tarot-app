import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ScrollReveal } from "@/components/ScrollReveal";
import { buttonStyles } from "@/components/ui/button";
import { Ornament, toRoman } from "@/components/ui/ornament";
import { Panel } from "@/components/ui/panel";
import { getAllCards, getCardBySlug } from "@/lib/tarot/catalog";

type CardPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllCards().map((card) => ({ slug: card.slug }));
}

export async function generateMetadata({
  params,
}: CardPageProps): Promise<Metadata> {
  const { slug } = await params;
  const card = getCardBySlug(slug);

  if (!card) {
    return {};
  }

  return {
    title: `${card.nameZh}牌义 | Arcana Flow`,
    description: `${card.nameZh}的正位、逆位、爱情与事业解读。`,
  };
}

export default async function CardDetailPage({ params }: CardPageProps) {
  const { slug } = await params;
  const card = getCardBySlug(slug);

  if (!card) {
    notFound();
  }

  const allCards = getAllCards();
  const currentIndex = allCards.findIndex((item) => item.slug === card.slug);
  const prevCard = allCards[(currentIndex - 1 + allCards.length) % allCards.length];
  const nextCard = allCards[(currentIndex + 1) % allCards.length];

  const arcanaLabel = card.arcana === "major" ? "Arcana Majora" : "Arcana Minora";

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 lg:px-10 lg:py-24">
      <ScrollReveal>
        <div className="mb-10 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.32em] text-[var(--text-faint)] font-occult">
          <Link href="/cards/the-fool" className="hover:text-[var(--glow-gold)]">
            ← 牌义图册
          </Link>
          <div className="flex items-center gap-3">
            <Link
              className="hover:text-[var(--glow-gold)]"
              href={`/cards/${prevCard.slug}`}
            >
              {prevCard.nameZh}
            </Link>
            <span className="text-[var(--gilt)]">·</span>
            <Link
              className="hover:text-[var(--glow-gold)]"
              href={`/cards/${nextCard.slug}`}
            >
              {nextCard.nameZh}
            </Link>
          </div>
        </div>
      </ScrollReveal>

      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        {/* Card column */}
        <ScrollReveal className="relative space-y-6">
          <div className="relative mx-auto max-w-[340px]">
            {/* Ornate frame */}
            <div className="relative overflow-hidden rounded-[16px] border border-[rgba(197,154,76,0.65)] bg-[var(--cosmic)] p-[10px] shadow-[0_40px_80px_rgba(8,8,16,0.6),0_0_40px_rgba(197,154,76,0.15)]">
              <div className="pointer-events-none absolute inset-[10px] rounded-[10px] border border-[rgba(197,154,76,0.3)]" />
              <div className="relative aspect-[300/524] overflow-hidden rounded-[8px]">
                {card.imageUrl ? (
                  <Image
                    src={card.imageUrl}
                    alt={`${card.nameZh} ${card.nameEn}`}
                    fill
                    sizes="(max-width: 768px) 80vw, 340px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[var(--nebula)] text-[var(--text-primary)]">
                    {card.nameZh}
                  </div>
                )}
              </div>
            </div>
            <span className="absolute -top-3 left-4 rounded-sm border border-[rgba(197,154,76,0.5)] bg-[var(--void)] px-3 py-1 text-[11px] tracking-[0.24em] text-[var(--glow-gold-bright)] font-occult">
              {toRoman(card.number)}
            </span>
          </div>

          <Panel variant="ghost" className="mx-auto max-w-[340px] text-center">
            <p className="eyebrow-gold">{arcanaLabel}</p>
            <p className="mt-2 text-[13px] text-[var(--text-muted)]">
              {card.arcana === "major"
                ? "大阿卡那 · 代表人生课题与原型"
                : `小阿卡那 · 花色 ${
                    card.suit === "cups"
                      ? "圣杯"
                      : card.suit === "wands"
                      ? "权杖"
                      : card.suit === "swords"
                      ? "宝剑"
                      : "钱币"
                  }`}
            </p>
          </Panel>
        </ScrollReveal>

        {/* Meaning column */}
        <div className="space-y-10">
          <ScrollReveal>
            <header className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="h-px w-12 bg-[var(--gilt)]" />
                <span className="eyebrow-gold">{arcanaLabel} · {toRoman(card.number)}</span>
              </div>
              <h1 className="font-serif-display text-[clamp(3rem,6vw,5rem)] leading-[0.95] text-[var(--text-primary)] gold-glow">
                {card.nameZh}
              </h1>
              <p className="font-serif-display text-2xl italic text-[var(--text-muted)]">
                {card.nameEn}
              </p>
            </header>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <Ornament variant="rule" className="max-w-[300px]" />
          </ScrollReveal>

          <div className="grid gap-8 md:grid-cols-2">
            <ScrollReveal delay={0.15}>
              <div className="space-y-4 rounded-[20px] bg-[var(--glow-gold-dim)]/5 p-6 transition-colors hover:bg-[var(--glow-gold-dim)]/10">
                <div className="flex items-center justify-between">
                  <p className="eyebrow-gold">Upright · 正位</p>
                  <span className="rounded-full border border-[rgba(197,154,76,0.3)] bg-[var(--void)] px-3 py-1 text-[10px] font-medium text-[var(--glow-gold-bright)] font-occult backdrop-blur-sm">
                    ↑ UPRIGHT
                  </span>
                </div>
                <p className="text-[15px] leading-8 text-[var(--text-primary)]/90 drop-cap">
                  {card.meaningUpright}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {card.keywordsUpright.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full border border-[rgba(197,154,76,0.2)] bg-[var(--glow-gold-dim)]/10 px-3 py-1 text-[12px] text-[var(--glow-gold-bright)]"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <div className="space-y-4 rounded-[20px] bg-rose-500/5 p-6 transition-colors hover:bg-rose-500/10">
                <div className="flex items-center justify-between">
                  <p className="eyebrow-gold">Reversed · 逆位</p>
                  <span className="rounded-full border border-rose-500/30 bg-[var(--void)] px-3 py-1 text-[10px] font-medium text-[var(--ember)] font-occult backdrop-blur-sm">
                    ↓ REVERSED
                  </span>
                </div>
                <p className="text-[15px] leading-8 text-[var(--text-primary)]/90 drop-cap">
                  {card.meaningReversed}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {card.keywordsReversed.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-[12px] text-[var(--ember)]"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.25}>
              <div className="space-y-3 rounded-[20px] border border-[var(--gilt-dim)]/30 bg-[var(--nebula)]/40 p-6">
                <p className="eyebrow-gold">Amor · 爱情方向</p>
                <p className="text-[14px] leading-7 text-[var(--text-muted)]">
                  {card.loveMeaningUpright ?? card.meaningUpright}
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.3}>
              <div className="space-y-3 rounded-[20px] border border-[var(--gilt-dim)]/30 bg-[var(--nebula)]/40 p-6">
                <p className="eyebrow-gold">Opus · 事业方向</p>
                <p className="text-[14px] leading-7 text-[var(--text-muted)]">
                  {card.careerMeaningUpright ?? card.meaningUpright}
                </p>
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal delay={0.35}>
            <div className="flex items-center gap-4 pt-6">
              <Link className={buttonStyles({})} href="/spreads">
                ✶ 拿这张牌去抽一次
              </Link>
              <Link
                className={buttonStyles({ variant: "secondary" })}
                href={`/cards/${nextCard.slug}`}
              >
                下一张：{nextCard.nameZh} →
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
