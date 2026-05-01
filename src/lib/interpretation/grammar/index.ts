import type { SelectedCardForAnalysis } from "@/lib/interpretation/analysis/types";
import type { SpreadReadingTemplate } from "@/lib/interpretation/templates";

import { analyzeCourtRoles } from "./court-roles";
import { analyzeMajorArcanaChains } from "./major-chains";
import { detectGrammarPatterns } from "./patterns";
import { analyzeReversalGrammar } from "./reversals";
import { analyzeSuitDynamics } from "./suit-dynamics";
import type { ReadingGrammarAnalysis, WeightedPositionNote } from "./types";

function analyzeWeightedPositions(
  selectedCards: SelectedCardForAnalysis[],
  template: SpreadReadingTemplate,
): WeightedPositionNote[] {
  return selectedCards.map((selectedCard) => {
    const configured = template.positionWeights[selectedCard.position.order] ?? {
      weight: "secondary" as const,
      role: selectedCard.position.name,
    };

    return {
      order: selectedCard.position.order,
      positionName: selectedCard.position.name,
      cardName: selectedCard.card.nameZh,
      orientation: selectedCard.orientation,
      weight: configured.weight,
      role: configured.role,
      note:
        configured.weight === "primary"
          ? `「${selectedCard.position.name}」是主牌位，${selectedCard.card.nameZh}应获得更高篇幅权重。`
          : `「${selectedCard.position.name}」用于补充主线，不要抢走主牌位的解释权。`,
    };
  });
}

export function analyzeReadingGrammar({
  selectedCards,
  template,
}: {
  selectedCards: SelectedCardForAnalysis[];
  template: SpreadReadingTemplate;
}): ReadingGrammarAnalysis {
  return {
    timeScope: template.timeScope,
    weightedPositions: analyzeWeightedPositions(selectedCards, template),
    suitDynamics: analyzeSuitDynamics(selectedCards),
    patterns: detectGrammarPatterns(selectedCards, template),
    courtRoles: analyzeCourtRoles(selectedCards),
    majorArcanaChains: analyzeMajorArcanaChains(selectedCards),
    reversalNotes: analyzeReversalGrammar(selectedCards, template),
  };
}

export type { ReadingGrammarAnalysis } from "./types";
