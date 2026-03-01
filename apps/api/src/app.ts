import Fastify from "fastify";
import cors from "@fastify/cors";
import { ZodError } from "zod";
import { appConfig, type AppConfig } from "./config";
import { AuthService } from "./auth/auth-service";
import { InMemoryRepository } from "./db/in-memory-repository";
import { PostgresRepository } from "./db/postgres-repository";
import type { Repository } from "./db/repository";
import { createEmbeddingProvider } from "./embeddings/factory";
import type { EmbeddingProvider } from "./embeddings/types";
import { PushNotificationService } from "./notifications/push-service";
import { SlidingWindowRateLimiter } from "./rate-limiter";
import { seedDemoData } from "./seed-data";
import { PostService } from "./services/post-service";

interface AppOverrides {
  config?: AppConfig;
  repository?: Repository;
  embeddingProvider?: EmbeddingProvider;
  authService?: AuthService;
}

export async function buildApp(overrides: AppOverrides = {}) {
  const config = overrides.config ?? appConfig;
  const app = Fastify({ logger: config.NODE_ENV !== "test" });
  await app.register(cors, { origin: config.API_ORIGIN === "*" ? true : config.API_ORIGIN });

  const repository = overrides.repository
    ?? (config.DATABASE_URL
      ? PostgresRepository.fromConnectionString(config.DATABASE_URL)
      : new InMemoryRepository());

  const embeddingProvider = overrides.embeddingProvider ?? createEmbeddingProvider(config);
  const authService = overrides.authService ?? new AuthService(config);
  const pushService = new PushNotificationService(repository, config);
  const postService = new PostService(
    repository,
    embeddingProvider,
    pushService,
    new SlidingWindowRateLimiter(config.MAX_POSTS_PER_HOUR, 60 * 60 * 1000),
    new SlidingWindowRateLimiter(config.MAX_CONTACTS_PER_HOUR, 60 * 60 * 1000)
  );

  app.setErrorHandler((error: unknown, _request, reply) => {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

    if (error instanceof ZodError) {
      reply.status(400).send({
        error: "VALIDATION_ERROR",
        issues: error.issues
      });
      return;
    }

    if (message === "POST_RATE_LIMITED" || message === "CONTACT_RATE_LIMITED") {
      reply.status(429).send({ error: message });
      return;
    }

    if (message === "POST_NOT_FOUND" || message === "POST_NOT_FOUND_OR_FORBIDDEN") {
      reply.status(404).send({ error: message });
      return;
    }

    app.log.error(error);
    reply.status(500).send({ error: "INTERNAL_SERVER_ERROR", message: message, trace: error instanceof Error ? error.stack : undefined });
  });

  async function requireUser(request: Parameters<AuthService["verifyRequest"]>[0], reply: any) {
    const user = await authService.verifyRequest(request);
    if (!user) {
      reply.status(401).send({ error: "UNAUTHORIZED" });
      return null;
    }
    await repository.upsertUser(user);
    return user;
  }

  app.get("/health", async () => {
    const dbOk = await repository.checkHealth();
    return {
      status: dbOk ? "UP" : "DEGRADED",
      database: dbOk ? "CONNECTED" : "DISCONNECTED",
      timestamp: new Date().toISOString()
    };
  });

  app.post("/auth/verify", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) {
      return;
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone
    };
  });

  app.post("/posts", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) {
      return;
    }

    const created = await postService.createPost(user.id, request.body);
    reply.status(201).send(created);
  });

  app.get("/posts", async (request, _reply) => {
    const maybeUser = await authService.verifyRequest(request);
    const posts = await postService.listPosts(request.query, maybeUser?.id);
    return { items: posts };
  });

  app.get<{ Params: { id: string } }>("/posts/:id", async (request, reply) => {
    const maybeUser = await authService.verifyRequest(request);
    const post = await postService.getPost(request.params.id, maybeUser?.id);
    if (!post) {
      reply.status(404).send({ error: "POST_NOT_FOUND" });
      return;
    }
    return post;
  });

  app.post<{ Params: { id: string } }>("/posts/:id/sightings", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) {
      return;
    }

    const sighting = await postService.addSighting(user.id, request.params.id, request.body);
    reply.status(201).send(sighting);
  });

  app.post<{ Params: { id: string } }>("/posts/:id/contact", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) {
      return;
    }

    const result = await postService.contactPost(user.id, request.params.id, request.body);
    return result;
  });

  app.post<{ Params: { id: string } }>("/posts/:id/report", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) {
      return;
    }

    const result = await postService.reportPost(user.id, request.params.id, request.body);
    return result;
  });

  app.post<{ Params: { id: string } }>("/posts/:id/resolve", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) {
      return;
    }

    const resolved = await postService.resolvePost(user.id, request.params.id);
    return resolved;
  });

  app.delete<{ Params: { id: string } }>("/posts/:id", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) {
      return;
    }

    const deleted = await postService.deletePost(user.id, request.params.id);
    return deleted;
  });

  app.get("/matches", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) {
      return;
    }

    const matches = await postService.listMatches(user.id);
    return { items: matches };
  });

  app.get("/profile/posts", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) {
      return;
    }

    const posts = await postService.listMyPosts(user.id);
    return { items: posts };
  });

  app.post("/push/register-token", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) {
      return;
    }

    const response = await postService.registerPushToken(user.id, request.body);
    return response;
  });

  if (!config.DATABASE_URL && config.AUTO_SEED_DEMO && config.NODE_ENV !== "test") {
    await seedDemoData(postService, repository);
  }

  return app;
}
