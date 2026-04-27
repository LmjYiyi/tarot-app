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
    <header className="absolute inset-x-0 top-0 z-40">
      <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-6 px-5 py-5 text-[10px] uppercase tracking-[0.34em] text-[var(--ink-soft)] sm:px-8 lg:px-12">
        <nav className="flex items-center gap-5 font-occult">
          <Link className="hover:text-[var(--brass)]" href="/spreads">
            Spreads · 牌阵
          </Link>
          <Link className="hidden hover:text-[var(--brass)] sm:inline-flex" href="/cards/the-fool">
            Arcana · 牌义
          </Link>
        </nav>

        <Link href="/" className="hidden items-center gap-3 text-[var(--ink-rich)] sm:flex">
          <StarGlyph className="h-3 w-3 text-[var(--brass)] opacity-60" />
          <span className="font-serif-display text-lg italic normal-case tracking-wide">Arcana Flow</span>
          <StarGlyph className="h-3 w-3 text-[var(--brass)] opacity-60" />
        </Link>

        <div className="flex items-center justify-end gap-5 font-occult">
          <span className="hidden items-center gap-2 md:inline-flex">
            <span className="inline-block h-1 w-1 rounded-full bg-[var(--brass)]" />
            固定抽牌 · 反馈解读
          </span>
          <Link className="hover:text-[var(--brass)]" href="/spreads">
            开始
          </Link>
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="relative border-t border-[var(--border)] bg-[var(--parchment-deep)]/45 text-[var(--ink-muted)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--border-strong)] to-transparent" />
      <div className="mx-auto grid w-full max-w-[1320px] gap-10 px-6 py-12 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-12">
        <div className="space-y-3">
          <p className="eyebrow-gold">Arcana Flow · MMXXVI</p>
          <p className="font-serif-display text-3xl italic text-[var(--ink-rich)]">
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
              <Link className="hover:text-[var(--brass)]" href="/spreads">
                牌阵索引
              </Link>
            </li>
            <li>
              <Link className="hover:text-[var(--brass)]" href="/cards/the-fool">
                牌义图册
              </Link>
            </li>
          </ul>
        </div>
        <div className="space-y-3 text-sm">
          <p className="eyebrow-gold">Phase</p>
          <p className="leading-7 text-[var(--text-faint)]">
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
