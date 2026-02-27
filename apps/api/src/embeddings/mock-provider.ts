import { createHash } from "node:crypto";
import type { EmbeddingInput, EmbeddingProvider, EmbeddingResult } from "./types";

function normalize(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) {
    return vector;
  }
  return vector.map((value) => value / magnitude);
}

function hashToken(token: string): Buffer {
  return createHash("sha256").update(token).digest();
}

function toCaption(input: EmbeddingInput): string {
  return [
    `${input.type} ${input.petType}`,
    input.title,
    input.shortDesc,
    `colors:${input.colors.join(",")}`,
    `breed:${input.breed ?? "unknown"}`,
    `marks:${input.marksText ?? "none"}`,
    `collar:${input.collar ? `yes-${input.collarColor ?? "unknown"}` : "no"}`
  ]
    .filter(Boolean)
    .join(" | ");
}

function tokenize(caption: string): string[] {
  const words = caption
    .toLowerCase()
    .replace(/[^a-z0-9\s|,:-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1);

  const pairs: string[] = [];
  for (let i = 0; i < words.length - 1; i += 1) {
    pairs.push(`${words[i]}_${words[i + 1]}`);
  }

  return [...words, ...pairs];
}

export class MockEmbeddingProvider implements EmbeddingProvider {
  constructor(private readonly dimension = 1536) {}

  async embed(input: EmbeddingInput): Promise<EmbeddingResult> {
    const caption = toCaption(input);
    const tokens = tokenize(caption);
    const vector = new Array<number>(this.dimension).fill(0);

    for (const token of tokens) {
      const digest = hashToken(token);
      const index = digest.readUInt32BE(0) % this.dimension;
      const sign = digest[4] % 2 === 0 ? 1 : -1;
      const weight = 0.4 + digest.readUInt16BE(5) / 65535;
      vector[index] += sign * weight;
    }

    if (input.photoPaths.length > 0) {
      const photoFingerprint = hashToken(input.photoPaths.map((path) => path.split("/").pop() ?? path).join("|"));
      const idx = photoFingerprint.readUInt32BE(0) % this.dimension;
      vector[idx] += 0.25;
    }

    return {
      embedding: normalize(vector),
      provider: "mock-token-hash-v1",
      caption
    };
  }
}
