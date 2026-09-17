/**
 * Ogłoszenia: lista z filtrami, dodawanie, edycja, usuwanie, obserwowanie.
 */
import { randomUUID } from "node:crypto";
import { sql } from "kysely";
import { db } from "../db.js";
import { adLimitFor } from "../config.js";
import { publicAd } from "../shape.js";

const PER_PAGE_DEFAULT = 24;
const PER_PAGE_MAX = 60;

/** Wspólny początek zapytania: ogłoszenie + nazwa gry + premium właściciela. */
function adsQuery() {
  return db
    .selectFrom("ads")
    .innerJoin("games", "games.id", "ads.game_id")
    .innerJoin("users", "users.id", "ads.user_id")
    .select([
      "ads.id", "ads.user_id", "ads.game_id", "ads.nick", "ads.age", "ads.region",
      "ads.plat", "ads.style", "ads.time_of_day", "ads.mic", "ads.lang", "ads.descr",
      "ads.tags", "ads.contact", "ads.clip_url", "ads.looking_now", "ads.boost_until",
      "ads.created_at",
      "games.name as game_name",
      "users.premium_until as owner_premium_until"
    ]);
}

const adBody = {
  type: "object",
  required: ["gameId", "nick", "age", "desc"],
  properties: {
    gameId: { type: "integer", minimum: 1 },
    nick: { type: "string", minLength: 2, maxLength: 40 },
    age: { type: "integer", minimum: 13, maximum: 99 },
    region: { type: "string", maxLength: 60 },
    plat: { type: "string", maxLength: 20 },
    style: { type: "string", maxLength: 40 },
    time: { type: "string", maxLength: 40 },
    mic: { type: "string", maxLength: 40 },
    lang: { type: "string", maxLength: 10 },
    desc: { type: "string", minLength: 10, maxLength: 320 },
    tags: { type: "array", maxItems: 4, items: { type: "string", maxLength: 30 } },
    contact: { type: "string", maxLength: 120 },
    clipUrl: { type: "string", maxLength: 300 },
    lookingNow: { type: "boolean" }
  }
};

function toRow(body) {
  return {
    game_id: body.gameId,
    nick: body.nick.trim(),
    age: body.age,
    region: body.region || "Polska",
    plat: body.plat || "PC",
    style: body.style || "Na luzie",
    time_of_day: body.time || "Wieczorami",
    mic: body.mic || "Mikrofon: tak",
    lang: body.lang || "PL",
    descr: body.desc.trim(),
    tags: body.tags || [],
    contact: body.contact || null,
    clip_url: body.clipUrl || null,
    looking_now: body.lookingNow ?? false
  };
}

export default async function adsRoutes(app) {
  /**
   * GET /api/ads — lista z filtrami i paginacją.
   * Sortowanie takie jak we froncie: najpierw wypromowane, potem konta premium,
   * potem „szukam teraz", na końcu po dacie dodania.
   */
  app.get(
    "/",
    {
      preHandler: [app.optionalAuth],
      schema: {
        querystring: {
          type: "object",
          properties: {
            game: { type: "string", maxLength: 100 },
            gameId: { type: "integer" },
            region: { type: "string", maxLength: 60 },
            plat: { type: "string", maxLength: 20 },
            style: { type: "string", maxLength: 40 },
            time: { type: "string", maxLength: 40 },
            mic: { type: "string", maxLength: 40 },
            lookingNow: { type: "boolean" },
            q: { type: "string", maxLength: 100 },
            page: { type: "integer", minimum: 1, default: 1 },
            perPage: { type: "integer", minimum: 1, maximum: PER_PAGE_MAX, default: PER_PAGE_DEFAULT }
          }
        }
      }
    },
    async (request) => {
      const f = request.query;
      const page = f.page || 1;
      const perPage = f.perPage || PER_PAGE_DEFAULT;

      let q = adsQuery();
      if (f.gameId) q = q.where("ads.game_id", "=", f.gameId);
      if (f.game) q = q.where("games.name", "=", f.game);
      if (f.region) q = q.where("ads.region", "=", f.region);
      if (f.plat) q = q.where("ads.plat", "=", f.plat);
      if (f.style) q = q.where("ads.style", "=", f.style);
      if (f.time) q = q.where("ads.time_of_day", "=", f.time);
      if (f.mic) q = q.where("ads.mic", "=", f.mic);
      if (f.lookingNow !== undefined) q = q.where("ads.looking_now", "=", f.lookingNow);

      // Każde słowo musi pasować (AND) — tak samo jak wyszukiwarka we froncie.
      // bigww_norm() zdejmuje polskie znaki i wielkość liter po obu stronach,
      // więc „rankedow" znajduje „rankedów".
      if (f.q) {
        for (const word of f.q.trim().split(/[\s,;|]+/).filter(Boolean)) {
          const like = `%${word}%`;
          q = q.where((eb) =>
            eb.or([
              eb(sql`ads.search_text`, "like", sql`bigww_norm(${like})`),
              eb(sql`bigww_norm(games.name)`, "like", sql`bigww_norm(${like})`)
            ])
          );
        }
      }

      const rows = await q
        .orderBy(sql`(ads.boost_until > now()) desc`)
        .orderBy(sql`(users.premium_until > now()) desc`)
        .orderBy("ads.looking_now", "desc")
        .orderBy("ads.created_at", "desc")
        .limit(perPage)
        .offset((page - 1) * perPage)
        .execute();

      // Liczymy wszystkie pasujące, żeby front wiedział, ile jest stron.
      const { total } = await q
        .clearSelect()
        .clearOrderBy()
        .select((eb) => eb.fn.countAll().as("total"))
        .executeTakeFirstOrThrow();

      return {
        ads: rows.map((r) => publicAd(r, request.currentUser)),
        page,
        perPage,
        total: Number(total),
        pages: Math.max(1, Math.ceil(Number(total) / perPage))
      };
    }
  );

  /** GET /api/ads/mine — moje ogłoszenia razem z limitem konta. */
  app.get("/mine", { preHandler: [app.authenticate] }, async (request) => {
    const rows = await adsQuery()
      .where("ads.user_id", "=", request.currentUser.id)
      .orderBy("ads.created_at", "desc")
      .execute();
    return {
      ads: rows.map((r) => publicAd(r, request.currentUser)),
      limit: adLimitFor(request.currentUser),
      used: rows.length
    };
  });

  /** GET /api/ads/saved — obserwowane ogłoszenia. */
  app.get("/saved", { preHandler: [app.authenticate] }, async (request) => {
    const rows = await adsQuery()
      .innerJoin("saves", "saves.ad_id", "ads.id")
      .where("saves.user_id", "=", request.currentUser.id)
      .orderBy("saves.created_at", "desc")
      .execute();
    return { ads: rows.map((r) => publicAd(r, request.currentUser)) };
  });

  app.get("/:id", { preHandler: [app.optionalAuth] }, async (request, reply) => {
    const row = await adsQuery().where("ads.id", "=", request.params.id).executeTakeFirst();
    if (!row) return reply.code(404).send({ error: "Nie ma takiego ogłoszenia." });
    return { ad: publicAd(row, request.currentUser) };
  });

  app.post("/", { preHandler: [app.authenticate], schema: { body: adBody } }, async (request, reply) => {
    const user = request.currentUser;

    const { count } = await db
      .selectFrom("ads")
      .select((eb) => eb.fn.countAll().as("count"))
      .where("user_id", "=", user.id)
      .executeTakeFirstOrThrow();

    const limit = adLimitFor(user);
    if (Number(count) >= limit) {
      return reply.code(403).send({
        error: `Limit ogłoszeń wyczerpany (${limit}). Usuń jedno albo przejdź na Premium.`,
        limit,
        used: Number(count)
      });
    }

    const game = await db.selectFrom("games").select("id").where("id", "=", request.body.gameId).executeTakeFirst();
    if (!game) return reply.code(400).send({ error: "Nie ma takiej gry w bazie." });

    const inserted = await db
      .insertInto("ads")
      .values({ id: randomUUID(), user_id: user.id, ...toRow(request.body) })
      .returning("id")
      .executeTakeFirstOrThrow();

    const row = await adsQuery().where("ads.id", "=", inserted.id).executeTakeFirstOrThrow();
    return reply.code(201).send({ ad: publicAd(row, user) });
  });

  app.patch("/:id", { preHandler: [app.authenticate], schema: { body: { ...adBody, required: [] } } }, async (request, reply) => {
    const own = await db
      .selectFrom("ads")
      .select("id")
      .where("id", "=", request.params.id)
      .where("user_id", "=", request.currentUser.id)
      .executeTakeFirst();
    if (!own) return reply.code(404).send({ error: "Nie ma takiego ogłoszenia albo nie jest Twoje." });

    const full = { gameId: 0, nick: "x", age: 18, desc: "x".repeat(10), ...request.body };
    const patch = toRow(full);
    // Zostawiamy tylko pola, które faktycznie przyszły w żądaniu.
    const map = {
      gameId: "game_id", nick: "nick", age: "age", region: "region", plat: "plat",
      style: "style", time: "time_of_day", mic: "mic", lang: "lang", desc: "descr",
      tags: "tags", contact: "contact", clipUrl: "clip_url", lookingNow: "looking_now"
    };
    const set = { updated_at: new Date() };
    for (const [from, to] of Object.entries(map)) {
      if (request.body[from] !== undefined) set[to] = patch[to];
    }

    await db.updateTable("ads").set(set).where("id", "=", request.params.id).execute();
    const row = await adsQuery().where("ads.id", "=", request.params.id).executeTakeFirstOrThrow();
    return { ad: publicAd(row, request.currentUser) };
  });

  app.delete("/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const res = await db
      .deleteFrom("ads")
      .where("id", "=", request.params.id)
      .where("user_id", "=", request.currentUser.id)
      .executeTakeFirst();
    if (!Number(res.numDeletedRows)) return reply.code(404).send({ error: "Nie ma takiego ogłoszenia albo nie jest Twoje." });
    return { ok: true };
  });

  app.post("/:id/save", { preHandler: [app.authenticate] }, async (request, reply) => {
    const exists = await db.selectFrom("ads").select("id").where("id", "=", request.params.id).executeTakeFirst();
    if (!exists) return reply.code(404).send({ error: "Nie ma takiego ogłoszenia." });

    await db
      .insertInto("saves")
      .values({ user_id: request.currentUser.id, ad_id: request.params.id })
      .onConflict((oc) => oc.doNothing())
      .execute();
    return { ok: true, saved: true };
  });

  app.delete("/:id/save", { preHandler: [app.authenticate] }, async (request) => {
    await db
      .deleteFrom("saves")
      .where("user_id", "=", request.currentUser.id)
      .where("ad_id", "=", request.params.id)
      .execute();
    return { ok: true, saved: false };
  });
}
