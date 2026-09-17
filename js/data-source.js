"use strict";

/* BigWW — jedno wejście do danych dla wszystkich widoków.
 *
 * Działa w dwóch trybach, rozpoznawanych raz przy starcie:
 *   "serwer" — backend odpowiada, dane idą z bazy, konta działają
 *   "demo"   — backendu nie ma, dane z generatora i localStorage
 *
 * Widoki nie wiedzą, który tryb jest aktywny — wołają DATA.listAds(),
 * DATA.createAd() i tak dalej. Dzięki temu index.html otwarty podwójnym
 * kliknięciem dalej pokazuje pełną aplikację, a z uruchomionym backendem
 * ta sama strona chodzi na prawdziwych ogłoszeniach.
 */

const DATA = (() => {
  let mode = "demo";
  let user = null;
  let gameList = [];
  let savedIds = new Set();
  let limits = { limit: 2, used: 0 };
  let totalAds = 0;
  /** Ostatnio pobrane moje ogłoszenia — sklep potrzebuje ich synchronicznie. */
  let mineCache = [];

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
      time: a.time,
      mic: a.mic,
      lang: a.lang,
      tags: a.tags || [],
      desc: a.desc,
      clipUrl: a.clipUrl || "",
      // Serwer nie przechowuje plików z dysku ani statystyk z gry —
      // to są pola wyłącznie generatora demo.
      fileData: null,
      fileType: "",
      hours: 0,
      rating: "—",
      status: a.lookingNow ? "on" : "off",
      prem: a.prem,
      boosted: a.boosted,
      added: a.added,
      mine: a.mine,
      contact: a.contact,
      contactLocked: a.contactLocked
    };
  }

  /** Zamiana ogłoszenia z formularza na to, czego oczekuje API. */
  function toApi(draftAd) {
    return {
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
      contact: draftAd.contact || undefined,
      clipUrl: draftAd.clipUrl || undefined,
      lookingNow: !!PREF.looking
    };
  }

  /* ---------- filtrowanie w trybie demo ---------- */
  /** Ta sama logika, która wcześniej siedziała w filterPlayers(). */
  function demoFilter(f) {
    const toks = tokens(f.q || "");
    const quick = new Set(f.quick || []);

    const scored = [];
    allPlayers().forEach(p => {
      if (f.game && p.game !== f.game) return;
      if (!regionMatches(f.region, p.region)) return;
      if (f.plat && p.plat !== f.plat) return;
      if (f.style && p.style !== f.style) return;
      if (f.time && p.time !== f.time) return;
      if (quick.has("on") && p.status !== "on") return;
      if (quick.has("mic") && p.mic !== "Mikrofon: tak") return;
      if (quick.has("new") && Date.now() - p.added > 24 * HOUR) return;
      if (quick.has("learn") && !(p.tags || []).includes("uczę nowych")) return;
      if (quick.has("pl") && !(p.lang || "").startsWith("PL")) return;

      const score = searchScore(playerSearchFields(p), toks);
      if (toks.length && score === 0) return;
      scored.push({ p, score });
    });

    const sort = f.sort || "new";
    const boostPri = x => (isBoosted(x.p.id) ? 0 : 1);
    const lookPri = x => (x.p.mine && PREF.looking ? 0 : 1);
    const pr = x => ((x.p.mine ? isPrem() : !!x.p.prem) ? 0 : 1);
    const byScore = (a, b) => (toks.length ? b.score - a.score : 0);

    if (sort === "new") scored.sort((a, b) => boostPri(a) - boostPri(b) || lookPri(a) - lookPri(b) || pr(a) - pr(b) || byScore(a, b) || b.p.added - a.p.added);
    else if (sort === "online") scored.sort((a, b) => boostPri(a) - boostPri(b) || lookPri(a) - lookPri(b) || (a.p.status === "on" ? 0 : 1) - (b.p.status === "on" ? 0 : 1) || byScore(a, b) || b.p.added - a.p.added);
    else if (sort === "hours") scored.sort((a, b) => boostPri(a) - boostPri(b) || lookPri(a) - lookPri(b) || byScore(a, b) || (b.p.hours || 0) - (a.p.hours || 0));
    else if (sort === "rating") scored.sort((a, b) => boostPri(a) - boostPri(b) || lookPri(a) - lookPri(b) || byScore(a, b) || Number(b.p.rating) - Number(a.p.rating));
    else scored.sort((a, b) => byScore(a, b) || b.p.added - a.p.added);

    return scored.map(x => x.p);
  }

  /** Filtry frontu przetłumaczone na parametry zapytania do API. */
  function toQuery(f, page, perPage) {
    const quick = new Set(f.quick || []);
    const query = { page, perPage, q: f.q || undefined };
    if (f.game) query.game = f.game;
    if (f.region) query.region = f.region;
    if (f.plat) query.plat = f.plat;
    if (f.style) query.style = f.style;
    if (f.time) query.time = f.time;
    if (quick.has("on")) query.lookingNow = true;
    if (quick.has("mic")) query.mic = "Mikrofon: tak";
    if (quick.has("new")) query.newHours = 24;
    if (quick.has("learn")) query.tag = "uczę nowych";
    if (quick.has("pl")) query.lang = "PL";
    return query;
  }

  function gameIdByName(name) {
    const g = gameList.find(x => x.name === name);
    return g ? g.id : null;
  }

  /* ---------- start ---------- */
  async function init() {
    try {
      await API.health();
      mode = "api";
    } catch {
      mode = "demo";
    }

    if (mode === "api") {
      try {
        user = (await API.me()).user;
        // withCounts daje liczbę ogłoszeń na grę — do kafelków w bazie gier.
        gameList = (await API.games({ withCounts: true })).games;
        totalAds = (await API.ads({ perPage: 1 })).total;
        await refreshSaved();
      } catch (e) {
        // Serwer odpowiedział na /health, ale coś dalej padło — lepiej
        // pokazać działające demo niż pustą stronę.
        console.warn("BigWW: backend odpowiada, ale nie oddał danych — wracam do trybu demo.", e);
        mode = "demo";
      }
    }

    if (mode === "demo") {
      gameList = GAMES;
      totalAds = allPlayers().length;
      savedIds = new Set(SAVED);
      user = null;
    }
    return mode;
  }

  async function refreshSaved() {
    if (mode !== "api" || !user) { savedIds = mode === "api" ? new Set() : new Set(SAVED); return; }
    const res = await API.savedAds();
    savedIds = new Set(res.ads.map(a => a.id));
  }

  /* ---------- ogłoszenia ---------- */
  async function listAds(f, page = 1, perPage = 24) {
    if (mode === "api") {
      const res = await API.ads(toQuery(f, page, perPage));
      return { ads: res.ads.map(fromApi), total: res.total, pages: res.pages, page: res.page };
    }
    const all = demoFilter(f);
    const from = (page - 1) * perPage;
    return {
      ads: all.slice(from, from + perPage),
      total: all.length,
      pages: Math.max(1, Math.ceil(all.length / perPage)),
      page
    };
  }

  async function createAd(draftAd) {
    if (mode === "api") {
      const res = await API.createAd(toApi(draftAd));
      limits.used += 1;
      totalAds += 1;
      return fromApi(res.ad);
    }
    if (MINE.length >= adLimit()) {
      const err = new Error("Limit ogłoszeń wyczerpany");
      err.status = 403;
      throw err;
    }
    MINE.unshift(draftAd);
    save(KEY.mine, MINE);
    countCache = null;
    totalAds = allPlayers().length;
    return draftAd;
  }

  async function deleteAd(id) {
    if (mode === "api") {
      await API.deleteAd(id);
      limits.used = Math.max(0, limits.used - 1);
      totalAds = Math.max(0, totalAds - 1);
      return;
    }
    MINE = MINE.filter(m => m.id !== id);
    save(KEY.mine, MINE);
    countCache = null;
    totalAds = allPlayers().length;
  }

  async function myAds() {
    if (mode === "api") {
      if (!user) return { ads: [], limit: 2, used: 0 };
      const res = await API.myAds();
      limits = { limit: res.limit, used: res.used };
      mineCache = res.ads.map(fromApi);
      return { ads: mineCache.slice(), limit: res.limit, used: res.used };
    }
    mineCache = MINE.slice();
    return { ads: mineCache.slice(), limit: adLimit(), used: MINE.length };
  }

  async function savedAds() {
    if (mode === "api") {
      if (!user) return { ads: [] };
      const res = await API.savedAds();
      savedIds = new Set(res.ads.map(a => a.id));
      return { ads: res.ads.map(fromApi) };
    }
    return { ads: allPlayers().filter(p => SAVED.includes(p.id)) };
  }

  function isSaved(id) {
    return savedIds.has(id);
  }

  async function toggleSave(id) {
    const on = savedIds.has(id);
    if (mode === "api") {
      if (!user) { const e = new Error("Zaloguj się, żeby obserwować."); e.status = 401; throw e; }
      if (on) await API.unsaveAd(id); else await API.saveAd(id);
    } else {
      if (on) SAVED = SAVED.filter(s => s !== id);
      else SAVED.push(id);
      save(KEY.saved, SAVED);
    }
    if (on) savedIds.delete(id); else savedIds.add(id);
    return !on;
  }

  /* ---------- konto ---------- */
  async function login(payload) {
    user = (await API.login(payload)).user;
    await refreshSaved();
    return user;
  }

  async function register(payload) {
    user = (await API.register(payload)).user;
    await refreshSaved();
    return user;
  }

  async function logout() {
    await API.logout();
    user = null;
    savedIds = new Set();
  }

  return {
    init,
    get mode() { return mode; },
    get isApi() { return mode === "api"; },
    get user() { return user; },
    get games() { return gameList; },
    get limits() { return limits; },
    /** Liczby do odznaczek w menu bocznym. */
    get totalAds() { return totalAds; },
    get savedCount() { return savedIds.size; },
    get mineCount() { return mode === "api" ? limits.used : MINE.length; },
    /** Moje ogłoszenia bez pytania serwera — odświeżane przez myAds(). */
    get mineCached() { return mode === "api" ? mineCache : MINE; },
    /** Ile ogłoszeń przypada na grę — w trybie serwerowym liczy to baza. */
    adsForGame(name) {
      if (mode === "api") {
        const g = gameList.find(x => x.name === name);
        return g && g.ads ? g.ads : 0;
      }
      return countFor(name);
    },
    gameIdByName,
    listAds,
    createAd,
    deleteAd,
    myAds,
    savedAds,
    isSaved,
    toggleSave,
    refreshSaved,
    login,
    register,
    logout
  };
})();
