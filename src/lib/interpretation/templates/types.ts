export type SpreadReadingTemplate = {
  slug: string;
  purpose: string;
  sections: string[];
  instruction: string;
  positionWeights: Record<
    number,
    {
      weight: "primary" | "secondary" | "supporting";
      role: string;
    }
  >;
  timeScope: {
    defaultWindow: string;
    observationWindow: string;
    note: string;
  };
  positionRules: string[];
  relationRules: string[];
  forbiddenPatterns: string[];
  length: {
    min: number;
    max: number;
  };
  maxTokens: number;
};
