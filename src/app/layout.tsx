import type { Metadata } from "next";
import Link from "next/link";
import { Cinzel, Cormorant_Garamond, Manrope } from "next/font/google";

import { siteConfig } from "@/lib/site";

import "./globals.css";

const bodyFont = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const displayFont = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const occultFont = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.title,
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.name,
    type: "website",
    url: siteConfig.url,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
};

function StarGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2 L13.4 10.6 L22 12 L13.4 13.4 L12 22 L10.6 13.4 L2 12 L10.6 10.6 Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--gilt)]/60 bg-[rgba(251,243,225,0.78)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)]/50 to-transparent" />
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-5 lg:px-10">
        <nav className="flex flex-1 items-center gap-8 text-[11px] font-medium uppercase tracking-[0.36em] text-[var(--ink-soft)] font-occult">
          <Link className="transition hover:text-[var(--copper)]" href="/spreads">
            Spreads · 牌阵
          </Link>
          <Link
            className="hidden transition hover:text-[var(--copper)] sm:inline-flex"
            href="/cards/the-fool"
          >
            Arcana · 牌义
          </Link>
        </nav>

        <Link href="/" className="group flex flex-col items-center leading-none">
          <span className="eyebrow-gold">Anno Arcana</span>
          <span className="mt-1 flex items-center gap-3 text-[var(--ink)]">
            <StarGlyph className="h-3 w-3 text-[var(--gold)] animate-shimmer" />
            <span className="font-serif-display text-2xl italic tracking-wide">Arcana Flow</span>
            <StarGlyph className="h-3 w-3 text-[var(--gold)] animate-shimmer" />
          </span>
        </Link>

        <div className="flex flex-1 items-center justify-end gap-6 text-[11px] font-medium uppercase tracking-[0.36em] text-[var(--ink-soft)] font-occult">
          <span className="hidden sm:inline-flex items-center gap-2">
            <span className="inline-block h-1 w-1 rounded-full bg-[var(--gold)]" />
            固定抽牌 · 反馈解读
          </span>
          <Link
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-white/70 px-4 py-2 text-[var(--ink)] transition hover:border-[var(--copper)] hover:text-[var(--copper)]"
            href="/spreads"
          >
            开始
          </Link>
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="relative border-t border-[var(--gilt)]/50 bg-[rgba(28,34,58,0.97)] text-[rgba(246,232,206,0.78)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)]/60 to-transparent" />
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-10">
        <div className="space-y-3">
          <p className="eyebrow-gold">Arcana Flow · MMXXVI</p>
          <p className="font-serif-display text-3xl italic text-[#f1e1c1]">
            &ldquo;The cards whisper; you answer.&rdquo;
          </p>
          <p className="text-sm leading-7">
            牌面、文字与生成内容仅用于自我观察与灵感整理，不替代医疗、法律、投资及任何专业建议。
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <p className="eyebrow-gold">Navigate</p>
          <ul className="space-y-2">
            <li>
              <Link className="hover:text-[var(--gold-soft)]" href="/spreads">
                牌阵索引
              </Link>
            </li>
            <li>
              <Link className="hover:text-[var(--gold-soft)]" href="/cards/the-fool">
                牌义图册
              </Link>
            </li>
          </ul>
        </div>
        <div className="space-y-3 text-sm">
          <p className="eyebrow-gold">Phase</p>
          <p className="leading-7 text-[rgba(246,232,206,0.6)]">
            I · 固定规则抽牌、牌面展示、直觉反馈与证据链解读。
            <br />
            II · 塔罗师工作台、客户会话与报告导出。
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      data-scroll-behavior="smooth"
      className={`${bodyFont.variable} ${displayFont.variable} ${occultFont.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className="relative flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
