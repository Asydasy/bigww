/**
 * Serwer BigWW. Uruchomienie: npm run dev (albo docker compose up).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import fstatic from "@fastify/static";
import { config } from "./config.js";
import authPlugin from "./plugins/auth.js";
import authRoutes from "./routes/auth.js";
import gamesRoutes from "./routes/games.js";
import adsRoutes from "./routes/ads.js";
import chatRoutes from "./routes/chat.js";
import { closeDb, pool } from "./db.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));

export async function buildServer(opts = {}) {
  const app = Fastify({
    logger: opts.logger ?? { level: process.env.LOG_LEVEL || "info" },
    trustProxy: true
  });

  // UWAGA: handler błędów musi być ustawiony PRZED rejestracją tras. Trasy
  // rejestrowane wcześniej zostają przy domyślnym handlerze Fastify, który
  // wysyła klientowi wewnętrzny komunikat błędu — np. nazwę brakującej funkcji
  // w bazie. Tego nie chcemy pokazywać na zewnątrz.
  app.setErrorHandler((err, request, reply) => {
    if (err.validation) {
      return reply.code(400).send({ error: "Nieprawidłowe dane w żądaniu.", szczegoly: err.message });
    }
    const status = err.statusCode && err.statusCode < 500 ? err.statusCode : 500;
    if (status >= 500) request.log.error(err);
    reply.code(status).send({
      error: status < 500 ? err.message : "Coś poszło nie tak po stronie serwera."
    });
  });

  await app.register(cors, { origin: config.corsOrigin, credentials: true });
  await app.register(rateLimit, { max: 300, timeWindow: "1 minute" });
  await app.register(authPlugin);

  app.get("/api/health", async () => {
    await pool.query("SELECT 1");
    return { ok: true, time: new Date().toISOString() };
  });

  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(gamesRoutes, { prefix: "/api/games" });
  await app.register(adsRoutes, { prefix: "/api/ads" });
  await app.register(chatRoutes, { prefix: "/api/chat" });

  // Opcjonalnie serwer oddaje też front — wtedy wszystko siedzi pod jednym
  // adresem i nie trzeba się przejmować CORS-em.
  if (config.serveStatic) {
    await app.register(fstatic, { root: path.join(HERE, "..", "..") });
  }

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = await buildServer();
  try {
    await app.listen({ port: config.port, host: config.host });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
  for (const sig of ["SIGINT", "SIGTERM"]) {
    process.on(sig, async () => {
      await app.close();
      await closeDb();
      process.exit(0);
    });
  }
}
