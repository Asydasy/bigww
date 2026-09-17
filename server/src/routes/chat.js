/**
 * Czat ogólny — jeden pokój dla całego serwisu.
 *
 * Czytać może każdy (także niezalogowany), pisać tylko zalogowany. Front
 * odpytuje `GET /api/chat?after=<znacznik czasu>` co kilka sekund; WebSocket
 * dojdzie dopiero wtedy, gdy będzie na czym go sprawdzić.
 */
import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { publicChatMessage } from "../shape.js";
import { liczAktywnych } from "./presence.js";

const LIMIT_DEFAULT = 50;
const LIMIT_MAX = 100;
const MAX_DLUGOSC = 300;
/** Ile sekund musi minąć, zanim ta sama treść przejdzie drugi raz. */
const POWTORKA_SEKUND = 30;

export default async function chatRoutes(app) {
  /**
   * GET /api/chat
   *   bez `after` — ostatnie wiadomości (najstarsza pierwsza)
   *   z `after`   — tylko nowsze niż podany znacznik czasu (ms)
   */
  app.get(
    "/",
    {
      preHandler: [app.optionalAuth],
      schema: {
        querystring: {
          type: "object",
          properties: {
            after: { type: "integer", minimum: 0 },
            limit: { type: "integer", minimum: 1, maximum: LIMIT_MAX, default: LIMIT_DEFAULT }
          }
        }
      }
    },
    async (request) => {
      const { after } = request.query;
      const limit = request.query.limit || LIMIT_DEFAULT;

      let q = db
        .selectFrom("chat_messages")
        .select(["id", "user_id", "nick", "body", "deleted_at", "created_at"]);

      if (after) q = q.where("created_at", ">", new Date(after));

      // Bierzemy od najnowszych (żeby limit ucinał stare, nie nowe), a oddajemy
      // w kolejności czytania.
      const rows = await q.orderBy("created_at", "desc").limit(limit).execute();
      rows.reverse();

      return {
        messages: rows.map((r) => publicChatMessage(r, request.currentUser)),
        // Panel czatu i tak pyta co kilka sekund — licznik jedzie z tą samą
        // odpowiedzią, zamiast robić drugie zapytanie o to samo.
        online: await liczAktywnych(),
        // Front zapisuje to sobie jako punkt odniesienia do kolejnego pytania —
        // dzięki temu nie zależy od zegara przeglądarki.
        serverTime: Date.now(),
        canWrite: Boolean(request.currentUser)
      };
    }
  );

  app.post(
    "/",
    {
      preHandler: [app.authenticate],
      // Ostrzejszy limit niż globalny: czat to najtańsze miejsce na spam.
      config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
      schema: {
        body: {
          type: "object",
          required: ["body"],
          properties: { body: { type: "string", minLength: 1, maxLength: MAX_DLUGOSC } }
        }
      }
    },
    async (request, reply) => {
      const user = request.currentUser;
      const body = request.body.body.trim();
      if (!body) return reply.code(400).send({ error: "Pusta wiadomość." });

      // Ta sama treść od tej samej osoby w ciągu pół minuty to zwykle
      // przytrzymany Enter albo bot.
      const ostatnia = await db
        .selectFrom("chat_messages")
        .select(["body", "created_at"])
        .where("user_id", "=", user.id)
        .orderBy("created_at", "desc")
        .limit(1)
        .executeTakeFirst();

      if (
        ostatnia &&
        ostatnia.body === body &&
        Date.now() - new Date(ostatnia.created_at).getTime() < POWTORKA_SEKUND * 1000
      ) {
        return reply.code(429).send({ error: "Ta sama wiadomość poszła przed chwilą." });
      }

      const row = await db
        .insertInto("chat_messages")
        .values({
          id: randomUUID(),
          user_id: user.id,
          nick: user.display_name,
          body
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return reply.code(201).send({ message: publicChatMessage(row, user) });
    }
  );

  /** Kasowanie własnej wiadomości. Wiersz zostaje, znika treść. */
  app.delete("/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const own = await db
      .selectFrom("chat_messages")
      .select("id")
      .where("id", "=", request.params.id)
      .where("user_id", "=", request.currentUser.id)
      .executeTakeFirst();
    if (!own) return reply.code(404).send({ error: "Nie ma takiej wiadomości albo nie jest Twoja." });

    await db
      .updateTable("chat_messages")
      .set({ deleted_at: new Date() })
      .where("id", "=", request.params.id)
      .execute();

    return { ok: true };
  });
}
