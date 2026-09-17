/**
 * Testy API — puszczają się na osobnej bazie (DATABASE_URL z .env.test).
 * Uruchomienie: npm test
 *
 * Nie strzelamy po sieci: fastify.inject() wywołuje trasy bezpośrednio,
 * więc test jest szybki i nie zajmuje portu.
 */
import test, { before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { buildServer } from "../src/server.js";
import { migrate } from "../src/migrate.js";
import { seedGames } from "../src/seed.js";
import { db, closeDb, pool } from "../src/db.js";

let app;

/** Wyciąga ciasteczko sesji z odpowiedzi, żeby podpiąć je do kolejnych żądań. */
function sessionOf(res) {
  const c = res.cookies.find((x) => x.name === "bigww_session");
  return c ? `bigww_session=${c.value}` : null;
}

const call = (opts) => app.inject(opts);

before(async () => {
  await migrate(() => {});
  await seedGames(() => {});
  await db.deleteFrom("saves").execute();
  await db.deleteFrom("ads").execute();
  await db.deleteFrom("users").execute();
  app = await buildServer({ logger: false });
  await app.ready();
});

after(async () => {
  await app.close();
  await closeDb();
  await pool.end().catch(() => {});
});

describe("zdrowie i katalog gier", () => {
  test("GET /api/health odpowiada", async () => {
    const res = await call({ method: "GET", url: "/api/health" });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().ok, true);
  });

  test("GET /api/games zwraca pełny katalog", async () => {
    const res = await call({ method: "GET", url: "/api/games" });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().games.length, 205);
  });

  test("GET /api/games?q= filtruje po nazwie", async () => {
    const res = await call({ method: "GET", url: "/api/games?q=counter" });
    assert.equal(res.json().games[0].name, "Counter-Strike 2");
  });

  test("GET /api/games/genres zwraca listę gatunków", async () => {
    const res = await call({ method: "GET", url: "/api/games/genres" });
    assert.ok(res.json().genres.includes("FPS"));
  });
});

describe("konta", () => {
  test("rejestracja zakłada konto i ustawia sesję", async () => {
    const res = await call({
      method: "POST",
      url: "/api/auth/register",
      payload: { email: "Seba@Example.com", password: "haslo-testowe-1", displayName: "Seba" }
    });
    assert.equal(res.statusCode, 201);
    assert.equal(res.json().user.displayName, "Seba");
    assert.equal(res.json().user.email, "seba@example.com", "e-mail ma być znormalizowany do małych liter");
    assert.equal(res.json().user.coins, 40);
    assert.ok(sessionOf(res), "brak ciasteczka sesji");
  });

  test("ten sam e-mail drugi raz to 409", async () => {
    const res = await call({
      method: "POST",
      url: "/api/auth/register",
      payload: { email: "seba@example.com", password: "inne-haslo-123", displayName: "Ktos" }
    });
    assert.equal(res.statusCode, 409);
  });

  test("za krótkie hasło jest odrzucane", async () => {
    const res = await call({
      method: "POST",
      url: "/api/auth/register",
      payload: { email: "krotkie@example.com", password: "abc", displayName: "Ktos" }
    });
    assert.equal(res.statusCode, 400);
  });

  test("logowanie złym hasłem to 401", async () => {
    const res = await call({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "seba@example.com", password: "zle-haslo-9999" }
    });
    assert.equal(res.statusCode, 401);
  });

  test("logowanie nieistniejącym kontem daje ten sam komunikat", async () => {
    const res = await call({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "nikt@example.com", password: "cokolwiek-123" }
    });
    assert.equal(res.statusCode, 401);
    assert.equal(res.json().error, "Nieprawidłowy e-mail lub hasło.");
  });

  test("poprawne logowanie i /me", async () => {
    const login = await call({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "seba@example.com", password: "haslo-testowe-1" }
    });
    assert.equal(login.statusCode, 200);
    const cookie = sessionOf(login);

    const me = await call({ method: "GET", url: "/api/auth/me", headers: { cookie } });
    assert.equal(me.json().user.displayName, "Seba");
  });

  test("/me bez sesji zwraca null zamiast błędu", async () => {
    const res = await call({ method: "GET", url: "/api/auth/me" });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().user, null);
  });
});

describe("ogłoszenia", () => {
  let cookie;
  let gameId;
  let adId;

  before(async () => {
    const login = await call({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "seba@example.com", password: "haslo-testowe-1" }
    });
    cookie = sessionOf(login);
    const games = await call({ method: "GET", url: "/api/games?q=valorant" });
    gameId = games.json().games[0].id;
  });

  test("bez zalogowania nie da się dodać ogłoszenia", async () => {
    const res = await call({
      method: "POST",
      url: "/api/ads",
      payload: { gameId, nick: "ktos", age: 25, desc: "Szukam ekipy na wieczory." }
    });
    assert.equal(res.statusCode, 401);
  });

  test("za krótki opis jest odrzucany", async () => {
    const res = await call({
      method: "POST",
      url: "/api/ads",
      headers: { cookie },
      payload: { gameId, nick: "seba", age: 29, desc: "hej" }
    });
    assert.equal(res.statusCode, 400);
  });

  test("nieistniejąca gra jest odrzucana", async () => {
    const res = await call({
      method: "POST",
      url: "/api/ads",
      headers: { cookie },
      payload: { gameId: 999999, nick: "seba", age: 29, desc: "Szukam ekipy na wieczorne granie." }
    });
    assert.equal(res.statusCode, 400);
  });

  test("dodanie ogłoszenia", async () => {
    const res = await call({
      method: "POST",
      url: "/api/ads",
      headers: { cookie },
      payload: {
        gameId,
        nick: "zimnySeba",
        age: 29,
        region: "Polska",
        plat: "PC",
        style: "Na luzie",
        time: "Wieczorami",
        mic: "Mikrofon: tak",
        desc: "Szukam dwóch osób do wieczornych rankedów, bez krzyku.",
        tags: ["Na luzie", "Wieczorami"],
        contact: "discord: seba#0001"
      }
    });
    assert.equal(res.statusCode, 201);
    const ad = res.json().ad;
    adId = ad.id;
    assert.equal(ad.game, "VALORANT");
    assert.equal(ad.mine, true);
    assert.equal(ad.contact, "discord: seba#0001", "właściciel widzi swój kontakt");
    assert.ok(typeof ad.added === "number", "added ma być znacznikiem czasu dla frontu");
  });

  test("lista ukrywa kontakt przed niezalogowanym", async () => {
    const res = await call({ method: "GET", url: "/api/ads" });
    const ad = res.json().ads.find((a) => a.id === adId);
    assert.equal(ad.contact, null);
    assert.equal(ad.contactLocked, true);
    assert.equal(ad.mine, false);
  });

  test("filtr po grze i wyszukiwarka", async () => {
    const byGame = await call({ method: "GET", url: "/api/ads?game=VALORANT" });
    assert.equal(byGame.json().total, 1);

    const byWord = await call({ method: "GET", url: "/api/ads?q=rankedow" });
    assert.equal(byWord.json().total, 1);

    // Wszystkie słowa muszą pasować — drugie nie pasuje, więc zero wyników.
    const andTest = await call({ method: "GET", url: "/api/ads?q=rankedow%20koszykowka" });
    assert.equal(andTest.json().total, 0);

    const byRegion = await call({ method: "GET", url: "/api/ads?region=Niemcy" });
    assert.equal(byRegion.json().total, 0);
  });

  test("edycja zmienia tylko przysłane pola", async () => {
    const res = await call({
      method: "PATCH",
      url: `/api/ads/${adId}`,
      headers: { cookie },
      payload: { desc: "Zmieniony opis ogłoszenia po edycji." }
    });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().ad.desc, "Zmieniony opis ogłoszenia po edycji.");
    assert.equal(res.json().ad.nick, "zimnySeba", "nick miał zostać nietknięty");
  });

  test("obserwowanie i odobserwowanie", async () => {
    const on = await call({ method: "POST", url: `/api/ads/${adId}/save`, headers: { cookie } });
    assert.equal(on.json().saved, true);

    const list = await call({ method: "GET", url: "/api/ads/saved", headers: { cookie } });
    assert.equal(list.json().ads.length, 1);

    // Powtórzone obserwowanie nie ma się wywalić.
    const again = await call({ method: "POST", url: `/api/ads/${adId}/save`, headers: { cookie } });
    assert.equal(again.statusCode, 200);

    const off = await call({ method: "DELETE", url: `/api/ads/${adId}/save`, headers: { cookie } });
    assert.equal(off.json().saved, false);
  });

  test("limit ogłoszeń na koncie darmowym to 2", async () => {
    const drugie = await call({
      method: "POST",
      url: "/api/ads",
      headers: { cookie },
      payload: { gameId, nick: "zimnySeba", age: 29, desc: "Drugie ogłoszenie, też szukam ekipy." }
    });
    assert.equal(drugie.statusCode, 201);

    const trzecie = await call({
      method: "POST",
      url: "/api/ads",
      headers: { cookie },
      payload: { gameId, nick: "zimnySeba", age: 29, desc: "Trzecie ogłoszenie, powinno odpaść." }
    });
    assert.equal(trzecie.statusCode, 403);
    assert.match(trzecie.json().error, /Limit ogłoszeń/);

    const mine = await call({ method: "GET", url: "/api/ads/mine", headers: { cookie } });
    assert.equal(mine.json().limit, 2);
    assert.equal(mine.json().used, 2);
  });

  test("nie da się ruszyć cudzego ogłoszenia", async () => {
    const other = await call({
      method: "POST",
      url: "/api/auth/register",
      payload: { email: "ktos.inny@example.com", password: "haslo-testowe-2", displayName: "Inny" }
    });
    const otherCookie = sessionOf(other);

    const patch = await call({
      method: "PATCH",
      url: `/api/ads/${adId}`,
      headers: { cookie: otherCookie },
      payload: { desc: "Przejmuję to ogłoszenie, hehe." }
    });
    assert.equal(patch.statusCode, 404);

    const del = await call({ method: "DELETE", url: `/api/ads/${adId}`, headers: { cookie: otherCookie } });
    assert.equal(del.statusCode, 404);
  });

  test("usunięcie własnego ogłoszenia", async () => {
    const res = await call({ method: "DELETE", url: `/api/ads/${adId}`, headers: { cookie } });
    assert.equal(res.statusCode, 200);

    const gone = await call({ method: "GET", url: `/api/ads/${adId}` });
    assert.equal(gone.statusCode, 404);
  });

  test("wylogowanie kasuje sesję", async () => {
    const out = await call({ method: "POST", url: "/api/auth/logout", headers: { cookie } });
    assert.equal(out.statusCode, 200);
    const cleared = out.cookies.find((c) => c.name === "bigww_session");
    assert.ok(cleared && cleared.value === "", "ciasteczko ma zostać wyczyszczone");
  });
});
