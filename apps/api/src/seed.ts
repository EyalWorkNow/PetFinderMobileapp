import { appConfig } from "./config";
import { PostgresRepository } from "./db/postgres-repository";
import { createEmbeddingProvider } from "./embeddings/factory";
import { PushNotificationService } from "./notifications/push-service";
import { SlidingWindowRateLimiter } from "./rate-limiter";
import { seedDemoData } from "./seed-data";
import { PostService } from "./services/post-service";

async function main() {
  if (!appConfig.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for seeding Postgres data.");
  }

  const repository = PostgresRepository.fromConnectionString(appConfig.DATABASE_URL);
  const postService = new PostService(
    repository,
    createEmbeddingProvider(appConfig),
    new PushNotificationService(repository, {
      ...appConfig,
      EXPO_PUSH_ENABLED: false
    }),
    new SlidingWindowRateLimiter(1000, 60 * 60 * 1000),
    new SlidingWindowRateLimiter(1000, 60 * 60 * 1000)
  );

  await seedDemoData(postService, repository);
  await repository.close();

  // eslint-disable-next-line no-console
  console.log("Seed completed.");
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
