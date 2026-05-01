import type { SelectedCardForAnalysis } from "@/lib/interpretation/analysis/types";
import type { SpreadReadingTemplate } from "@/lib/interpretation/templates";

import type { GrammarNote } from "./types";

function reversalNoteForRole(roleText: string) {
  if (/自己|用户|我|个人/.test(roleText)) {
    return "逆位在自己位：内在冲突、能量内卷或角色拒绝；输出时把焦点放在自我对齐，不要写成你做错了。";
  }
  if (/对方|他人|环境/.test(roleText)) {
    return "逆位在对方/环境位：只谈回应方式被遮蔽、延迟或失衡，不断言本性。";
  }
  if (/关系/.test(roleText)) {
    return "逆位在关系位：互动通道不顺、交换失衡或旧模式松动；把问题表述成结构。";
  }
  if (/阻碍|卡点|挑战/.test(roleText)) {
    return "逆位在阻碍位：阻碍可能来自压抑、否认或旧模式正在松开，不能简单读成双倍坏。";
  }
  if (/优势|资源|帮助/.test(roleText)) {
    return "逆位在优势/资源位：资源存在但还不会用、不敢用或用歪了，需区分潜在资源和成熟资源。";
  }
  if (/建议|调整|行动/.test(roleText)) {
    return "逆位在建议位：优先写停止、减量、收回、边界和内修，不要写成没有建议。";
  }
  if (/趋势|结果|发展|未来|走向/.test(roleText)) {
    return "逆位在趋势/结果位：趋势还未完全落地，关键在于先处理堵点。";
  }
  if (/隐藏|根因|潜意识/.test(roleText)) {
    return "逆位在隐藏因素位：真正驱动问题的因素仍不透明，适合写成你可能还没完全意识到。";
  }
  return "逆位表示内化、失衡、堵塞、过量、缺量或释放中，不要简单读成更坏。";
}

export function analyzeReversalGrammar(
  selectedCards: SelectedCardForAnalysis[],
  template: SpreadReadingTemplate,
): GrammarNote[] {
  const notes = selectedCards
    .filter(({ orientation }) => orientation === "逆位")
    .map((selectedCard) => {
      const positionRule = template.positionWeights[selectedCard.position.order];
      const roleText = `${positionRule?.role ?? ""}${selectedCard.position.name}${selectedCard.position.focus}`;

      return {
        type: `${selectedCard.position.name}逆位`,
        severity: "medium" as const,
        note: `${selectedCard.card.nameZh}落在「${selectedCard.position.name}」逆位。${reversalNoteForRole(roleText)}`,
      };
    });

  if (!notes.length) {
    return [
      {
        type: "全部正位",
        severity: "low",
        note: "全部正位表示能量大多可见、外放、可运作；不要因此断言一切都好，而是说情况更清晰可读。",
      },
    ];
  }

  return notes.slice(0, 6);
}
