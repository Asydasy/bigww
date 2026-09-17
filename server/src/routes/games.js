/**
 * Katalog gier — publiczny, bez logowania.
 */
import { sql } from "kysely";
import { db } from "../db.js";
import { publicGame } from "../shape.js";

export default async function gamesRoutes(app) {
  app.get(
    "/",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            q: { type: "string", maxLength: 100 },
            genre: { type: "string", maxLength: 40 },
            withCounts: { type: "boolean", default: false }
          }
        }
      }
    },
    async (request) => {
      const { q, genre, withCounts } = request.query;

      let query = db.selectFrom("games").selectAll("games");
      if (genre) query = query.where("genre", "=", genre);
      // Bez polskich znaków i bez wielkości liter — tak jak w wyszukiwarce graczy.
      if (q) query = query.where(sql`bigww_norm(games.name)`, "like", sql`bigww_norm(${`%${q.trim()}%`})`);

      if (withCounts) {
        // Ile aktywnych ogłoszeń przypada na grę — do kafelków na stronie gier.
        query = query
          .leftJoin("ads", "ads.game_id", "games.id")
          .select(sql`count(ads.id)`.as("ads_count"))
          .groupBy("games.id");
      }

      const rows = await query.orderBy("pop", "desc").orderBy("name").execute();

      return {
        games: rows.map((r) => (withCounts ? { ...publicGame(r), ads: Number(r.ads_count) } : publicGame(r)))
      };
    }
  );

  app.get("/genres", async () => {
    const rows = await db.selectFrom("games").select("genre").distinct().orderBy("genre").execute();
    return { genres: rows.map((r) => r.genre) };
  });
}
