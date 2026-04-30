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
    <header
      className="hidden border-b border-[rgba(74,59,50,0.10)] sm:block"
      style={{
        position: "fixed",
        inset: "0 0 auto 0",
        zIndex: 100,
        background:
          "linear-gradient(180deg, rgba(251, 240, 200, 0.82) 0%, rgba(251, 240, 200, 0.66) 100%)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
        textShadow: "0 1px 0 rgba(253,248,225,0.78)",
      }}
    >
      <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-6 px-5 py-3.5 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-2.5 text-[var(--ink)]">
          <StarGlyph className="h-3.5 w-3.5 text-[var(--coral)]" />
          <span className="font-serif-display text-[19px] tracking-[-0.01em]">Arcana Flow</span>
        </Link>

        <nav className="flex items-center gap-1 text-[13.5px] font-medium text-[var(--ink)]">
          <Link className="rounded-[8px] px-3 py-1.5 transition hover:bg-[rgba(244,230,177,0.72)] hover:text-[var(--coral-deep)]" href="/spreads">
            牌阵
          </Link>
          <Link className="hidden rounded-[8px] px-3 py-1.5 transition hover:bg-[rgba(244,230,177,0.72)] hover:text-[var(--coral-deep)] sm:inline-flex" href="/cards/the-fool">
            牌义
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--ink-muted)] md:inline-flex">
            <span className="inline-block h-1 w-1 rounded-full bg-[var(--coral)]" />
            中文 · 即时读牌
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
    <footer className="relative isolate mt-8 overflow-hidden text-[var(--ink-soft)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-16 h-16 bg-[linear-gradient(180deg,rgba(251,240,200,0)_0%,rgba(251,240,200,0.28)_58%,rgba(251,240,200,0.48)_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(251,240,200,0.48)_0%,rgba(251,240,200,0.66)_42%,rgba(251,240,200,0.76)_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_18%_18%,rgba(253,248,225,0.46)_0%,transparent_56%),radial-gradient(ellipse_at_88%_0%,rgba(200,90,60,0.06)_0%,transparent_52%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[8%] top-0 h-36 bg-[radial-gradient(ellipse_at_center,rgba(200,90,60,0.07)_0%,rgba(251,240,200,0.18)_48%,transparent_74%)]"
      />
      <div className="relative z-10 mx-auto grid w-full max-w-[1320px] gap-7 px-6 py-9 [text-shadow:0_1px_0_rgba(253,248,225,0.72)] lg:grid-cols-[1.4fr_0.6fr_0.6fr] lg:px-12">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 text-[var(--ink)]">
            <StarGlyph className="h-3.5 w-3.5 text-[var(--coral)]" />
            <span className="font-serif-display text-[20px]">Arcana Flow</span>
          </div>
          <p className="font-serif-display text-[22px] leading-[1.25] text-[var(--ink)]">
            The cards whisper; you answer.
          </p>
          <p className="max-w-md text-[13.5px] leading-[1.7]">
            牌面与文字仅用于自我观察与灵感整理，不替代医疗、法律、投资及任何专业建议。
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
            I · 抽牌、翻牌、牌阵展示与牌面解读。
            <br />
            II · 更完整的牌阵记录、会话与导出。
          </p>
        </div>
      </div>
      <div className="relative z-10 border-t border-[rgba(74,59,50,0.08)] py-3 text-center font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--ink-muted)] [text-shadow:0_1px_0_rgba(253,248,225,0.68)]">
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
        <div className="relative flex min-h-screen w-full max-w-full flex-col overflow-x-hidden sm:pt-[57px]">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
