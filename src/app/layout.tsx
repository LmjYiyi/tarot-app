import type { Metadata } from "next";
import Link from "next/link";
import { Cinzel, Cormorant_Garamond, Fraunces, IBM_Plex_Mono, Manrope } from "next/font/google";

import { MouseTrail } from "@/components/MouseTrail";
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

const frauncesFont = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  weight: "variable",
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
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
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(250,249,245,0.82)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-6 px-5 py-3.5 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-2.5 text-[var(--ink)]">
          <StarGlyph className="h-3.5 w-3.5 text-[var(--coral)]" />
          <span className="font-serif-display text-[19px] tracking-[-0.01em]">Arcana Flow</span>
        </Link>

        <nav className="flex items-center gap-1 text-[13.5px] text-[var(--ink-soft)]">
          <Link className="rounded-[8px] px-3 py-1.5 transition hover:bg-[var(--surface-raised)] hover:text-[var(--ink)]" href="/spreads">
            牌阵
          </Link>
          <Link className="hidden rounded-[8px] px-3 py-1.5 transition hover:bg-[var(--surface-raised)] hover:text-[var(--ink)] sm:inline-flex" href="/cards/the-fool">
            牌义
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--ink-muted)] md:inline-flex">
            <span className="inline-block h-1 w-1 rounded-full bg-[var(--coral)]" />
            中文 · 流式解读
          </span>
          <Link
            className="inline-flex items-center justify-center rounded-[10px] bg-[var(--coral)] px-4 py-1.5 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(168,85,62,0.18)] transition hover:bg-[var(--coral-deep)]"
            href="/spreads"
          >
            开始抽牌
          </Link>
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="relative mt-20 border-t border-[var(--line)] bg-[var(--surface-tint)] text-[var(--ink-soft)]">
      <div className="mx-auto grid w-full max-w-[1320px] gap-10 px-6 py-14 lg:grid-cols-[1.4fr_0.6fr_0.6fr] lg:px-12">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 text-[var(--ink)]">
            <StarGlyph className="h-3.5 w-3.5 text-[var(--coral)]" />
            <span className="font-serif-display text-[20px]">Arcana Flow</span>
          </div>
          <p className="font-serif-display text-[26px] leading-[1.25] text-[var(--ink)]">
            The cards whisper; you answer.
          </p>
          <p className="max-w-md text-[13.5px] leading-[1.7]">
            牌面、文字与生成内容仅用于自我观察与灵感整理，不替代医疗、法律、投资及任何专业建议。
          </p>
        </div>
        <div className="space-y-3 text-[13.5px]">
          <p className="eyebrow-ink">导览 · Navigate</p>
          <ul className="space-y-2">
            <li><Link className="transition hover:text-[var(--coral-deep)]" href="/spreads">牌阵索引</Link></li>
            <li><Link className="transition hover:text-[var(--coral-deep)]" href="/cards/the-fool">牌义图册</Link></li>
          </ul>
        </div>
        <div className="space-y-3 text-[13.5px]">
          <p className="eyebrow-ink">进度 · Phase</p>
          <p className="leading-[1.75]">
            I · 抽牌、展示、直觉反馈与证据链解读。
            <br />
            II · 塔罗师工作台、客户会话与导出。
          </p>
        </div>
      </div>
      <div className="border-t border-[var(--line)] py-5 text-center font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
        Arcana Flow · 2026 · Made with care
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
      className={`${bodyFont.variable} ${displayFont.variable} ${occultFont.variable} ${frauncesFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <MouseTrail />
        <div className="relative flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
