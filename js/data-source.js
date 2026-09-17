"use strict";

/* BigWW — jedno wejście do danych dla wszystkich widoków.
 *
 * Dwa tryby, rozpoznawane raz przy starcie przez DATA.init():
 *   "api"   — backend odpowiada na /api/health: ogłoszenia, gry i konta
 *             z bazy, sesja w ciasteczku
 *   "local" — backendu nie ma: generator demo + localStorage, czyli to samo,
 *             co widać po otwarciu index.html z dysku
 *
 * Zasada podziału: SERWER trzyma ogłoszenia, gry, konta i obserwowanych.
 * PRZEGLĄDARKA trzyma to, czego backend jeszcze nie ma — monety, premium,
 * skrzynkę, powiadomienia, giveawaye, oceny i blokady.
 *
 * Widoki nie sprawdzają trybu. Wołają DATA.createAd(), DATA.toggleSave(),
 * DATA.login() i tak dalej, a listy czytają z globalnych MINE / SAVED /
 * allPlayers(), które DATA w trybie „api" wypełnia danymi z serwera.
 */

const DATA = (() => {
  let mode = "local";
  let user = null;            // konto z serwera (tryb api)
  let gameList = [];          // katalog gier z licznikami ogłoszeń
  let serverAds = [];         // wszystkie pobrane ogłoszenia (tryb api)
  let limits = { limit: 3, used: 0 };
  let savedIds = new Set();

  /** Ile ogłoszeń ściągamy na raz. Powyżej tej liczby filtrowanie musi przejść
   *  na stronę serwera (endpoint to potrafi: ?game=, ?rank=, ?q= itd.) —
   *  dziś baza jest pusta, więc jedno pobranie wystarcza na długo. */
  const MAX_ADS = 480;
  const PER_PAGE = 60;

  /* ---------- zamiana ogłoszenia z API na kształt karty ---------- */
  function fromApi(a) {
    return {
      id: a.id,
      nick: a.nick,
      age: a.age,
      region: a.region,
      game: a.game,
      gameId: a.gameId,
      plat: a.plat,
      style: a.style,
      rank: a.rank || "",
      days: a.days || [],
      time: a.time,
      hourFrom: a.hourFrom,
      hourTo: a.hourTo,
      mic: a.mic,
      lang: a.lang,
      tags: a.tags || [],
      desc: a.desc,
      clipUrl: a.clipUrl || "",
      // Serwer nie przechowuje plików z dysku ani statystyk z gry —
      // to są pola wyłącznie generatora demo.
      fileData: null,
      fileType: "",
      hours: a.hours || 0,
      rating: a.rating || "—",
      status: a.status || (a.lookingNow ? "on" : "idle"),
      prem: a.prem,
      boosted: a.boosted,
      added: a.added,
      mine: a.mine,
      ownerId: a.mine && user ? user.id : undefined,
      contact: a.contact,
      contactLocked: a.contactLocked
    };
  }

  /** Zamiana ogłoszenia z formularza na to, czego oczekuje API. */
  function toApi(draftAd) {
    const body = {
      gameId: gameIdByName(draftAd.game),
      nick: draftAd.nick,
      age: draftAd.age,
      region: draftAd.region,
      plat: draftAd.plat,
      style: draftAd.style,
      time: draftAd.time,
      mic: draftAd.mic,
      lang: draftAd.lang || "PL",
      desc: draftAd.desc,
      tags: draftAd.tags || [],
      days: draftAd.days || [],
      lookingNow: !!PREF.looking
    };
    if (draftAd.hourFrom !== undefined && draftAd.hourFrom !== null) body.hourFrom = Number(draftAd.hourFrom);
    if (draftAd.hourTo !== undefined && draftAd.hourTo !== null) body.hourTo = Number(draftAd.hourTo);
    if (draftAd.rank) body.rank = draftAd.rank;
    if (draftAd.contact) body.contact = draftAd.contact;
    if (draftAd.clipUrl) body.clipUrl = draftAd.clipUrl;
    return body;
  }

  function gameIdByName(name) {
    const g = gameList.find(x => x.name === name);
    return g ? g.id : null;
  }

  /* ---------- start ---------- */
  async function init() {
    mode = (await API.resolveBase()) ? "api" : "local";

    if (mode === "api") {
      try {
        user = (await API.me()).user;
        // Dane lokalne (monety, skrzynka) są przypisane do konta, więc po
        // rozpoznaniu sesji czytamy je jeszcze raz — już pod właściwym kluczem.
        loadUserData();
        // withCounts daje liczbę ogłoszeń na grę — do kafelków w bazie gier.
        gameList = (await API.games({ withCounts: true })).games;
        await refresh();
      } catch (e) {
        // Serwer odpowiedział na /health, ale coś dalej padło — lepiej pokazać
        // działającą stronę na danych lokalnych niż pustą.
        console.warn("BigWW: backend odpowiada, ale nie oddał danych — zostaję przy trybie lokalnym.", e);
        mode = "local";
        user = null;
      }
    }

    if (mode === "local") {
      gameList = GAMES;
      savedIds = new Set(SAVED);
    }
    return mode;
  }

  /** Pobiera z serwera ogłoszenia, moje ogłoszenia i obserwowanych,
   *  po czym ustawia globalne MINE i SAVED, z których żyją widoki. */
  async function refresh() {
    if (mode !== "api") return;

    const zebrane = [];
    let page = 1;
    let pages = 1;
    do {
      const res = await API.ads({ page, perPage: PER_PAGE });
      zebrane.push(...res.ads.map(fromApi));
      pages = res.pages;
      page++;
    } while (page <= pages && zebrane.length < MAX_ADS);
    serverAds = zebrane;

    if (user) {
      const mine = await API.myAds();
      limits = { limit: mine.limit, used: mine.used };
      MINE = mine.ads.map(fromApi);
      const saved = await API.savedAds();
      savedIds = new Set(saved.ads.map(a => a.id));
      SAVED = Array.from(savedIds);
      // Ogłoszenia z listy ogólnej i „moje" to te same rekordy — podmieniamy
      // je na wersje z flagą mine, żeby karta wiedziała, że jest nasza.
      const mineById = new Map(MINE.map(a => [a.id, a]));
      serverAds = serverAds.map(a => mineById.get(a.id) || a);
    } else {
      MINE = [];
      SAVED = [];
      savedIds = new Set();
      limits = { limit: 3, used: 0 };
    }
    countCache = null;
  }

  /* ---------- ogłoszenia ---------- */
  /** Wszystko, co widać na listach. W trybie api są to ogłoszenia z bazy
   *  (moje razem z resztą), w lokalnym — moje plus wygenerowane demo. */
  function players() {
    return mode === "api" ? serverAds : MINE.concat(PLAYERS);
  }

  async function createAd(draftAd) {
    if (mode === "api") {
      if (!user) { const e = new Error("Zaloguj się, żeby dodać ogłoszenie."); e.status = 401; throw e; }
      const res = await API.createAd(toApi(draftAd));
      const ad = fromApi(res.ad);
      MINE.unshift(ad);
      serverAds.unshift(ad);
      limits.used += 1;
      countCache = null;
      return ad;
    }
    if (MINE.length >= adLimit()) {
      const err = new Error("Limit ogłoszeń wyczerpany");
      err.status = 403;
      throw err;
    }
    MINE.unshift(draftAd);
    save(KEY.mine, MINE);
    countCache = null;
    return draftAd;
  }

  async function updateAd(id, draftAd) {
    if (mode === "api") {
      const res = await API.updateAd(id, toApi(draftAd));
      const ad = fromApi(res.ad);
      MINE = MINE.map(m => (m.id === id ? ad : m));
      serverAds = serverAds.map(a => (a.id === id ? ad : a));
      countCache = null;
      return ad;
    }
    const i = MINE.findIndex(m => m.id === id);
    if (i < 0) { const e = new Error("Nie ma takiego ogłoszenia"); e.status = 404; throw e; }
    MINE[i] = Object.assign({}, MINE[i], draftAd, { id, mine: true });
    save(KEY.mine, MINE);
    countCache = null;
    return MINE[i];
  }

  async function deleteAd(id) {
    if (mode === "api") {
      await API.deleteAd(id);
      MINE = MINE.filter(m => m.id !== id);
      serverAds = serverAds.filter(a => a.id !== id);
      limits.used = Math.max(0, limits.used - 1);
      countCache = null;
      return;
    }
    MINE = MINE.filter(m => m.id !== id);
    save(KEY.mine, MINE);
    countCache = null;
  }

  /** „Szukam teraz" — w trybie api ustawia lookingNow na wszystkich moich
   *  ogłoszeniach, żeby inni widzieli to u siebie, a nie tylko ja u siebie. */
  async function setLookingNow(on) {
    if (mode !== "api" || !user) {
      MINE.forEach(m => { m.status = on ? "on" : (m.status || "on"); });
      save(KEY.mine, MINE);
      return;
    }
    await Promise.all(MINE.map(m => API.updateAd(m.id, { lookingNow: !!on }).catch(() => null)));
    MINE.forEach(m => { m.lookingNow = !!on; m.status = on ? "on" : "idle"; });
    serverAds = serverAds.map(a => (a.mine ? Object.assign({}, a, { status: on ? "on" : "idle" }) : a));
  }

  async function toggleSave(id) {
    const on = savedIds.has(id);
    if (mode === "api") {
      if (!user) { const e = new Error("Zaloguj się, żeby obserwować."); e.status = 401; throw e; }
      if (on) await API.unsaveAd(id); else await API.saveAd(id);
      if (on) savedIds.delete(id); else savedIds.add(id);
      SAVED = Array.from(savedIds);
      return !on;
    }
    if (on) { savedIds.delete(id); SAVED = SAVED.filter(s => s !== id); }
    else { savedIds.add(id); SAVED.push(id); }
    save(KEY.saved, SAVED);
    return !on;
  }

  /* ---------- konto ---------- */
  /** Hasło na serwerze ma minimum 8 znaków — pilnujemy tego też we froncie,
   *  żeby błąd nie przychodził dopiero z odpowiedzi HTTP. */
  const MIN_PASS_API = 8;

  async function login({ email, password }) {
    user = (await API.login({ email, password })).user;
    loadUserData();
    await refresh();
    return user;
  }

  async function register({ email, password, displayName }) {
    user = (await API.register({ email, password, displayName })).user;
    loadUserData();
    await refresh();
    return user;
  }

  async function logout() {
    if (mode === "api") {
      await API.logout();
      user = null;
      loadUserData();
      await refresh();
    }
  }

  return {
    init,
    refresh,
    get mode() { return mode; },
    get isApi() { return mode === "api"; },
    get user() { return user; },
    get games() { return gameList; },
    get limits() { return limits; },
    get minPassword() { return mode === "api" ? MIN_PASS_API : 6; },
    players,
    isSaved: (id) => savedIds.has(id),
    /** Ile ogłoszeń przypada na grę — w trybie api liczy to baza. */
    adsForGame(name) {
      if (mode === "api") {
        const g = gameList.find(x => x.name === name);
        return g && g.ads ? g.ads : 0;
      }
      return countFor(name);
    },
    gameIdByName,
    createAd,
    updateAd,
    deleteAd,
    setLookingNow,
    toggleSave,
    login,
    register,
    logout,
    discordLoginUrl: () => API.discordLoginUrl()
  };
})();
