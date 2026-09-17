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
        hourFrom: 18,
        hourTo: 23,
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
    assert.equal(ad.time, "18:00–23:00", "etykieta godzin liczona z hourFrom/hourTo");
    assert.ok(typeof ad.added === "number", "added ma być znacznikiem czasu dla frontu");
  });

  test("lista ukrywa kontakt przed niezalogowanym, pokazuje zalogowanemu", async () => {
    const anon = await call({ method: "GET", url: "/api/ads" });
    const adAnon = anon.json().ads.find((a) => a.id === adId);
    assert.equal(adAnon.contact, null);
    assert.equal(adAnon.contactLocked, true);
    assert.equal(adAnon.mine, false);

    // Dopóki nie ma prawdziwych płatności, kontakt jest otwarty dla każdego,
    // kto ma konto — inaczej serwis nie robi tego, po co powstał.
    const zalogowany = await call({ method: "GET", url: "/api/ads", headers: { cookie } });
    const adUser = zalogowany.json().ads.find((a) => a.id === adId);
    assert.equal(adUser.contact, "discord: seba#0001");
    assert.equal(adUser.contactLocked, false);
  });

  test("filtr godzin bierze pod uwagę nachodzenie zakresów", async () => {
    // Ogłoszenie gra 18–23.
    const trafia = await call({ method: "GET", url: "/api/ads?hourFrom=20&hourTo=22" });
    assert.equal(trafia.json().total, 1, "20-22 mieści się w 18-23");

    const nieTrafia = await call({ method: "GET", url: "/api/ads?hourFrom=6&hourTo=12" });
    assert.equal(nieTrafia.json().total, 0, "poranek nie nachodzi na wieczór");

    const przezPolnoc = await call({ method: "GET", url: "/api/ads?hourFrom=22&hourTo=4" });
    assert.equal(przezPolnoc.json().total, 1, "zakres przez północ łapie koniec wieczoru");

    const stykSie = await call({ method: "GET", url: "/api/ads?hourFrom=12&hourTo=18" });
    assert.equal(stykSie.json().total, 0, "zakresy stykające się końcami nie nachodzą");
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

  test("szybkie filtry: tag, język i świeżość", async () => {
    const byTag = await call({ method: "GET", url: "/api/ads?tag=Na%20luzie" });
    assert.equal(byTag.json().total, 1);

    const byMissingTag = await call({ method: "GET", url: "/api/ads?tag=nie%20ma%20takiego" });
    assert.equal(byMissingTag.json().total, 0);

    const byLang = await call({ method: "GET", url: "/api/ads?lang=PL" });
    assert.equal(byLang.json().total, 1);

    const fresh = await call({ method: "GET", url: "/api/ads?newHours=24" });
    assert.equal(fresh.json().total, 1);

    // Ogłoszenie dodane przed chwilą nie mieści się w oknie "sprzed godziny".
    const stale = await call({ method: "GET", url: "/api/ads?newHours=8760&lookingNow=true" });
    assert.equal(stale.json().total, 0, "ogłoszenie nie ma ustawionego „szukam teraz”");
  });

  test("ranga i dni tygodnia wracają z bazy i dają się filtrować", async () => {
    const dodane = await call({
      method: "PATCH",
      url: `/api/ads/${adId}`,
      headers: { cookie },
      payload: { rank: "high", days: ["mon", "wed", "fri"] }
    });
    assert.equal(dodane.statusCode, 200);
    assert.equal(dodane.json().ad.rank, "high");
    assert.deepEqual(dodane.json().ad.days, ["mon", "wed", "fri"]);

    const byRank = await call({ method: "GET", url: "/api/ads?rank=high" });
    assert.equal(byRank.json().total, 1);

    const innaRanga = await call({ method: "GET", url: "/api/ads?rank=pro" });
    assert.equal(innaRanga.json().total, 0);

    const byDay = await call({ method: "GET", url: "/api/ads?day=wed" });
    assert.equal(byDay.json().total, 1);

    const innyDzien = await call({ method: "GET", url: "/api/ads?day=sun" });
    assert.equal(innyDzien.json().total, 0, "ogłoszenie ma zadeklarowane dni, więc niedziela nie pasuje");

    const zlaRanga = await call({
      method: "PATCH",
      url: `/api/ads/${adId}`,
      headers: { cookie },
      payload: { rank: "legenda" }
    });
    assert.equal(zlaRanga.statusCode, 400, "ranga spoza listy ma być odrzucona");

    // Wracamy do stanu bez dni, żeby kolejne testy widziały ogłoszenie
    // w każdym filtrze dnia.
    await call({
      method: "PATCH",
      url: `/api/ads/${adId}`,
      headers: { cookie },
      payload: { days: [] }
    });
    const bezDni = await call({ method: "GET", url: "/api/ads?day=sun" });
    assert.equal(bezDni.json().total, 1, "ogłoszenie bez dni pasuje do każdego filtru");
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

  test("limit ogłoszeń na koncie darmowym to 3", async () => {
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
      payload: { gameId, nick: "zimnySeba", age: 29, desc: "Trzecie ogłoszenie, jeszcze się mieści." }
    });
    assert.equal(trzecie.statusCode, 201);

    const czwarte = await call({
      method: "POST",
      url: "/api/ads",
      headers: { cookie },
      payload: { gameId, nick: "zimnySeba", age: 29, desc: "Czwarte ogłoszenie, powinno odpaść." }
    });
    assert.equal(czwarte.statusCode, 403);
    assert.match(czwarte.json().error, /Limit ogłoszeń/);

    const mine = await call({ method: "GET", url: "/api/ads/mine", headers: { cookie } });
    assert.equal(mine.json().limit, 3);
    assert.equal(mine.json().used, 3);
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

describe("czat ogólny", () => {
  let cookie;
  let idWiadomosci;

  before(async () => {
    await db.deleteFrom("chat_messages").execute();
    const login = await call({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "seba@example.com", password: "haslo-testowe-1" }
    });
    cookie = sessionOf(login);
  });

  test("bez logowania nie da się napisać", async () => {
    const res = await call({ method: "POST", url: "/api/chat", payload: { body: "hej" } });
    assert.equal(res.statusCode, 401);
  });

  test("bez logowania można czytać", async () => {
    const res = await call({ method: "GET", url: "/api/chat" });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().canWrite, false, "gość ma wiedzieć, że nie napisze");
  });

  test("za długa wiadomość jest odrzucana", async () => {
    const res = await call({
      method: "POST",
      url: "/api/chat",
      headers: { cookie },
      payload: { body: "x".repeat(301) }
    });
    assert.equal(res.statusCode, 400);
  });

  test("wysłanie wiadomości i odczyt historii", async () => {
    const res = await call({
      method: "POST",
      url: "/api/chat",
      headers: { cookie },
      payload: { body: "  Szukam kogoś do Valoranta na wieczór  " }
    });
    assert.equal(res.statusCode, 201);
    const msg = res.json().message;
    idWiadomosci = msg.id;
    assert.equal(msg.body, "Szukam kogoś do Valoranta na wieczór", "spacje z brzegów mają zniknąć");
    assert.equal(msg.mine, true);
    assert.ok(typeof msg.at === "number");

    const lista = await call({ method: "GET", url: "/api/chat", headers: { cookie } });
    assert.equal(lista.json().messages.length, 1);
    assert.equal(lista.json().canWrite, true);
  });

  test("ta sama treść od razu drugi raz to 429", async () => {
    const res = await call({
      method: "POST",
      url: "/api/chat",
      headers: { cookie },
      payload: { body: "Szukam kogoś do Valoranta na wieczór" }
    });
    assert.equal(res.statusCode, 429);
  });

  test("?after= oddaje tylko nowsze wiadomości", async () => {
    const przed = Date.now();
    await new Promise((r) => setTimeout(r, 25));
    await call({ method: "POST", url: "/api/chat", headers: { cookie }, payload: { body: "druga wiadomość" } });

    const nowe = await call({ method: "GET", url: `/api/chat?after=${przed}` });
    assert.equal(nowe.json().messages.length, 1);
    assert.equal(nowe.json().messages[0].body, "druga wiadomość");

    const wszystkie = await call({ method: "GET", url: "/api/chat" });
    assert.equal(wszystkie.json().messages.length, 2);
    assert.ok(
      wszystkie.json().messages[0].at <= wszystkie.json().messages[1].at,
      "historia ma iść od najstarszej"
    );
  });

  test("nie da się skasować cudzej wiadomości", async () => {
    const obcy = await call({
      method: "POST",
      url: "/api/auth/register",
      payload: { email: "czat-obcy@example.com", password: "haslo-testowe-2", displayName: "Obcy" }
    });
    const res = await call({
      method: "DELETE",
      url: `/api/chat/${idWiadomosci}`,
      headers: { cookie: sessionOf(obcy) }
    });
    assert.equal(res.statusCode, 404);
  });

  test("własną wiadomość można skasować, ślad zostaje", async () => {
    const res = await call({ method: "DELETE", url: `/api/chat/${idWiadomosci}`, headers: { cookie } });
    assert.equal(res.statusCode, 200);

    const lista = await call({ method: "GET", url: "/api/chat" });
    const skasowana = lista.json().messages.find((m) => m.id === idWiadomosci);
    assert.equal(skasowana.deleted, true);
    assert.equal(skasowana.body, null, "treść skasowanej wiadomości nie wychodzi z serwera");
    assert.equal(lista.json().messages.length, 2, "wiersz zostaje, żeby stronicowanie się nie rozjechało");
  });
});
