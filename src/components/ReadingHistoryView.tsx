"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { Ornament } from "@/components/ui/ornament";
import {
  clearLocalReadings,
  extractTokenFromInput,
  getLocalReadingsServerSnapshot,
  getLocalReadingsSnapshot,
  removeLocalReading,
  subscribeLocalReadings,
  type LocalReadingEntry,
} from "@/lib/readings/local-history";

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return dateFormatter.format(parsed);
}

export function ReadingHistoryView() {
  const router = useRouter();
  const entries = useSyncExternalStore(
    subscribeLocalReadings,
    getLocalReadingsSnapshot,
    getLocalReadingsServerSnapshot,
  );
  const [lookup, setLookup] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);

  const sortedEntries = useMemo(
    () =>
      [...entries].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [entries],
  );

  function handleLookupSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLookupError(null);
    const token = extractTokenFromInput(lookup);
    if (!token) {
      setLookupError("没有从输入中识别出有效的占卜链接或编码。");
      return;
    }
    router.push(`/r/${token}`);
  }

  function handleRemove(token: string) {
    removeLocalReading(token);
  }

  function handleClearAll() {
    if (!window.confirm("确认清空本机所有占卜记录吗？此操作不可撤销。")) return;
    clearLocalReadings();
  }

  return (
    <div className="space-y-14">
      <section className="relative overflow-hidden rounded-[18px] border border-[var(--line-strong)] bg-[rgba(253,248,225,0.66)] px-6 py-8 shadow-[0_18px_36px_rgba(74,59,50,0.10)] sm:px-8">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,rgba(200,90,60,0.10)_0%,transparent_68%)]"
        />
        <div className="relative mb-5 flex flex-col gap-2">
          <p className="eyebrow">Lookup · 直接查询</p>
          <h2 className="font-serif-display text-[28px] leading-tight text-[var(--ink)]">
            粘贴占卜链接或编码
          </h2>
          <p className="text-[14.5px] leading-7 text-[var(--ink-soft)]">
            支持完整链接（如 <span className="font-mono text-[12.5px] text-[var(--coral-deep)]">/r/2b05eb056fa1eab1</span>）或仅 token。回车跳转到对应记录。
          </p>
        </div>
        <form onSubmit={handleLookupSubmit} className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={lookup}
            onChange={(event) => {
              setLookup(event.target.value);
              if (lookupError) setLookupError(null);
            }}
            placeholder="粘贴 https://.../r/xxxxxxxx 或直接输入 token"
            className="flex-1 rounded-[10px] border border-[var(--line-strong)] bg-[var(--surface-tint)] px-4 py-3 text-[14.5px] text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-faint)] focus:border-[var(--coral)] focus:ring-2 focus:ring-[var(--coral-edge)]"
          />
          <Button type="submit" className="shrink-0">
            查询
          </Button>
        </form>
        {lookupError ? (
          <p className="relative mt-3 text-[13px] text-[var(--coral-deep)]">{lookupError}</p>
        ) : null}
      </section>

      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--line)] pb-4">
          <div>
            <p className="eyebrow">Local Journal · 本机记录</p>
            <h2 className="mt-2 font-serif-display text-[30px] leading-tight text-[var(--ink)]">
              这台设备上的占卜
            </h2>
            <p className="mt-1.5 text-[13.5px] leading-6 text-[var(--ink-muted)]">
              仅保存在本地浏览器，清除浏览数据或更换设备后会丢失，请同时保留链接以便长期回看。
            </p>
          </div>
          {sortedEntries.length > 0 ? (
            <Button variant="ghost" onClick={handleClearAll} className="text-[12.5px]">
              清空记录
            </Button>
          ) : null}
        </div>

        {sortedEntries.length === 0 ? (
          <EmptyHistory />
        ) : (
          <ul className="space-y-4">
            {sortedEntries.map((entry) => (
              <HistoryItem key={entry.shareToken} entry={entry} onRemove={handleRemove} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function HistoryItem({
  entry,
  onRemove,
}: {
  entry: LocalReadingEntry;
  onRemove: (token: string) => void;
}) {
  const sharePath = `/r/${entry.shareToken}`;
  const reversedSummary =
    entry.cardCount > 0
      ? entry.reversedCount === 0
        ? "全部正位"
        : entry.reversedCount === entry.cardCount
          ? "全部逆位"
          : `${entry.reversedCount} 张逆位`
      : null;

  return (
    <li className="group relative overflow-hidden rounded-[14px] border border-[var(--line)] bg-[rgba(253,248,225,0.58)] px-5 py-5 transition duration-300 hover:-translate-y-[2px] hover:border-[var(--coral-edge)] hover:bg-[rgba(253,248,225,0.82)] hover:shadow-[0_14px_28px_rgba(74,59,50,0.10)]">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[3px] origin-top scale-y-0 bg-[linear-gradient(180deg,var(--coral),var(--coral-deep))] transition-transform duration-300 group-hover:scale-y-100"
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            <span className="rounded-full bg-[var(--coral-wash)] px-2.5 py-0.5 text-[var(--coral-deep)]">
              {entry.spreadName}
            </span>
            <span>{formatTime(entry.createdAt)}</span>
            <span>· {entry.cardCount} 张</span>
            {reversedSummary ? <span>· {reversedSummary}</span> : null}
            {entry.intentLabel ? <span>· {entry.intentLabel}</span> : null}
          </div>
          <p className="font-serif-display text-[19px] leading-snug text-[var(--ink)] line-clamp-2">
            {entry.question?.trim() || "（未填写问题）"}
          </p>
          <p className="font-mono text-[11px] tracking-[0.18em] text-[var(--ink-faint)]">
            #{entry.shareToken}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={sharePath}
            className="inline-flex items-center justify-center rounded-[10px] border border-[var(--line-strong)] bg-transparent px-4 py-2 text-[13px] font-medium text-[var(--ink)] transition hover:border-[var(--ink-soft)] hover:bg-[var(--surface-raised)]"
          >
            打开 →
          </Link>
          <button
            type="button"
            onClick={() => onRemove(entry.shareToken)}
            className="rounded-[10px] px-3 py-2 text-[12.5px] text-[var(--ink-muted)] transition hover:bg-[var(--coral-wash)] hover:text-[var(--coral-deep)]"
            aria-label="从本地记录移除"
          >
            移除
          </button>
        </div>
      </div>
    </li>
  );
}

function EmptyHistory() {
  return (
    <div className="relative flex flex-col items-center gap-5 overflow-hidden rounded-[14px] border border-dashed border-[var(--line-strong)] bg-[rgba(253,248,225,0.42)] py-16 text-center">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-[20%] top-0 h-32 bg-[radial-gradient(ellipse_at_center,rgba(200,90,60,0.08)_0%,transparent_72%)]"
      />
      <Ornament variant="quatrefoil" />
      <div className="relative space-y-2 px-6">
        <p className="font-serif-display text-[22px] leading-tight text-[var(--ink)]">
          这里还没有任何占卜
        </p>
        <p className="text-[13.5px] leading-7 text-[var(--ink-soft)]">
          完成一次抽牌与解读后，记录会自动出现在这里。
          <br />
          如果是过往保留的链接，可以直接粘贴到上方查询框打开。
        </p>
      </div>
      <Link
        href="/spreads"
        className="relative inline-flex items-center justify-center rounded-[10px] bg-[var(--coral)] px-4 py-2 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(168,85,62,0.18)] transition hover:bg-[var(--coral-deep)]"
      >
        去翻一张牌 →
      </Link>
    </div>
  );
}
