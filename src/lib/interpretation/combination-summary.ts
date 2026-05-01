import type { SpreadDefinition, TarotCard } from "../tarot/types";

type SelectedCardForCombination = {
  card: TarotCard;
  position: SpreadDefinition["positions"][number];
};

function normalizeCombinationSlug(slug: string) {
  return slug.replace(/^the-(justice|judgement|wheel-of-fortune)$/, "$1");
}

export function buildCombinationSummary(selectedCards: SelectedCardForCombination[]) {
  const lines: string[] = [];

  selectedCards.forEach(({ card, position }) => {
    card.combinations?.forEach((combination) => {
      const matchedCard = selectedCards.find(
        (candidate) =>
          candidate.card.id !== card.id &&
          normalizeCombinationSlug(candidate.card.slug) ===
            normalizeCombinationSlug(combination.cardSlug),
      );

      if (!matchedCard) {
        return;
      }

      lines.push(
        `- ${card.nameZh}（位置${position.order}「${position.name}」） + ${matchedCard.card.nameZh}（位置${matchedCard.position.order}「${matchedCard.position.name}」）：存在组合资料，只提示这两张牌需要联动观察；必须按牌位、正逆位和结构分析重新归纳，不得引用组合资料原句。`,
      );
    });
  });

  return lines.length
    ? lines.join("\n")
    : "本次抽到的牌之间暂无可用组合联动提示，请只按牌阵位置、塔罗语法和单牌含义整合。";
}
