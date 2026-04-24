export type KnowledgeBlockKind =
  | "card"
  | "spread"
  | "guide"
  | "article"
  | "practitioner_note"
  | "client_history";

export type KnowledgeBlock = {
  id: string;
  kind: KnowledgeBlockKind;
  title: string;
  text: string;
  tags: string[];
  metadata: Record<string, string | number | boolean | null>;
};

export type InterpretationContextInput = {
  question: string;
  spreadSlug: string;
  cardIds: string[];
  locale: string;
};

export type InterpretationContext = {
  systemPrompt: string;
  contextBlocks: KnowledgeBlock[];
  citations?: Array<{ id: string; title: string }>;
};

export interface KnowledgeContextProvider {
  getContext(input: InterpretationContextInput): Promise<InterpretationContext>;
}
