"use strict";

/* =========================================================
   12. USTAWIENIA
========================================================= */
function applyTheme() {
  let theme = PREF.theme || "dark";
  if (theme === "system") {
    theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  document.documentElement.setAttribute("data-theme", theme);
  if ($("#sTheme")) $("#sTheme").value = PREF.theme || "dark";
}
$("#sTheme").onchange = e => { PREF.theme = e.target.value; save(KEY.pref, PREF); applyTheme(); };
if (window.matchMedia) {
  try {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (PREF.theme === "system") applyTheme();
    });
  } catch (e) {}
}
$("#sRegion").onchange = e => {
  PREF.region = e.target.value; save(KEY.pref, PREF);
  $("#aRegion").value = PREF.region;
  toast("Domyślny kraj zapisany");
};
$("#sExport").onclick = () => {
  const payload = {
    version: 3,
    exportedAt: new Date().toISOString(),
    user: currentUser() ? { nick: currentUser().nick, email: currentUser().email } : null,
    mine: MINE,
    saved: SAVED,
    pref: PREF,
    prem: PREM,
    coins: COINS,
    ref: REF,
    unlocks: UNLOCKS
  };
  const text = JSON.stringify(payload, null, 2);
  openModal(`<h3 style="margin-bottom:10px">Eksport danych</h3>
    <p class="note" style="margin-bottom:10px">Skopiuj poniższy plik i przechowaj w bezpiecznym miejscu. Możesz później wczytać go przez Importuj dane.</p>
    <textarea id="exportArea" readonly style="height:200px">${text.replace(/</g, "&lt;")}</textarea>
    <button class="btn pri sm" id="exportCopy" style="margin-top:12px">Kopiuj do schowka</button>`);
  $("#exportCopy").onclick = () => {
    navigator.clipboard?.writeText(text).then(() => toast("Skopiowano")).catch(() => toast("Zaznacz i skopiuj ręcznie"));
  };
};
if ($("#sImport")) $("#sImport").onclick = () => {
  if (DATA.isApi) {
    openModal(`<h3 style="margin-bottom:10px">Import danych</h3>
      <p class="note" style="margin-top:10px">W trybie serwerowym ogłoszenia i obserwowani siedzą w bazie, a nie w przeglądarce — wczytanie pliku nic by tam nie zmieniło. Import działa po odłączeniu backendu, na danych lokalnych.</p>`);
    return;
  }
  openModal(`<h3 style="margin-bottom:10px">Import danych</h3>
    <p class="note" style="margin-bottom:10px">Wklej wcześniej wyeksportowany plik JSON. Obecne ogłoszenia i ustawienia zostaną nadpisane.</p>
    <textarea id="importArea" style="height:180px" placeholder='{"version":3,...}'></textarea>
    <button class="btn pri" id="importGo" style="margin-top:12px">Wczytaj</button>`);
  $("#importGo").onclick = () => {
    try {
      const data = JSON.parse($("#importArea").value);
      if (!data || typeof data !== "object") throw new Error("bad");
      if (Array.isArray(data.mine)) MINE = data.mine;
      else if (Array.isArray(data)) MINE = data;
      if (Array.isArray(data.saved)) SAVED = data.saved;
      if (data.pref) PREF = Object.assign(PREF, data.pref);
      if (data.prem) PREM = data.prem;
      if (data.coins) COINS = data.coins;
      if (data.ref) REF = data.ref;
      if (Array.isArray(data.unlocks)) UNLOCKS = data.unlocks;
      save(KEY.mine, MINE); save(KEY.saved, SAVED); save(KEY.pref, PREF);
      save(KEY.prem, PREM); save(KEY.coins, COINS); save(KEY.ref, REF); save(KEY.unlocks, UNLOCKS);
      countCache = null;
      $("#modal").classList.remove("on");
      applyTheme(); updateBadges(); updateCoinUI(); renderMine(); renderSaved(); renderPlayers(true); renderHome(); renderShop(); renderPremium();
      toast("Dane wczytane");
    } catch (e) {
      toast("Nieprawidłowy format pliku");
    }
  };
};
$("#sWipe").onclick = () => {
  const naSerwerze = DATA.isApi;
  openModal(`<h3 style="margin-bottom:10px">Usunąć wszystkie dane?</h3>
    <p class="note">${naSerwerze
      ? `Wyczyścimy dane z tej przeglądarki: monety, premium, skrzynkę, powiadomienia, oceny i blokady. <b>Twoje ${MINE.length} ogłoszeń i ${SAVED.length} obserwowanych zostaje w bazie</b> — te kasuje się na listach.`
      : `Zniknie ${MINE.length} ogłoszeń i ${SAVED.length} obserwowanych graczy. Tego nie da się cofnąć.`}</p>
    <button class="btn pri" id="wipeYes" style="margin-top:16px">Tak, usuń</button>`);
  $("#wipeYes").onclick = () => {
    if (!naSerwerze) { MINE = []; SAVED = []; }
    COINS = { bal: 40, earned: 0, spent: 0 };
    REF = { code: genRefCode(), used: [], count: 0, earned: 0, applied: false };
    BOOSTS = {};
    ADLOG = { lastWatch: 0, daily: 0, day: "" };
    MSG = { day: "", used: 0 };
    BP = { level: 1, xp: 0, claimed: [] };
    QUESTS = { day: "", done: {} };
    UNLOCKS = [];
    NAVCOUNT = 0;
    PREM = { active: false, plan: null, until: 0, since: 0 };
    LIVEPASS = { until: 0 };
    LIVETICKETS = [];
    // Rzeczy, które doszły razem ze skrzynką i moderacją — bez tego „usuń
    // wszystko" zostawiało wiadomości, blokady i oceny.
    INBOX = [];
    NOTIFS = [];
    BLOCKED = [];
    REPORTS = [];
    RATINGS = {};
    PRESETS = [];
    pendingMedia = { clipUrl: "", fileData: null, fileType: "" };
    if (!naSerwerze) { save(KEY.mine, MINE); save(KEY.saved, SAVED); }
    save(KEY.coins, COINS); save(KEY.ref, REF); save(KEY.boosts, BOOSTS); save(KEY.adlog, ADLOG);
    save(KEY.msg, MSG); save(KEY.bp, BP); save(KEY.quests, QUESTS); save(KEY.unlocks, UNLOCKS);
    save(KEY.navcount, NAVCOUNT); save(KEY.prem, PREM);
    save(KEY.livePass, LIVEPASS); save(KEY.liveTickets, LIVETICKETS);
    save(KEY.inbox, INBOX); save(KEY.notifs, NOTIFS); save(KEY.blocked, BLOCKED);
    save(KEY.reports, REPORTS); save(KEY.ratings, RATINGS); save(KEY.presets, PRESETS);
    // Klucze poza obiektem KEY — nie mają przyrostka konta, więc lecą wprost.
    localStorage.removeItem("bigww_extra_slot");
    localStorage.removeItem("bigww_unlock_cred");
    localStorage.removeItem("bigww_gw_entries");
    localStorage.removeItem("bigww_gw_day");
    countCache = null;
    $("#modal").classList.remove("on");
    updateBadges(); updateNotifUI(); renderInbox();
    renderMine(); renderSaved(); renderPlayers(true); renderHome(); renderShop(); renderPremium(); renderLives();
    if (typeof renderGiveaways === "function") renderGiveaways();
    toast("Dane usunięte");
  };
};
function renderInfo() {
  const byGenre = {};
  GAMES.forEach(g => byGenre[g.genre] = (byGenre[g.genre] || 0) + 1);
  const rows = Object.entries(byGenre).sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([k, v]) => `<div class="kv"><span>${k}</span><b>${v} gier</b></div>`).join("");
  $("#sInfo").innerHTML = `
    <div class="kv"><span>Gry w bazie</span><b>${nf(GAMES.length)}</b></div>
    <div class="kv"><span>Profile graczy</span><b>${nf(PLAYERS.length)}</b></div>
    <div class="kv"><span>Ekipy</span><b>${TEAMS.length}</b></div>
    <div style="height:14px"></div>${rows}`;
}

