export interface EmbeddingInput {
  type: string;
  petType: string;
  title: string;
  shortDesc?: string | null;
  colors: string[];
  breed?: string | null;
  marksText?: string | null;
  collar: boolean;
  collarColor?: string | null;
  photoPaths: string[];
}

export interface EmbeddingResult {
  embedding: number[];
  provider: string;
  caption: string;
}

export interface EmbeddingProvider {
  embed(input: EmbeddingInput): Promise<EmbeddingResult>;
}
