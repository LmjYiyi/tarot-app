import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { Ornament } from "@/components/ui/ornament";
import { Panel } from "@/components/ui/panel";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[65vh] w-full max-w-3xl items-center px-6 py-20">
      <Panel variant="arched" className="w-full space-y-6 pt-24 text-center">
        <Ornament variant="rose" />
        <p className="eyebrow">Error · IV · XC · IV</p>
        <h1 className="font-serif-display text-[clamp(3rem,7vw,5rem)] italic leading-[1] text-[var(--ink)]">
          这一页还没被写入手札
        </h1>
        <p className="mx-auto max-w-xl text-[15px] leading-7 text-[var(--ink-soft)]">
          链接可能已经失效，或你访问了尚未生成的页面。不妨翻到别的章节，看看塔罗会怎么回应你今天的问题。
        </p>
        <Ornament variant="rule" className="mx-auto max-w-xs" />
        <div className="flex justify-center gap-3 pb-4">
          <Link className={buttonStyles({})} href="/spreads">
            去抽一组牌
          </Link>
          <Link className={buttonStyles({ variant: "secondary" })} href="/">
            返回首页
          </Link>
        </div>
      </Panel>
    </div>
  );
}
