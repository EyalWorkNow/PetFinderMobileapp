import type { AppConfig } from "../config";
import { MockEmbeddingProvider } from "./mock-provider";
import { OpenAIEmbeddingProvider } from "./openai-provider";
import type { EmbeddingProvider } from "./types";

export function createEmbeddingProvider(config: AppConfig): EmbeddingProvider {
  if (config.EMBEDDING_PROVIDER === "mock") {
    return new MockEmbeddingProvider(config.EMBEDDING_DIM);
  }

  if (config.EMBEDDING_PROVIDER === "openai") {
    if (!config.OPENAI_API_KEY) {
      throw new Error("EMBEDDING_PROVIDER=openai requires OPENAI_API_KEY.");
    }
    return new OpenAIEmbeddingProvider(config.OPENAI_API_KEY);
  }

  if (config.OPENAI_API_KEY) {
    return new OpenAIEmbeddingProvider(config.OPENAI_API_KEY);
  }

  return new MockEmbeddingProvider(config.EMBEDDING_DIM);
}
