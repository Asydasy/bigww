/**
 * Prywatne wiadomości (DM).
 *
 * Wszystko tutaj wymaga zalogowania i wszystko bierze nadawcę z sesji.
 * Przeglądarka nigdy nie podaje, kim jest — podaje tylko, do kogo pisze.
 * Inaczej wystarczyłby jeden POST z cudzym nickiem, żeby napisać jako ktoś inny.
 *
 * Odbiorcę można wskazać na dwa sposoby:
 *   - `adId`     — piszę z karty ogłoszenia, serwer sam sprawdza, czyje ono jest,
 *   - `toUserId` — odpowiadam w wątku, który już mam.
 */
import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { publicDmThread } from "../shape.js";

const MAX_DLUGOSC = 400;
/** Ile ostatnich wiadomości wątku oddajemy przy listowaniu. */
const WIADOMOSCI_NA_WATEK = 100;

/** Klucz wątku i kolejność kolumn: zawsze ta sama para w tej samej kolejności. */
function paraWatku(x, y) {
  const [a, b] = [String(x), String(y)].sort();
  return { id: a + "__" + b, userA: a, userB: b };
}

async function watkiUzytkownika(userId) {
  const threads = await db
    .selectFrom("dm_threads")
    .selectAll()
    .where((eb) => eb.or([eb("user_a", "=", userId), eb("user_b", "=", userId)]))
    .orderBy("updated_at", "desc")
    .execute();

  if (!threads.length) return [];

  const ids = threads.map((t) => t.id);
  const messages = await db
    .selectFrom("dm_messages")
    .selectAll()
    .where("thread_id", "in", ids)
    .orderBy("created_at", "asc")
    .execute();

  // Nicki rozmówców bierzemy z kont, a nie z ostatniej wiadomości — inaczej
  // wątek, w którym odezwałem się tylko ja, nie miałby czym się podpisać.
  const peerIds = threads.map((t) => (t.user_a === userId ? t.user_b : t.user_a));
  const peers = await db
    .selectFrom("users")
    .select(["id", "display_name"])
    .where("id", "in", peerIds)
    .execute();
  const nickById = new Map(peers.map((u) => [u.id, u.display_name]));

  return threads.map((t) => {
    const wiadomosci = messages
      .filter((m) => m.thread_id === t.id)
      .slice(-WIADOMOSCI_NA_WATEK);
    return publicDmThread(t, wiadomosci, userId, nickById);
  });
}

export default async function dmRoutes(app) {
  /** GET /api/dm — moje wątki, najnowszy pierwszy. */
  app.get("/", { preHandler: [app.authenticate] }, async (request) => {
    return { threads: await watkiUzytkownika(request.currentUser.id) };
  });

  /** POST /api/dm — wyślij wiadomość. */
  app.post(
    "/",
    {
      preHandler: [app.authenticate],
      // Ten sam próg co na czacie ogólnym: prywatna skrzynka jest równie tanim
      // miejscem na spam, a tu spam idzie prosto pod czyjś nos.
      config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
      schema: {
        body: {
          type: "object",
          required: ["text"],
          properties: {
            text: { type: "string", minLength: 1, maxLength: MAX_DLUGOSC },
            adId: { type: "string" },
            toUserId: { type: "string" }
          }
        }
      }
    },
    async (request, reply) => {
      const me = request.currentUser;
      const text = request.body.text.trim();
      if (!text) return reply.code(400).send({ error: "Pusta wiadomość." });

      let toId = request.body.toUserId || null;
      if (!toId && request.body.adId) {
        const ad = await db
          .selectFrom("ads")
          .select("user_id")
          .where("id", "=", request.body.adId)
          .executeTakeFirst();
        if (!ad) return reply.code(404).send({ error: "Nie ma takiego ogłoszenia." });
        toId = ad.user_id;
      }
      if (!toId) return reply.code(400).send({ error: "Nie wiadomo, do kogo ma pójść wiadomość." });
      if (toId === me.id) return reply.code(400).send({ error: "Do siebie nie ma po co pisać." });

      const odbiorca = await db
        .selectFrom("users")
        .select(["id", "display_name"])
        .where("id", "=", toId)
        .executeTakeFirst();
      if (!odbiorca) return reply.code(404).send({ error: "Nie ma takiego konta." });

      const { id, userA, userB } = paraWatku(me.id, odbiorca.id);
      const teraz = new Date();

      // Wątek zakłada się sam przy pierwszej wiadomości. `onConflict` zamiast
      // sprawdzania „czy istnieje", bo dwie wiadomości wysłane w tej samej
      // chwili z dwóch stron potrafią minąć się między SELECT a INSERT.
      await db
        .insertInto("dm_threads")
        .values({ id, user_a: userA, user_b: userB, updated_at: teraz })
        .onConflict((oc) => oc.column("id").doUpdateSet({ updated_at: teraz }))
        .execute();

      await db
        .insertInto("dm_messages")
        .values({
          id: randomUUID(),
          thread_id: id,
          from_id: me.id,
          nick: me.display_name,
          body: text
        })
        .execute();

      // Wysłanie liczy się jako przeczytanie własnego wątku.
      await db
        .updateTable("dm_threads")
        .set(me.id === userA ? { a_read_at: teraz } : { b_read_at: teraz })
        .where("id", "=", id)
        .execute();

      const watek = (await watkiUzytkownika(me.id)).find((t) => t.id === id) || null;
      return reply.code(201).send({ ok: true, thread: watek });
    }
  );

  /** POST /api/dm/:id/read — odznacz wątek jako przeczytany. */
  app.post("/:id/read", { preHandler: [app.authenticate] }, async (request, reply) => {
    const me = request.currentUser;
    const t = await db
      .selectFrom("dm_threads")
      .select(["id", "user_a", "user_b"])
      .where("id", "=", request.params.id)
      .executeTakeFirst();
    if (!t || (t.user_a !== me.id && t.user_b !== me.id)) {
      return reply.code(404).send({ error: "Nie ma takiego wątku." });
    }

    await db
      .updateTable("dm_threads")
      .set(me.id === t.user_a ? { a_read_at: new Date() } : { b_read_at: new Date() })
      .where("id", "=", t.id)
      .execute();

    return { ok: true };
  });
}
