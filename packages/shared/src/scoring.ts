import type { MatchScoreBreakdown, MatchScoringInput, PostAttributes } from "./types";

const VISUAL_WEIGHT = 0.45;
const ATTR_WEIGHT = 0.25;
const GEO_WEIGHT = 0.2;
const TIME_WEIGHT = 0.1;

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] ** 2;
    magB += b[i] ** 2;
  }

  if (magA === 0 || magB === 0) {
    return 0;
  }

  const score = dot / (Math.sqrt(magA) * Math.sqrt(magB));
  return clamp01(score);
}

function textSimilarity(a?: string | null, b?: string | null): number {
  if (!a || !b) {
    return 0;
  }
  const normA = a.trim().toLowerCase();
  const normB = b.trim().toLowerCase();
  if (normA === normB) {
    return 1;
  }
  if (normA.includes(normB) || normB.includes(normA)) {
    return 0.7;
  }
  return 0;
}

function jaccard(valuesA: string[], valuesB: string[]): number {
  const setA = new Set(valuesA.map((value) => value.toLowerCase().trim()));
  const setB = new Set(valuesB.map((value) => value.toLowerCase().trim()));
  if (setA.size === 0 || setB.size === 0) {
    return 0;
  }
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersection += 1;
    }
  }
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

export function attributeScore(a: PostAttributes, b: PostAttributes): number {
  const sizeScore = a.size !== "UNKNOWN" && a.size === b.size ? 1 : 0;
  const colorScore = jaccard(a.colors, b.colors);

  const collarScore = a.collar === b.collar
    ? a.collar
      ? 0.5 + 0.5 * textSimilarity(a.collarColor, b.collarColor)
      : 1
    : 0;

  const breedScore = a.breed && b.breed
    ? textSimilarity(a.breed, b.breed)
    : 0.5;

  const marksScore = a.marksText && b.marksText
    ? textSimilarity(a.marksText, b.marksText)
    : 0.5;

  const weighted =
    sizeScore * 0.2 +
    colorScore * 0.25 +
    collarScore * 0.2 +
    breedScore * 0.2 +
    marksScore * 0.15;

  return clamp01(weighted);
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export function geoScore(distanceKm: number, radiusKmA: number, radiusKmB: number): number {
  const effectiveRadius = Math.max((radiusKmA + radiusKmB) / 2, 0.5);
  return clamp01(Math.exp(-distanceKm / effectiveRadius));
}

export function timeScore(seenAtA: Date, seenAtB: Date, now = new Date()): number {
  const hoursSinceA = Math.abs(now.getTime() - seenAtA.getTime()) / 36e5;
  const hoursSinceB = Math.abs(now.getTime() - seenAtB.getTime()) / 36e5;
  const deltaHours = Math.abs(seenAtA.getTime() - seenAtB.getTime()) / 36e5;
  const recencyPenalty = Math.exp(-(hoursSinceA + hoursSinceB) / 240);
  const overlapPenalty = Math.exp(-deltaHours / 72);
  return clamp01(recencyPenalty * overlapPenalty);
}

export function scoreMatch(input: MatchScoringInput): MatchScoreBreakdown {
  const visual = cosineSimilarity(input.vectorA, input.vectorB);
  const attributes = attributeScore(input.attributesA, input.attributesB);
  const distanceKm = haversineKm(
    input.locationA.lat,
    input.locationA.lng,
    input.locationB.lat,
    input.locationB.lng
  );
  const geo = geoScore(distanceKm, input.radiusKmA, input.radiusKmB);
  const time = timeScore(input.seenAtA, input.seenAtB, input.now);

  const total =
    visual * VISUAL_WEIGHT +
    attributes * ATTR_WEIGHT +
    geo * GEO_WEIGHT +
    time * TIME_WEIGHT;

  return {
    visual,
    attributes,
    geo,
    time,
    total: clamp01(total)
  };
}

function clamp01(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }
  if (value <= 0) {
    return 0;
  }
  if (value >= 1) {
    return 1;
  }
  return value;
}
