import type { SpreadDefinition } from "@/lib/tarot/types";

import type { GeneralAnalysis, QuestionDiagnosis, SelectedCardForAnalysis } from "./analysis/types";
import type { ReadingGrammarAnalysis } from "./grammar";
import type { SpreadReadingTemplate } from "./templates";

export type InterpretationPlan = {
  template: SpreadReadingTemplate;
  generalAnalysis: GeneralAnalysis;
  grammarAnalysis: ReadingGrammarAnalysis;
  questionDiagnosis: QuestionDiagnosis;
  spreadSpecificNotes: string[];
};

function findByOrder(selectedCards: SelectedCardForAnalysis[], order: number) {
  return selectedCards.find(({ position }) => position.order === order) ?? null;
}

function label(card: SelectedCardForAnalysis | null) {
  if (!card) return "未抽到对应牌位";
  return `${card.position.name}=${card.card.nameZh}（${card.orientation}）`;
}

function buildSpreadSpecificNotes(
  spread: SpreadDefinition | null,
  selectedCards: SelectedCardForAnalysis[],
) {
  switch (spread?.slug) {
    case "career-five":
      return [
        `阻碍与优势对照：${label(findByOrder(selectedCards, 2))} / ${label(findByOrder(selectedCards, 3))}。`,
        `近期发展与建议对照：${label(findByOrder(selectedCards, 4))} / ${label(findByOrder(selectedCards, 5))}。`,
      ];
    case "relationship-six":
      return [
        `双方状态对照：${label(findByOrder(selectedCards, 1))} / ${label(findByOrder(selectedCards, 2))}。`,
        `关系本身、阻碍、建议链路：${label(findByOrder(selectedCards, 3))} -> ${label(findByOrder(selectedCards, 4))} -> ${label(findByOrder(selectedCards, 6))}。`,
      ];
    case "lovers-pyramid":
      return [
        `你与对方对照：${label(findByOrder(selectedCards, 1))} / ${label(findByOrder(selectedCards, 2))}。`,
        `关系结构与发展：${label(findByOrder(selectedCards, 3))} -> ${label(findByOrder(selectedCards, 4))}。`,
      ];
    case "path-of-choice":
      return [
        `路径 A：${label(findByOrder(selectedCards, 1))} -> ${label(findByOrder(selectedCards, 2))}。`,
        `路径 B：${label(findByOrder(selectedCards, 3))} -> ${label(findByOrder(selectedCards, 4))}。`,
        `隐藏变量与决策动作：${label(findByOrder(selectedCards, 5))} / ${label(findByOrder(selectedCards, 6))}。`,
      ];
    case "self-state":
      return [
        `外在与内在对照：${label(findByOrder(selectedCards, 1))} / ${label(findByOrder(selectedCards, 2))}。`,
        `压力、需求、调整链路：${label(findByOrder(selectedCards, 3))} -> ${label(findByOrder(selectedCards, 4))} -> ${label(findByOrder(selectedCards, 5))}。`,
      ];
    case "celtic-cross":
      return [
        `核心冲突：${label(findByOrder(selectedCards, 1))} x ${label(findByOrder(selectedCards, 2))}。`,
        `个人态度与环境因素：${label(findByOrder(selectedCards, 7))} / ${label(findByOrder(selectedCards, 8))}。`,
        `短期变化与长期趋势：${label(findByOrder(selectedCards, 6))} -> ${label(findByOrder(selectedCards, 10))}。`,
      ];
    case "cross-five":
      return [
        `中心牌与趋势：${label(findByOrder(selectedCards, 1))} -> ${label(findByOrder(selectedCards, 4))}。`,
        `阻碍/帮助判断：${label(findByOrder(selectedCards, 5))}。`,
      ];
    default:
      return selectedCards.length
        ? [`主线牌位：${label(selectedCards[0])}；收束牌位：${label(selectedCards.at(-1) ?? null)}。`]
        : [];
  }
}

export function buildInterpretationPlan({
  template,
  spread,
  selectedCards,
  generalAnalysis,
  grammarAnalysis,
  questionDiagnosis,
}: {
  template: SpreadReadingTemplate;
  spread: SpreadDefinition | null;
  selectedCards: SelectedCardForAnalysis[];
  generalAnalysis: GeneralAnalysis;
  grammarAnalysis: ReadingGrammarAnalysis;
  questionDiagnosis: QuestionDiagnosis;
}): InterpretationPlan {
  return {
    template,
    generalAnalysis,
    grammarAnalysis,
    questionDiagnosis,
    spreadSpecificNotes: buildSpreadSpecificNotes(spread, selectedCards),
  };
}
