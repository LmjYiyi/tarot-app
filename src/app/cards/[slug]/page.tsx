import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

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
      <div className="mb-10 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.32em] text-[var(--ink-muted)] font-occult">
        <Link href="/cards/the-fool" className="hover:text-[var(--copper)]">
          ← 牌义图册
        </Link>
        <div className="flex items-center gap-3">
          <Link className="hover:text-[var(--copper)]" href={`/cards/${prevCard.slug}`}>
            {prevCard.nameZh}
          </Link>
          <span className="text-[var(--gilt)]">·</span>
          <Link className="hover:text-[var(--copper)]" href={`/cards/${nextCard.slug}`}>
            {nextCard.nameZh}
          </Link>
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        {/* Card column */}
        <div className="relative space-y-6">
          <div className="relative mx-auto max-w-[340px]">
            {/* Ornate frame */}
            <div className="relative overflow-hidden rounded-[16px] border border-[rgba(197,154,76,0.55)] bg-white p-[10px] shadow-[0_40px_80px_rgba(40,20,8,0.2)]">
              <div className="pointer-events-none absolute inset-[10px] rounded-[10px] border border-[rgba(197,154,76,0.35)]" />
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
                  <div className="flex h-full w-full items-center justify-center bg-[var(--sand)] text-[var(--ink)]">
                    {card.nameZh}
                  </div>
                )}
              </div>
            </div>
            <span className="absolute -top-3 left-4 rounded-sm border border-[var(--gilt)] bg-[rgba(255,249,232,0.95)] px-3 py-1 text-[11px] tracking-[0.24em] text-[var(--gold-deep)] font-occult">
              {toRoman(card.number)}
            </span>
          </div>

          <Panel variant="ghost" className="mx-auto max-w-[340px] text-center">
            <p className="eyebrow">{arcanaLabel}</p>
            <p className="mt-2 text-[13px] text-[var(--ink-soft)]">
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
        </div>

        {/* Meaning column */}
        <div className="space-y-10">
          <header className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="h-px w-12 bg-[var(--gilt)]" />
              <span className="eyebrow">{arcanaLabel} · {toRoman(card.number)}</span>
            </div>
            <h1 className="font-serif-display text-[clamp(3rem,6vw,5rem)] leading-[0.95] text-[var(--ink)]">
              {card.nameZh}
            </h1>
            <p className="font-serif-display text-2xl italic text-[var(--ink-soft)]">
              {card.nameEn}
            </p>
          </header>

          <Ornament variant="rule" className="max-w-[300px]" />

          <div className="grid gap-6 md:grid-cols-2">
            <Panel className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="eyebrow">Upright · 正位</p>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-800 font-occult">
                  ↑ UP
                </span>
              </div>
              <p className="text-[14px] leading-7 text-[var(--ink-soft)] drop-cap">
                {card.meaningUpright}
              </p>
              <div className="flex flex-wrap gap-2">
                {card.keywordsUpright.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full border border-emerald-200 bg-emerald-50/60 px-3 py-1 text-[12px] text-emerald-900"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </Panel>

            <Panel className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="eyebrow">Reversed · 逆位</p>
                <span className="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-medium text-rose-800 font-occult">
                  ↓ REV
                </span>
              </div>
              <p className="text-[14px] leading-7 text-[var(--ink-soft)] drop-cap">
                {card.meaningReversed}
              </p>
              <div className="flex flex-wrap gap-2">
                {card.keywordsReversed.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full border border-rose-200 bg-rose-50/60 px-3 py-1 text-[12px] text-rose-900"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </Panel>

            <Panel className="space-y-3">
              <p className="eyebrow">Amor · 爱情方向</p>
              <p className="text-[14px] leading-7 text-[var(--ink-soft)]">{card.loveMeaning}</p>
            </Panel>

            <Panel className="space-y-3">
              <p className="eyebrow">Opus · 事业方向</p>
              <p className="text-[14px] leading-7 text-[var(--ink-soft)]">
                {card.careerMeaning}
              </p>
            </Panel>
          </div>

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
        </div>
      </div>
    </div>
  );
}
