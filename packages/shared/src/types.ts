export const postTypeValues = ["LOST", "FOUND"] as const;
export const petTypeValues = ["DOG", "CAT", "PARROT", "OTHER"] as const;
export const postStatusValues = ["ACTIVE", "RESOLVED", "EXPIRED"] as const;
export const sizeValues = ["S", "M", "L", "UNKNOWN"] as const;
export const contactMethodValues = ["PHONE", "WHATSAPP", "IN_APP"] as const;

export type PostType = (typeof postTypeValues)[number];
export type PetType = (typeof petTypeValues)[number];
export type PostStatus = (typeof postStatusValues)[number];
export type PetSize = (typeof sizeValues)[number];
export type ContactMethod = (typeof contactMethodValues)[number];

export interface LocationPoint {
  lat: number;
  lng: number;
  label?: string | null;
}

export interface PostAttributes {
  size: PetSize;
  colors: string[];
  collar: boolean;
  collarColor?: string | null;
  breed?: string | null;
  marksText?: string | null;
}

export interface MatchScoringInput {
  vectorA: number[];
  vectorB: number[];
  attributesA: PostAttributes;
  attributesB: PostAttributes;
  locationA: LocationPoint;
  locationB: LocationPoint;
  seenAtA: Date;
  seenAtB: Date;
  radiusKmA: number;
  radiusKmB: number;
  now?: Date;
}

export interface MatchScoreBreakdown {
  visual: number;
  attributes: number;
  geo: number;
  time: number;
  total: number;
}
