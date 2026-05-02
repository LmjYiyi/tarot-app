import type { Metadata } from "next";
import Image from "next/image";

import { BookingForm } from "@/components/BookingForm";
import { WeChatCopy } from "@/components/WeChatCopy";
import { Ornament } from "@/components/ui/ornament";

export const metadata: Metadata = {
  title: "预约作者 | Arcana Flow",
  description: "在线表单预约作者本人的塔罗占卜，1 对 1 微信连线，回应你眼下最想问的事。",
};

const wechatId = "lmj123456lalala";

const offerings = [
  {
    title: "单题解惑",
    duration: "约 30 分钟",
    detail: "针对你最想问的具体问题，用三张或五张牌直击核心，给出清晰、可落地的建议。",
  },
  {
    title: "近期运势",
    duration: "约 45 分钟",
    detail: "扫描未来 1–3 个月的能量走向，看清顺势而为的时机与需要谨慎避坑的雷区。",
  },
  {
    title: "复杂专题",
    duration: "约 60 分钟",
    detail: "处理多方关系、职业转型等复杂议题。用更宏大的牌阵，抽丝剥茧理清当下的局面。",
  },
];

const principles = [
  "不替你做决定 —— 牌面像是一束光，照亮你潜意识里其实早就存在的答案。",
  "不预测死板的宿命 —— 未来的路有很多条，我们只看能量的趋势与岔路口，方向盘永远在你手里。",
  "绝对保密 —— 你的倾诉在这里很安全，我会作为一个安静的树洞，绝不二次传播。",
];

export default function BookingPage() {
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

      {/* HERO */}
      <section className="relative mx-auto grid w-full max-w-[1320px] grid-cols-1 gap-10 px-5 pb-14 pt-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-12 lg:pb-20 lg:pt-24">
        <div className="relative z-10 flex flex-col justify-center">
          <p className="eyebrow mb-5">Live Reading · 预约作者</p>
          <h1 className="font-serif-display text-[clamp(2.6rem,5.2vw,4.4rem)] leading-[1.05] tracking-[-0.018em] text-[var(--ink)]">
            想要一次<br />
            <span className="text-[var(--coral)]">真人对话</span>的占卜？
          </h1>

          <p className="mt-6 max-w-[560px] text-[16.5px] leading-[1.75] text-[var(--ink-soft)]">
            如果在线抽牌不足以解开眼下的线团，不妨来一次 1 对 1 的真人连线。
            填个表单，我会在微信那头等你，听听你的问题，让牌面给你些实在的建议。
          </p>

          <div className="mt-10 grid max-w-[540px] grid-cols-3 gap-6 border-t border-[var(--line)] pt-6">
            <Stat figure="1v1" caption="专属语音/文字" />
            <Stat figure="78" caption="经典韦特牌" />
            <Stat figure="24h" caption="内响应回复" />
          </div>
        </div>

        {/* AUTHOR PROFILE */}
        <div className="relative flex flex-col justify-center lg:pl-12">
          <div className="relative max-w-[460px]">
            <div className="flex items-center gap-6">
              <div className="relative h-[160px] w-[160px] flex-shrink-0 overflow-hidden rounded-full border border-[var(--line-strong)]">
                <Image
                  src="/touxiang.jpg"
                  alt="作者头像"
                  fill
                  sizes="160px"
                  className="object-cover grayscale hover:grayscale-0 transition-all duration-500"
                />
              </div>
              <div>
                <p className="eyebrow">The Reader · 占卜师</p>
                <p className="mt-1 font-serif-display text-[26px] leading-tight text-[var(--ink)]">
                  Arcana Flow 作者
                </p>
                <p className="mt-1.5 font-mono text-[11px] text-[var(--ink-soft)]">
                  Rider-Waite · 赛博解惑 · 随缘营业
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-4 border-l-2 border-[var(--coral-edge)] pl-5">
              <div className="flex items-center gap-3">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                  WeChat
                </p>
                <span className="h-px w-6 bg-[var(--line)]" />
                <WeChatCopy wechatId={wechatId} />
              </div>
              <p className="text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
                添加好友请对暗号「<span className="text-[var(--coral-deep)]">预约占卜</span>」，方便我火速通过。或者直接填个表单丢过来，我会主动加你。
              </p>
            </div>

            {/* floating visual elements */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-4 -top-10 -z-10 h-32 w-32 rounded-full bg-[radial-gradient(circle_at_center,rgba(200,90,60,0.06)_0%,transparent_70%)] blur-xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-10 -left-6 -z-10 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,rgba(244,230,177,0.4)_0%,transparent_70%)] blur-xl"
            />
          </div>
        </div>
      </section>

      {/* OFFERINGS */}
      <section className="relative mx-auto w-full max-w-[1320px] px-5 pb-12 sm:px-8 lg:px-12">
        <div className="border-t border-[var(--line)] pt-12">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="eyebrow">Sessions · 占卜形式</p>
              <h2 className="mt-3 font-serif-display text-[clamp(2.1rem,3.4vw,3rem)] leading-[1.06] tracking-[-0.018em] text-[var(--ink)]">
                三种节奏，<br />
                按你想问的事来选。
              </h2>
            </div>
            <p className="max-w-md text-[14.5px] leading-7 text-[var(--ink-soft)]">
              预约之后，咱们先聊清楚眼下到底在纠结什么，挑个合适的牌阵，然后再正式开始读牌。
            </p>
          </div>

          <Ornament variant="rule" className="mb-10 max-w-sm opacity-70" />

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {offerings.map((item, index) => (
              <div
                key={item.title}
                className="group relative flex flex-col pt-4 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[var(--line)] before:transition-colors hover:before:bg-[var(--coral-edge)]"
              >
                <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--ink-muted)] transition-colors group-hover:text-[var(--coral)]">
                  {String(index + 1).padStart(2, "0")} · {item.duration}
                </p>
                <h3 className="mt-3 font-serif-display text-[24px] leading-tight text-[var(--ink)]">
                  {item.title}
                </h3>
                <p className="mt-3 text-[14px] leading-7 text-[var(--ink-soft)]">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORM + PRINCIPLES */}
      <section className="relative mx-auto w-full max-w-[1320px] px-5 pb-24 sm:px-8 lg:px-12">
        <div className="grid gap-10 border-t border-[var(--line)] pt-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
          <BookingForm />

          <aside className="relative">
            <div className="sticky top-24">
              <p className="eyebrow">Principles · 我的态度</p>
              <h2 className="mt-3 font-serif-display text-[28px] leading-[1.15] text-[var(--ink)]">
                关于这次占卜，<br />
                我先把话说在前面。
              </h2>
              <ul className="mt-6 space-y-4">
                {principles.map((line) => (
                  <li
                    key={line}
                    className="relative pl-6 text-[14.5px] leading-7 text-[var(--ink-soft)]"
                  >
                    <span
                      aria-hidden
                      className="absolute left-0 top-[10px] h-[6px] w-[6px] rotate-45 border border-[var(--coral)] bg-[var(--coral-wash)]"
                    />
                    {line}
                  </li>
                ))}
              </ul>

              <div className="mt-12 pt-6 border-t border-[var(--line)]">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                  Reach · 联络
                </p>
                <div className="mt-3 text-[13.5px] leading-6 text-[var(--ink-soft)]">
                  如果有些着急，不妨直接点击复制微信
                  <WeChatCopy wechatId={wechatId} className="inline-flex ml-2" />
                  备注「预约占卜」。平时填表即可，我会按顺序慢慢回复。
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function Stat({ figure, caption }: { figure: string; caption: string }) {
  return (
    <div>
      <p className="font-serif-display text-[34px] leading-none tracking-[-0.02em] text-[var(--ink)]">
        {figure}
      </p>
      <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        {caption}
      </p>
    </div>
  );
}

