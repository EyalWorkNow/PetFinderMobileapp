import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AppConfig } from "../src/config";
import { buildApp } from "../src/app";
import { InMemoryRepository } from "../src/db/in-memory-repository";
import { MockEmbeddingProvider } from "../src/embeddings/mock-provider";

const testConfig: AppConfig = {
  NODE_ENV: "test",
  PORT: 0,
  API_ORIGIN: "*",
  DATABASE_URL: undefined,
  SUPABASE_URL: undefined,
  SUPABASE_JWT_AUDIENCE: "authenticated",
  OPENAI_API_KEY: undefined,
  EMBEDDING_PROVIDER: "mock",
  EMBEDDING_DIM: 256,
  PUSH_MAX_PER_DAY: 3,
  EXPO_PUSH_ENABLED: false,
  DEV_AUTH_BYPASS: true,
  AUTO_SEED_DEMO: false,
  MAX_POSTS_PER_HOUR: 10,
  MAX_CONTACTS_PER_HOUR: 20
};

describe("posts integration", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    app = await buildApp({
      config: testConfig,
      repository: new InMemoryRepository(),
      embeddingProvider: new MockEmbeddingProvider(testConfig.EMBEDDING_DIM)
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it("creates posts and generates matches", async () => {
    const foundPayload = {
      type: "FOUND",
      petType: "DOG",
      status: "ACTIVE",
      title: "Found beagle",
      shortDesc: "Friendly brown and white dog",
      size: "M",
      colors: ["brown", "white"],
      collar: true,
      collarColor: "red",
      breed: "Beagle",
      marksText: "white chest patch",
      lastSeen: { lat: 40.7128, lng: -74.006, label: "SoHo" },
      lastSeenTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      radiusKm: 5,
      photos: [{ storagePath: "demo/beagle-found.jpg", takenAt: new Date().toISOString() }],
      sightings: [],
      contactMethod: "IN_APP",
      contactPhone: "+12125551234",
      hidePhone: true,
      revealPhoneOnContact: true,
      showApproximateLocation: true
    };

    const lostPayload = {
      ...foundPayload,
      type: "LOST",
      title: "Missing beagle",
      photos: [{ storagePath: "demo/beagle-lost.jpg", takenAt: new Date().toISOString() }]
    };

    const foundResponse = await app.inject({
      method: "POST",
      url: "/posts",
      headers: { "x-user-id": "user-found" },
      payload: foundPayload
    });

    expect(foundResponse.statusCode).toBe(201);

    const lostResponse = await app.inject({
      method: "POST",
      url: "/posts",
      headers: { "x-user-id": "user-lost" },
      payload: lostPayload
    });

    expect(lostResponse.statusCode).toBe(201);

    const matchesResponse = await app.inject({
      method: "GET",
      url: "/matches",
      headers: { "x-user-id": "user-lost" }
    });

    expect(matchesResponse.statusCode).toBe(200);

    const body = matchesResponse.json<{ items: Array<{ score: number }> }>();
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items[0].score).toBeGreaterThanOrEqual(0.75);
  });
});
