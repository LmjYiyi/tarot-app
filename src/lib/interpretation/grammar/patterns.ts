import type { Suit } from "@/lib/tarot/types";

import type { SelectedCardForAnalysis } from "@/lib/interpretation/analysis/types";
import type { SpreadReadingTemplate } from "@/lib/interpretation/templates";

import type { GrammarNote } from "./types";

const suitLabels: Record<Suit, string> = {
  cups: "圣杯",
  wands: "权杖",
  swords: "宝剑",
  pentacles: "星币",
};

function cardPower(card: SelectedCardForAnalysis) {
  const arcanaPower = card.card.arcana === "major" ? 3 : card.card.number >= 11 ? 2 : 1;
  return arcanaPower + (card.orientation === "正位" ? 1 : -1);
}

function uniqueSortedNumbers(selectedCards: SelectedCardForAnalysis[]) {
  return selectedCards
    .map(({ card }) => card.number)
    .filter((number) => number >= 1 && number <= 10);
}

export function detectGrammarPatterns(
  selectedCards: SelectedCardForAnalysis[],
  template: SpreadReadingTemplate,
): GrammarNote[] {
  const notes: GrammarNote[] = [];
  const total = selectedCards.length || 1;
  const majorCount = selectedCards.filter(({ card }) => card.arcana === "major").length;
  const courtCount = selectedCards.filter(({ card }) => card.arcana === "minor" && card.number >= 11).length;
  const reversedCount = selectedCards.filter(({ orientation }) => orientation === "逆位").length;

  if (majorCount / total >= 0.45) {
    notes.push({
      type: "多张大阿卡纳",
      severity: "high",
      note: "大阿卡纳占比较高，先串大牌故事线，再用小牌补现实细节；不要夸大成宿命。",
    });
  }

  if (courtCount >= 2) {
    notes.push({
      type: "多张宫廷牌",
      severity: "medium",
      note: "宫廷牌密集出现，说明人际变量、角色姿态或内在子人格强烈介入；不要全都硬对号入座成具体人物。",
    });
  }

  if (reversedCount / total > 0.4) {
    notes.push({
      type: "多张逆位",
      severity: "high",
      note: "逆位集中，先处理内部站位、堵塞、过量或释放方式，再谈外部推进。",
    });
  }

  const suits = (["cups", "wands", "swords", "pentacles"] as Suit[]).map((suit) => ({
    suit,
    count: selectedCards.filter(({ card }) => card.suit === suit).length,
  }));
  const dominant = suits.find(({ count }) => count >= Math.max(2, Math.ceil(total * 0.5)));

  if (dominant) {
    notes.push({
      type: `同花色集中：${suitLabels[dominant.suit]}`,
      severity: "medium",
      note: `${suitLabels[dominant.suit]}占显著多数，同一生活维度被放大；主题清晰，但也可能单一维度过载。`,
    });
  }

  suits
    .filter(({ count }) => count === 0 && total >= 3)
    .forEach(({ suit }) => {
      notes.push({
        type: `缺失${suitLabels[suit]}`,
        severity: "medium",
        note: `${suitLabels[suit]}完全缺席，说明这一维度在此读局中几乎没有被调动；不要写成人格缺陷。`,
      });
    });

  const numbers = uniqueSortedNumbers(selectedCards);
  const duplicateNumbers = [...new Set(numbers)].filter(
    (number) => numbers.filter((candidate) => candidate === number).length >= 2,
  );

  duplicateNumbers.forEach((number) => {
    const special =
      number === 5
        ? "多张 5 暗示冲突、波动、失衡和转折中的摩擦。"
        : number === 8
          ? "多张 8 暗示能力化、技术化、成形中的进步和力量管理。"
          : number === 10
            ? "多张 10 暗示周期走满、结果显形和新循环门口。"
            : `多张 ${number} 表示同一阶段课题在不同花色中重复出现。`;
    notes.push({ type: `重复数字 ${number}`, severity: "medium", note: special });
  });

  const orderedNumbers = selectedCards
    .map(({ card }) => card.number)
    .filter((number) => number >= 1 && number <= 10);
  if (orderedNumbers.length >= 3) {
    const ascending = orderedNumbers.every(
      (number, index) => index === 0 || number >= orderedNumbers[index - 1],
    );
    const descending = orderedNumbers.every(
      (number, index) => index === 0 || number <= orderedNumbers[index - 1],
    );

    if (ascending && new Set(orderedNumbers).size > 1) {
      notes.push({
        type: "数字递进",
        severity: "low",
        note: "数字呈递进感，故事在顺序生长；强调过程正在成形，不要默认为必然成功。",
      });
    } else if (descending && new Set(orderedNumbers).size > 1) {
      notes.push({
        type: "数字倒退",
        severity: "low",
        note: "数字呈回退感，系统要求回到更基础的位置重整，而不是单纯退步。",
      });
    }
  }

  const first = selectedCards[0];
  const last = selectedCards.at(-1);
  if (first && last && cardPower(first) - cardPower(last) >= 3) {
    notes.push({
      type: "开头牌强、结尾牌弱",
      severity: "medium",
      note: "起势强但收束不足，容易虎头蛇尾，需要续航设计。",
    });
  }

  selectedCards.forEach((selectedCard) => {
    const weight = template.positionWeights[selectedCard.position.order];
    const role = `${weight?.role ?? ""}${selectedCard.position.name}`;
    if (/建议|调整|行动/.test(role) && selectedCard.orientation === "逆位") {
      notes.push({
        type: "建议位逆位",
        severity: "high",
        note: "建议位逆位时，建议常常是止损、减量、收回、沉淀或换姿势；不要解释成没有办法。",
      });
    }
    if (/结果|趋势|发展|未来|走向/.test(role) && selectedCard.orientation === "逆位") {
      notes.push({
        type: "趋势/结果位逆位",
        severity: "medium",
        note: "趋势位逆位表示结果延迟、未成熟或仍可调整，不要一口咬死失败。",
      });
    }
    if (/对方/.test(role) && selectedCard.orientation === "逆位") {
      notes.push({
        type: "对方位逆位",
        severity: "medium",
        note: "对方位逆位只谈呈现方式、回应模式和可观察信号，不下人格结论。",
      });
    }
    if (/自己|用户|我/.test(role) && selectedCard.orientation === "逆位") {
      notes.push({
        type: "自己位逆位",
        severity: "medium",
        note: "自己位逆位提示内在冲突或站位失衡，焦点是自我对齐而不是自责。",
      });
    }
  });

  return notes.slice(0, 12);
}
