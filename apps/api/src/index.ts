import { appConfig } from "./config";
import { buildApp } from "./app";

async function main() {
  const app = await buildApp();
  await app.listen({ host: "0.0.0.0", port: appConfig.PORT });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
