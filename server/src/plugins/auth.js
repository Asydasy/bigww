/**
 * Sesja użytkownika: JWT podpisany przez serwer, trzymany w ciasteczku
 * httpOnly. httpOnly znaczy, że JavaScript strony go nie odczyta — więc nawet
 * udany atak XSS nie wynosi cudzej sesji.
 */
import fp from "fastify-plugin";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import { config } from "../config.js";
import { db } from "../db.js";

/** Co ile najwyżej odświeżamy ślad aktywności konta. Bez tego każde żądanie
 *  z sesją robiłoby zapis do bazy — licznik nie jest tego wart. */
const SLAD_CO_SEKUND = 60;

/** Zapis „konto było widziane". Dzięki dławieniu wyżej zapis leci najwyżej raz
 *  na minutę na konto, więc czekanie na niego nic nie kosztuje. Błąd zapisu nie
 *  psuje żądania — to tylko licznik. */
async function odnotujAktywnosc(user) {
  if (!user) return;
  const ostatnio = user.last_seen_at ? new Date(user.last_seen_at).getTime() : 0;
  if (Date.now() - ostatnio < SLAD_CO_SEKUND * 1000) return;
  try {
    await db.updateTable("users").set({ last_seen_at: new Date() }).where("id", "=", user.id).execute();
  } catch (e) {
    /* licznik nie jest wart przerywania żądania */
  }
}

async function authPlugin(app) {
  await app.register(cookie);
  await app.register(jwt, {
    secret: config.jwtSecret,
    cookie: { cookieName: config.cookieName, signed: false }
  });

  /** Ustawia ciasteczko sesji po rejestracji lub zalogowaniu. */
  app.decorate("setSession", (reply, user) => {
    const token = app.jwt.sign({ uid: user.id }, { expiresIn: `${config.sessionDays}d` });
    reply.setCookie(config.cookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: config.isProd,
      path: "/",
      maxAge: config.sessionDays * 24 * 60 * 60
    });
  });

  app.decorate("clearSession", (reply) => {
    reply.clearCookie(config.cookieName, { path: "/" });
  });

  /** Wymaga zalogowania — inaczej 401. Wkłada użytkownika do request.user. */
  app.decorate("authenticate", async (request, reply) => {
    try {
      const payload = await request.jwtVerify();
      const user = await db.selectFrom("users").selectAll().where("id", "=", payload.uid).executeTakeFirst();
      if (!user) throw new Error("konto nie istnieje");
      request.currentUser = user;
      await odnotujAktywnosc(user);
    } catch {
      return reply.code(401).send({ error: "Zaloguj się, żeby to zrobić." });
    }
  });

  /** Nie wymaga zalogowania, ale rozpoznaje zalogowanego. */
  app.decorate("optionalAuth", async (request) => {
    try {
      const payload = await request.jwtVerify();
      request.currentUser =
        (await db.selectFrom("users").selectAll().where("id", "=", payload.uid).executeTakeFirst()) || null;
      await odnotujAktywnosc(request.currentUser);
    } catch {
      request.currentUser = null;
    }
  });
}

export default fp(authPlugin, { name: "auth" });
