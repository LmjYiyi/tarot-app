import type { Metadata } from "next";
import { promises as fs } from "node:fs";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Ornament, toRoman } from "@/components/ui/ornament";
import { getAllCards, getCardBySlug } from "@/lib/tarot/catalog";

type CardPageProps = {
  params: Promise<{ slug: string }>;
};

type TextSection = {
  level: 1 | 2 | 3;
  title: string;
  body: string[];
};

const hiddenSectionTitlePattern =
  /是或否|延伸閱讀|延伸阅读|初學者|初学者|常見問題|常见问题|Q&A|組合|组合|免費塔羅|免费塔罗|現在就試試|现在就试试/;

function getSectionId(index: number) {
  return `meaning-section-${index + 1}`;
}

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
    description: `${card.nameZh}的牌面象征、正位、逆位与不同问题中的解读。`,
  };
}

async function getCardText(slug: string) {
  const candidates = new Set([
    slug,
    slug.replace(/^cups-(.+)$/, "$1-of-cups"),
    slug.replace(/^wands-(.+)$/, "$1-of-wands"),
    slug.replace(/^swords-(.+)$/, "$1-of-swords"),
    slug.replace(/^pentacles-(.+)$/, "$1-of-pentacles"),
  ]);

  for (const candidate of candidates) {
    try {
      return await fs.readFile(path.join(process.cwd(), "tarot-data", `${candidate}.txt`), "utf8");
    } catch {
      // Try the next local filename shape.
    }
  }

  return null;
}

function parseCardText(markdown: string | null, fallbackTitle: string, fallbackBody: string) {
  if (!markdown) {
    return [
      {
        level: 2,
        title: fallbackTitle,
        body: [fallbackBody],
      },
    ] satisfies TextSection[];
  }

  const sections: TextSection[] = [];
  let current: TextSection | null = null;

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      current = {
        level: Math.min(heading[1].length, 3) as 1 | 2 | 3,
        title: heading[2],
        body: [],
      };
      sections.push(current);
      continue;
    }

    if (!current) {
      current = { level: 2, title: fallbackTitle, body: [] };
      sections.push(current);
    }

    if (/👉|現在就|现在就|免費塔羅占卜工具|免费塔罗占卜工具/.test(line)) {
      continue;
    }

    current.body.push(line);
  }

  return sections.filter(
    (section) =>
      !hiddenSectionTitlePattern.test(section.title) &&
      (section.body.length > 0 || section.level === 1),
  );
}

function suitLabel(suit: string | null) {
  if (suit === "cups") return "圣杯";
  if (suit === "wands") return "权杖";
  if (suit === "swords") return "宝剑";
  if (suit === "pentacles") return "钱币";
  return "";
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
  const cardText = await getCardText(card.slug);
  const textSections = parseCardText(
    cardText,
    `${card.nameZh} ${card.nameEn}`,
    card.fullMeaning ?? card.description ?? card.meaningUpright,
  );
  const titleSection = textSections[0];
  const contentSections = textSections.slice(1);

  return (
    <div className="relative isolate overflow-x-clip">
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

      <div className="mx-auto w-full max-w-[1320px] px-5 py-14 sm:px-8 lg:px-12 lg:py-24">
        <div className="mb-12 flex flex-wrap items-center justify-between gap-4 text-[11px] uppercase tracking-[0.24em] text-[var(--ink-muted)] font-occult">
          <Link href="/" className="hover:text-[var(--coral-deep)]">
            ← Arcana Flow
          </Link>
          <div className="flex items-center gap-3">
            <Link className="hover:text-[var(--coral-deep)]" href={`/cards/${prevCard.slug}`}>
              {prevCard.nameZh}
            </Link>
            <span className="text-[var(--coral)]">·</span>
            <Link className="hover:text-[var(--coral-deep)]" href={`/cards/${nextCard.slug}`}>
              {nextCard.nameZh}
            </Link>
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[410px_minmax(0,1fr)]">
          <div className="space-y-8 lg:self-start lg:pr-3 lg:pb-8">
            <div className="relative mx-auto max-w-[340px]">
              <div className="relative aspect-[300/524] overflow-hidden rounded-[10px] border border-[rgba(74,59,50,0.18)] shadow-[0_18px_36px_rgba(74,59,50,0.10)]">
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
                  <div className="flex h-full w-full items-center justify-center text-[var(--ink)]">
                    {card.nameZh}
                  </div>
                )}
              </div>
              <span className="absolute -top-3 left-4 px-1 text-[11px] tracking-[0.24em] text-[var(--coral-deep)] font-occult">
                {toRoman(card.number)}
              </span>
            </div>

            <div className="mx-auto max-w-[340px]">
              <div className="px-1 pb-5 pt-6">
                <Ornament variant="rule" className="mb-5 opacity-55" />
                <p className="eyebrow">{arcanaLabel}</p>
                <p className="mt-2 text-[14px] leading-7 text-[var(--ink-soft)]">
                  {card.arcana === "major"
                    ? "大阿卡那 · 一段原型旅程里的门槛"
                    : `小阿卡那 · ${suitLabel(card.suit)}`}
                </p>
              </div>

              <nav className="px-1 pb-5 pt-2">
                <p className="eyebrow-ink mb-3">牌面目录 · Cards</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 pr-2 text-[13px] leading-6 text-[var(--ink-soft)]">
                  {allCards.map((item) => (
                    <Link
                      key={item.id}
                      href={`/cards/${item.slug}`}
                      className={`transition hover:text-[var(--coral-deep)] ${
                        item.slug === card.slug ? "text-[var(--coral-deep)]" : ""
                      }`}
                    >
                      {toRoman(item.number)} · {item.nameZh}
                    </Link>
                  ))}
                </div>
              </nav>
            </div>
          </div>

          <div className="min-w-0">
            <header className="relative pb-10">
              <div className="flex items-center gap-3">
                <span className="h-px w-12 bg-[rgba(200,90,60,0.32)]" />
                <span className="eyebrow">
                  {arcanaLabel} · {toRoman(card.number)}
                </span>
              </div>
              <h1 className="mt-5 font-serif-display text-[clamp(4rem,8vw,7.4rem)] leading-[0.88] text-[var(--ink)]">
                {card.nameZh}
              </h1>
              <p className="mt-4 font-serif-display text-[28px] italic text-[var(--ink-soft)]">
                {card.nameEn}
              </p>
              <p className="mt-7 max-w-3xl text-[17px] leading-8 text-[var(--ink-soft)]">
                {titleSection?.body.slice(0, 2).join("") || card.summary || card.meaningUpright}
              </p>
              <Ornament variant="rule" className="mt-8 max-w-[360px] opacity-70" />
            </header>

            <div className="grid gap-x-12 gap-y-12 xl:grid-cols-[minmax(0,1fr)_240px]">
              <article className="min-w-0 space-y-14">
                {contentSections.map((section, index) => (
                  <section
                    id={getSectionId(index)}
                    key={`${section.title}-${index}`}
                    className="relative scroll-mt-24"
                  >
                    <div
                      aria-hidden
                      className="mb-5 flex items-center gap-3 text-[var(--coral)]"
                    >
                      <Ornament variant="rose" className="opacity-80" />
                      <span className="h-px flex-1 bg-gradient-to-r from-[var(--coral-edge)] via-[var(--coral-edge)] to-transparent" />
                      <span className="font-occult text-[10px] tracking-[0.32em] text-[var(--ink-muted)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h2 className="font-serif-display text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] tracking-[-0.012em] text-[var(--ink)]">
                      {section.title}
                    </h2>
                    <div className="mt-6 space-y-4 pl-[14px] text-[15.5px] leading-8 text-[var(--ink-soft)]">
                      {section.body.map((paragraph, paragraphIndex) =>
                        paragraph.startsWith("- ") ? (
                          <p
                            key={paragraphIndex}
                            className="-ml-1 pl-5 text-[15px] before:mr-3 before:text-[var(--coral)] before:content-['✦']"
                          >
                            {paragraph.slice(2)}
                          </p>
                        ) : (
                          <p key={paragraphIndex} className="indent-[1.4em]">
                            {paragraph}
                          </p>
                        ),
                      )}
                    </div>
                  </section>
                ))}

                <div className="flex flex-col items-center gap-3 pt-12">
                  <Ornament variant="sun" className="opacity-25" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--ink-muted)] opacity-60">
                    Fin · 牌义已止
                  </span>
                </div>
              </article>

              <aside className="hidden xl:block">
                <div className="space-y-4 border-l border-[rgba(74,59,50,0.14)] py-1 pl-6 pr-2 text-[12px] leading-5 text-[var(--ink-muted)]">
                  <p className="eyebrow-ink">本页章节</p>
                  {contentSections.map((section, index) => (
                    <Link
                      key={`${section.title}-${index}-toc`}
                      href={`#${getSectionId(index)}`}
                      className="flex gap-3 transition hover:text-[var(--coral-deep)]"
                    >
                      <span className="text-[var(--coral)]">{String(index + 1).padStart(2, "0")}</span>
                      <span>{section.title}</span>
                    </Link>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
