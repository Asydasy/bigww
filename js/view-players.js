"use strict";

/* BigWW - Widok: szukaj graczy - filtry, wyszukiwarka, lista */

/* =========================================================
   7. FILTRY GRACZY
========================================================= */
const QUICK = [
  { id: "on", label: "Tylko online" },
  { id: "mic", label: "Z mikrofonem" },
  { id: "new", label: "Świeże (24 h)" },
  { id: "learn", label: "Uczą nowych" },
  { id: "pl", label: "Po polsku" }
];
let quickOn = new Set();
let shown = 24;

function buildFilters() {
  fillSelect($("#fGame"), GAMES.map(g => g.name).sort((a, b) => a.localeCompare(b, "pl")), "Wszystkie gry");
  fillSelect($("#fRegion"), REGIONS, "Wszystkie kraje");
  fillSelect($("#fPlat"), PLATS.map(p => ({ value: p, label: PLAT_LABEL[p] })), "Każda platforma");
  fillSelect($("#fStyle"), STYLES, "Każdy styl");
  fillSelect($("#fTime"), TIMES, "Dowolna pora");

  fillSelect($("#aGame"), GAMES.map(g => g.name).sort((a, b) => a.localeCompare(b, "pl")));
  fillSelect($("#aRegion"), REGIONS);
  fillSelect($("#aPlat"), PLATS.map(p => ({ value: p, label: PLAT_LABEL[p] })));
  fillSelect($("#aStyle"), STYLES);
  fillSelect($("#aTime"), TIMES);
  fillSelect($("#sRegion"), REGIONS);
  $("#sRegion").value = PREF.region;
  $("#aRegion").value = PREF.region;

  function persistFilters() {
    PREF.filters = {
      search: $("#pSearch").value,
      game: $("#fGame").value,
      region: $("#fRegion").value,
      plat: $("#fPlat").value,
      style: $("#fStyle").value,
      time: $("#fTime").value,
      sort: $("#fSort").value,
      quick: Array.from(quickOn)
    };
    save(KEY.pref, PREF);
  }

  const box = $("#quickChips");
  QUICK.forEach(q => {
    const b = el("button", "chip", q.label);
    b.onclick = () => {
      quickOn.has(q.id) ? quickOn.delete(q.id) : quickOn.add(q.id);
      b.classList.toggle("on");
      persistFilters();
      renderPlayers(true);
    };
    box.append(b);
  });

  // restore saved filters
  if (PREF.filters) {
    const f = PREF.filters;
    if (f.search) $("#pSearch").value = f.search;
    if (f.game) $("#fGame").value = f.game;
    if (f.region && REGIONS.includes(f.region)) $("#fRegion").value = f.region;
    if (f.plat) $("#fPlat").value = f.plat;
    if (f.style) $("#fStyle").value = f.style;
    if (f.time) $("#fTime").value = f.time;
    if (f.sort) $("#fSort").value = f.sort;
    if (f.quick && f.quick.length) {
      f.quick.forEach(id => quickOn.add(id));
      document.querySelectorAll("#quickChips .chip").forEach((c, i) => {
        if (QUICK[i] && quickOn.has(QUICK[i].id)) c.classList.add("on");
      });
    }
  }

  ["#pSearch", "#fGame", "#fRegion", "#fPlat", "#fStyle", "#fTime", "#fSort"].forEach(s => {
    $(s).addEventListener("input", () => { persistFilters(); renderPlayers(true); });
  });
  $("#pReset").onclick = () => {
    ["#fGame", "#fRegion", "#fPlat", "#fStyle", "#fTime"].forEach(s => $(s).value = "");
    $("#pSearch").value = ""; $("#fSort").value = "new";
    quickOn.clear();
    document.querySelectorAll("#quickChips .chip").forEach(c => c.classList.remove("on"));
    PREF.filters = null;
    save(KEY.pref, PREF);
    renderPlayers(true);
  };
  $("#pMore").onclick = () => { shown += 24; renderPlayers(false); };
}

function filterPlayers() {
  const rawQ = ($("#pSearch").value || "").trim();
  const toks = tokens(rawQ);
  const g = $("#fGame").value, r = $("#fRegion").value, pl = $("#fPlat").value,
        st = $("#fStyle").value, tm = $("#fTime").value;

  const scored = [];
  allPlayers().forEach(p => {
    if (g && p.game !== g) return;
    if (!regionMatches(r, p.region)) return;
    if (pl && p.plat !== pl) return;
    if (st && p.style !== st) return;
    if (tm && p.time !== tm) return;
    if (quickOn.has("on") && p.status !== "on") return;
    if (quickOn.has("mic") && p.mic !== "Mikrofon: tak") return;
    if (quickOn.has("new") && Date.now() - p.added > 24 * HOUR) return;
    if (quickOn.has("learn") && !(p.tags || []).includes("uczę nowych")) return;
    if (quickOn.has("pl") && !(p.lang || "").startsWith("PL")) return;

    const score = searchScore(playerSearchFields(p), toks);
    if (toks.length && score === 0) return;
    scored.push({ p, score });
  });

  const sort = $("#fSort").value;
  const boostPri = x => isBoosted(x.p.id) ? 0 : 1;
  const lookPri = x => (x.p.mine && PREF.looking) ? 0 : 1;
  const pr = x => (x.p.mine ? isPrem() : !!x.p.prem) ? 0 : 1;
  const byScore = (a, b) => (toks.length ? b.score - a.score : 0);

  if (sort === "new") scored.sort((a, b) => boostPri(a) - boostPri(b) || lookPri(a) - lookPri(b) || pr(a) - pr(b) || byScore(a, b) || b.p.added - a.p.added);
  else if (sort === "online") scored.sort((a, b) => boostPri(a) - boostPri(b) || lookPri(a) - lookPri(b) || (a.p.status === "on" ? 0 : 1) - (b.p.status === "on" ? 0 : 1) || byScore(a, b) || b.p.added - a.p.added);
  else if (sort === "hours") scored.sort((a, b) => boostPri(a) - boostPri(b) || lookPri(a) - lookPri(b) || byScore(a, b) || (b.p.hours || 0) - (a.p.hours || 0));
  else if (sort === "rating") scored.sort((a, b) => boostPri(a) - boostPri(b) || lookPri(a) - lookPri(b) || byScore(a, b) || Number(b.p.rating) - Number(a.p.rating));
  else scored.sort((a, b) => byScore(a, b) || b.p.added - a.p.added);

  return scored.map(x => x.p);
}

function renderPlayers(reset) {
  if (reset) shown = 24;
  const list = filterPlayers();
  const box = $("#playerList");
  box.innerHTML = "";
  $("#pCount").textContent = list.length
    ? `${nf(list.length)} ${list.length === 1 ? "gracz" : list.length < 5 ? "graczy" : "graczy"} pasuje do filtrów`
    : "Brak wyników";

  if (!list.length) {
    const e = el("div", "empty");
    e.style.gridColumn = "1/-1";
    const active = [];
    if ($("#pSearch").value.trim()) active.push("szukaj: „" + $("#pSearch").value.trim() + "”");
    if ($("#fGame").value) active.push("gra: " + $("#fGame").value);
    if ($("#fRegion").value) active.push("region: " + $("#fRegion").value);
    if ($("#fPlat").value) active.push("platforma: " + $("#fPlat").value);
    if ($("#fStyle").value) active.push("styl: " + $("#fStyle").value);
    if ($("#fTime").value) active.push("pora: " + $("#fTime").value);
    if (quickOn.size) active.push("szybkie filtry: " + quickOn.size);
    e.innerHTML = `<h3>Brak dokładnych wyników</h3>
      <p>${active.length ? "Aktywne: " + active.join(" · ") + "." : "Nikt nie pasuje."}
      Spróbuj mniej słów w wyszukiwarce (każde słowo musi pasować) albo wyczyść filtry.</p>`;
    const row = el("div");
    row.style.cssText = "display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:16px";
    const b1 = el("button", "btn", "Wyczyść filtry");
    b1.onclick = () => $("#pReset").click();
    const b2 = el("button", "btn pri", "Dodaj ogłoszenie");
    b2.onclick = () => go("add");
    row.append(b1, b2);
    e.append(row);
    box.append(e);
    $("#pMore").style.display = "none";
    addSponsoredSlot(); // monetization.js
    return;
  }
  const frag = document.createDocumentFragment();
  list.slice(0, shown).forEach(p => frag.append(playerCard(p)));
  box.append(frag);
  $("#pMore").style.display = list.length > shown ? "inline-block" : "none";
  addSponsoredSlot(); // monetization.js
}
