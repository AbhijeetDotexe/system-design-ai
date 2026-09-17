import { app } from "./app.js";
import { ENV } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { logger } from "./utils/logger.js";

async function bootstrap() {
  await connectDatabase();

  app.listen(ENV.PORT, () => {
    logger.info(`[SystemCraft API] Server running on http://localhost:${ENV.PORT}`);
    logger.info(`[SystemCraft API] Accepting requests from: ${ENV.CLIENT_URL}`);
  });
}

bootstrap().catch((err) => {
  logger.error("[SystemCraft API] Fatal startup error:", err);
  process.exit(1);
});
