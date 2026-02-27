import OpenAI from "openai";
import type { EmbeddingInput, EmbeddingProvider, EmbeddingResult } from "./types";

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private readonly client: OpenAI;

  constructor(private readonly apiKey: string) {
    this.client = new OpenAI({ apiKey: this.apiKey });
  }

  async embed(input: EmbeddingInput): Promise<EmbeddingResult> {
    const caption = this.buildCaption(input);
    const response = await this.client.embeddings.create({
      model: "text-embedding-3-small",
      input: caption
    });

    const embedding = response.data[0]?.embedding;
    if (!embedding) {
      throw new Error("OpenAI embedding response did not include vector data.");
    }

    return {
      embedding,
      provider: "openai-text-embedding-3-small",
      caption
    };
  }

  private buildCaption(input: EmbeddingInput): string {
    return [
      `Possible ${input.type.toLowerCase()} ${input.petType.toLowerCase()} profile.`,
      `Title: ${input.title}.`,
      input.shortDesc ? `Description: ${input.shortDesc}.` : null,
      `Colors: ${input.colors.join(", ") || "unknown"}.`,
      `Breed: ${input.breed || "unknown"}.`,
      `Distinctive marks: ${input.marksText || "none"}.`,
      `Collar: ${input.collar ? `yes (${input.collarColor || "unknown color"})` : "no"}.`,
      `Photo references: ${input.photoPaths.join(", ")}.`
    ]
      .filter(Boolean)
      .join(" ");
  }
}
