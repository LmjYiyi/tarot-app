import { StaticDeckKnowledgeProvider } from "@/lib/knowledge/static-provider";
import type { KnowledgeContextProvider } from "@/lib/knowledge/types";

let staticProvider: KnowledgeContextProvider | null = null;

export function getKnowledgeProvider(): KnowledgeContextProvider {
  const mode = process.env.KNOWLEDGE_MODE ?? "static";

  if (mode === "rag") {
    // Placeholder switch: real RAG provider can slot in later without touching route contracts.
    return getStaticProvider();
  }

  return getStaticProvider();
}

function getStaticProvider() {
  if (!staticProvider) {
    staticProvider = new StaticDeckKnowledgeProvider();
  }

  return staticProvider;
}
