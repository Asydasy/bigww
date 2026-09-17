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
/** "grid" albo "list" — przełącznik nad listą wyników. */
let playerView = "grid";
/** Numer ostatnio wczytanej strony wyników. */
let page = 1;
const PER_PAGE = 24;
let lastTotal = 0;
/** Zapisuje stan filtrów do PREF. Podstawiane w buildFilters(), żeby chipy
 *  aktywnych filtrów mogły z niego skorzystać spoza tej funkcji. */
let persistFilters = () => {};

function buildFilters() {
  const gameNames = DATA.games.map(g => g.name).sort((a, b) => a.localeCompare(b, "pl"));
  fillSelect($("#fGame"), gameNames, "Wszystkie gry");
  fillSelect($("#fRegion"), REGIONS, "Wszystkie kraje");
  fillSelect($("#fPlat"), PLATS.map(p => ({ value: p, label: PLAT_LABEL[p] })), "Każda platforma");
  fillSelect($("#fStyle"), STYLES, "Każdy styl");
  fillHourSelect($("#fTimeFrom"), "Od");
  fillHourSelect($("#fTimeTo"), "Do");

  fillSelect($("#aGame"), gameNames);
  fillSelect($("#aRegion"), REGIONS);
  fillSelect($("#aPlat"), PLATS.map(p => ({ value: p, label: PLAT_LABEL[p] })));
  fillSelect($("#aStyle"), STYLES);
  fillHourSelect($("#aTimeFrom"), null, "17");
  fillHourSelect($("#aTimeTo"), null, "22");
  fillSelect($("#sRegion"), REGIONS);
  $("#sRegion").value = PREF.region;
  $("#aRegion").value = PREF.region;

  // Godziny w grze i ocena istnieją tylko w danych demo — przy prawdziwych
  // ogłoszeniach nie ma czego po nich sortować.
  if (DATA.isApi) {
    Array.from($("#fSort").options).forEach(o => {
      if (o.value === "hours" || o.value === "rating") o.remove();
    });
  }

  persistFilters = function () {
    PREF.filters = {
      search: $("#pSearch").value,
      game: $("#fGame").value,
      region: $("#fRegion").value,
      plat: $("#fPlat").value,
      style: $("#fStyle").value,
      timeFrom: $("#fTimeFrom").value,
      timeTo: $("#fTimeTo").value,
      sort: $("#fSort").value,
      quick: Array.from(quickOn)
    };
    PREF.playerView = playerView;
    save(KEY.pref, PREF);
  };

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
    if (f.timeFrom != null) $("#fTimeFrom").value = f.timeFrom;
    if (f.timeTo != null) $("#fTimeTo").value = f.timeTo;
    if (f.sort && Array.from($("#fSort").options).some(o => o.value === f.sort)) $("#fSort").value = f.sort;
    if (f.quick && f.quick.length) {
      f.quick.forEach(id => quickOn.add(id));
      document.querySelectorAll("#quickChips .chip").forEach((c, i) => {
        if (QUICK[i] && quickOn.has(QUICK[i].id)) c.classList.add("on");
      });
    }
  }
  if (PREF.playerView) playerView = PREF.playerView;
  applyPlayerView();

  document.querySelectorAll("#viewToggle button").forEach(b => {
    b.onclick = () => {
      playerView = b.dataset.view;
      persistFilters();
      applyPlayerView();
    };
  });

  // Wpisywanie w wyszukiwarkę odpytuje serwer, więc czekamy, aż użytkownik
  // skończy pisać — inaczej każde naciśnięcie klawisza to osobne zapytanie.
  let typing = null;
  const rerun = (delay) => {
    persistFilters();
    clearTimeout(typing);
    typing = setTimeout(() => renderPlayers(true), delay);
  };
  $("#pSearch").addEventListener("input", () => rerun(250));
  ["#fGame", "#fRegion", "#fPlat", "#fStyle", "#fTimeFrom", "#fTimeTo", "#fSort"].forEach(s => {
    $(s).addEventListener("input", () => rerun(0));
  });

  $("#pReset").onclick = () => {
    ["#fGame", "#fRegion", "#fPlat", "#fStyle", "#fTimeFrom", "#fTimeTo"].forEach(s => $(s).value = "");
    $("#pSearch").value = ""; $("#fSort").value = "new";
    quickOn.clear();
    document.querySelectorAll("#quickChips .chip").forEach(c => c.classList.remove("on"));
    PREF.filters = null;
    save(KEY.pref, PREF);
    renderPlayers(true);
  };
  $("#pMore").onclick = () => renderPlayers(false);
}

function applyPlayerView() {
  const box = $("#playerList");
  if (box) box.classList.toggle("list-view", playerView === "list");
  document.querySelectorAll("#viewToggle button").forEach(b => {
    b.classList.toggle("on", b.dataset.view === playerView);
  });
}

/**
 * Aktywne filtry jako klikalne chipy z krzyżykiem — widać na pierwszy rzut oka,
 * co zawęża wyniki, i da się zdjąć pojedynczy warunek bez czyszczenia wszystkiego.
 */
function renderActiveFilters() {
  const box = $("#activeFilters");
  if (!box) return;
  box.innerHTML = "";

  const chips = [];
  const add = (label, clear) => chips.push({ label, clear });

  if ($("#pSearch").value.trim()) add("„" + $("#pSearch").value.trim() + "”", () => ($("#pSearch").value = ""));
  if ($("#fGame").value) add($("#fGame").value, () => ($("#fGame").value = ""));
  if ($("#fRegion").value) add($("#fRegion").value, () => ($("#fRegion").value = ""));
  if ($("#fPlat").value) add(PLAT_LABEL[$("#fPlat").value] || $("#fPlat").value, () => ($("#fPlat").value = ""));
  if ($("#fStyle").value) add($("#fStyle").value, () => ($("#fStyle").value = ""));
  if ($("#fTimeFrom").value || $("#fTimeTo").value) {
    add(timeLabel($("#fTimeFrom").value || 0, $("#fTimeTo").value || 23), () => {
      $("#fTimeFrom").value = "";
      $("#fTimeTo").value = "";
    });
  }
  QUICK.forEach(q => {
    if (!quickOn.has(q.id)) return;
    add(q.label, () => {
      quickOn.delete(q.id);
      document.querySelectorAll("#quickChips .chip").forEach((c, i) => {
        if (QUICK[i] && QUICK[i].id === q.id) c.classList.remove("on");
      });
    });
  });

  chips.forEach(ch => {
    const b = el("button", "chip on", ch.label + " ×");
    b.title = "Usuń ten filtr";
    b.onclick = () => {
      ch.clear();
      persistFilters();
      renderPlayers(true);
    };
    box.append(b);
  });
}

/** Zbiera stan filtrów z formularza. DATA tłumaczy je na zapytanie do
 *  serwera albo na filtrowanie danych demo. */
function currentFilters() {
  return {
    q: ($("#pSearch").value || "").trim(),
    game: $("#fGame").value,
    region: $("#fRegion").value,
    plat: $("#fPlat").value,
    style: $("#fStyle").value,
    hourFrom: $("#fTimeFrom").value,
    hourTo: $("#fTimeTo").value,
    sort: $("#fSort").value,
    quick: Array.from(quickOn)
  };
}

function wynikow(n) {
  return `${graczy(n)} pasuje do filtrów`;
}

/**
 * @param reset true = nowe wyszukiwanie od pierwszej strony,
 *              false = doładowanie kolejnej strony pod spód
 */
async function renderPlayers(reset) {
  const box = $("#playerList");
  if (reset) {
    page = 1;
    box.innerHTML = "";
    $("#pCount").textContent = "Szukam…";
    $("#pMore").style.display = "none";
  } else {
    page += 1;
    $("#pMore").disabled = true;
  }

  let res;
  try {
    res = await DATA.listAds(currentFilters(), page, PER_PAGE);
  } catch (e) {
    $("#pMore").disabled = false;
    $("#pCount").textContent = "Nie udało się pobrać wyników";
    if (reset) {
      box.innerHTML = `<div class="empty" style="grid-column:1/-1">
        <h3>Brak połączenia z serwerem</h3>
        <p>${e.message || "Spróbuj odświeżyć stronę."}</p></div>`;
    } else {
      page -= 1;
      toast(e.message || "Nie udało się dociągnąć wyników");
    }
    return;
  }

  renderActiveFilters();
  lastTotal = res.total;
  $("#pCount").textContent = res.total ? wynikow(res.total) : "Brak wyników";

  if (!res.total) {
    const e = el("div", "empty");
    e.style.gridColumn = "1/-1";
    const active = [];
    if ($("#pSearch").value.trim()) active.push("szukaj: „" + $("#pSearch").value.trim() + "”");
    if ($("#fGame").value) active.push("gra: " + $("#fGame").value);
    if ($("#fRegion").value) active.push("region: " + $("#fRegion").value);
    if ($("#fPlat").value) active.push("platforma: " + $("#fPlat").value);
    if ($("#fStyle").value) active.push("styl: " + $("#fStyle").value);
    if ($("#fTimeFrom").value || $("#fTimeTo").value) {
      active.push("godziny: " + timeLabel($("#fTimeFrom").value || 0, $("#fTimeTo").value || 23));
    }
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
    return;
  }

  const frag = document.createDocumentFragment();
  res.ads.forEach(p => frag.append(playerCard(p)));
  box.append(frag);

  $("#pMore").disabled = false;
  $("#pMore").style.display = page < res.pages ? "inline-block" : "none";
  if (reset) addSponsoredSlot(); // monetization.js — tylko nad pierwszą stroną wyników
}
