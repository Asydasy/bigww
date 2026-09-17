"use strict";

/* BigWW - Widok: ustawienia, motyw, kasowanie danych */

/* =========================================================
   12. USTAWIENIA
========================================================= */
function applyTheme() {
  document.documentElement.setAttribute("data-theme", PREF.theme);
  $("#sTheme").value = PREF.theme;
}
$("#sTheme").onchange = e => { PREF.theme = e.target.value; save(KEY.pref, PREF); applyTheme(); };
$("#sRegion").onchange = e => {
  PREF.region = e.target.value; save(KEY.pref, PREF);
  $("#aRegion").value = PREF.region;
  toast("Domyślny kraj zapisany");
};
$("#sExport").onclick = () => {
  if (!MINE.length) return toast("Nie masz ogłoszeń do pobrania");
  openModal(`<h3 style="margin-bottom:10px">Twoje ogłoszenia</h3>
    <textarea readonly style="height:220px">${JSON.stringify(MINE, null, 2).replace(/</g, "&lt;")}</textarea>
    <p class="note" style="margin-top:10px">Skopiuj i zachowaj, jeśli chcesz je przenieść gdzie indziej.</p>`);
};
$("#sWipe").onclick = () => {
  openModal(`<h3 style="margin-bottom:10px">Usunąć wszystkie dane?</h3>
    <p class="note">Zniknie ${MINE.length} ogłoszeń i ${SAVED.length} obserwowanych graczy. Tego nie da się cofnąć.</p>
    <button class="btn pri" id="wipeYes" style="margin-top:16px">Tak, usuń</button>`);
  $("#wipeYes").onclick = () => {
    MINE = []; SAVED = [];
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
    pendingMedia = { clipUrl: "", fileData: null, fileType: "" };
    save(KEY.mine, MINE); save(KEY.saved, SAVED);
    save(KEY.coins, COINS); save(KEY.ref, REF); save(KEY.boosts, BOOSTS); save(KEY.adlog, ADLOG);
    save(KEY.msg, MSG); save(KEY.bp, BP); save(KEY.quests, QUESTS); save(KEY.unlocks, UNLOCKS);
    save(KEY.navcount, NAVCOUNT); save(KEY.prem, PREM);
    save(KEY.livePass, LIVEPASS); save(KEY.liveTickets, LIVETICKETS);
    localStorage.removeItem("bigww_extra_slot");
    localStorage.removeItem("bigww_unlock_cred");
    countCache = null;
    $("#modal").classList.remove("on");
    updateBadges(); renderMine(); renderSaved(); renderPlayers(true); renderHome(); renderShop(); renderPremium(); renderLives();
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
