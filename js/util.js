"use strict";

/* BigWW - Pomocnicze: $, el, norm, searchScore, ago, toast, fillSelect */

/* =========================================================
   4. POMOCNICZE
========================================================= */
const $ = s => document.querySelector(s);
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const norm = t => (t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const nf = n => n.toLocaleString("pl-PL");
const tokens = q => norm(q).split(/[\s,;|]+/).filter(t => t.length > 0);
function regionMatches(filter, playerRegion) {
  if (!filter) return true;
  return filter === playerRegion;
}

/** Trafność wyszukiwania: im wyższy score, tym lepsze dopasowanie. Wszystkie tokeny muszą pasować (AND). */
function searchScore(fields, toks) {
  if (!toks.length) return 1;
  let total = 0;
  for (const t of toks) {
    let best = 0;
    for (const { text, w } of fields) {
      if (!text) continue;
      if (text === t) best = Math.max(best, w * 10);
      else if (text.startsWith(t) && t.length >= 2) best = Math.max(best, w * 6);
      else if (t.length >= 2 && text.includes(t)) best = Math.max(best, w * 3);
      else {
        // dopasowanie całych słów w polu
        const words = text.split(/[\s\-_./]+/);
        if (words.some(wd => wd === t)) best = Math.max(best, w * 8);
        else if (t.length >= 3 && words.some(wd => wd.startsWith(t))) best = Math.max(best, w * 5);
      }
    }
    if (best === 0) return 0; // token nie pasuje nigdzie → odrzuć
    total += best;
  }
  return total;
}

function playerSearchFields(p) {
  return [
    { text: norm(p.nick), w: 10 },
    { text: norm(p.game), w: 9 },
    { text: norm((p.tags || []).join(" ")), w: 6 },
    { text: norm(p.style), w: 5 },
    { text: norm(p.time), w: 4 },
    { text: norm(p.region), w: 4 },
    { text: norm(PLAT_LABEL[p.plat] || p.plat), w: 4 },
    { text: norm(p.mic), w: 3 },
    { text: norm(p.lang), w: 3 },
    { text: norm(p.desc), w: 2 }
  ];
}

function ago(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "przed chwilą";
  if (m < 60) return m + " min temu";
  const h = Math.floor(m / 60);
  if (h < 24) return h + " godz. temu";
  const d = Math.floor(h / 24);
  return d === 1 ? "wczoraj" : d + " dni temu";
}
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 2200);
}
function fillSelect(sel, items, first) {
  sel.innerHTML = "";
  if (first) sel.appendChild(new Option(first, ""));
  items.forEach(i => sel.appendChild(new Option(i.label || i, i.value != null ? i.value : i)));
}

/** Polski liczebnik: 1 gracz, 2-4 graczy, 5+ graczy. W praktyce forma
 *  dopełniacza „graczy" pasuje do wszystkiego poza jedynką. */
function graczy(n) {
  return n === 1 ? "1 gracz" : nf(n) + " graczy";
}

/* ---------- godziny grania ---------- */

/** 17 -> "17:00" */
function fmtHour(h) {
  const n = ((Number(h) % 24) + 24) % 24;
  return String(n).padStart(2, "0") + ":00";
}

/** Para godzin jako etykieta na karcie: "17:00–22:00". */
function timeLabel(from, to) {
  if (from == null || to == null || from === "" || to === "") return "Elastycznie";
  return fmtHour(from) + "–" + fmtHour(to);
}

/**
 * Czy dwa zakresy godzin mają część wspólną.
 * Zakres może przechodzić przez północ (22–4) — wtedy rozbijamy go na dwa
 * kawałki. Początek równy końcowi oznacza całą dobę.
 *
 * Ta sama logika siedzi w bazie jako bigww_hours_overlap() — obie muszą dawać
 * te same wyniki, inaczej filtr pokazywałby co innego z backendem i bez niego.
 */
function hoursOverlap(adFrom, adTo, filterFrom, filterTo) {
  if (filterFrom === "" || filterFrom == null || filterTo === "" || filterTo == null) return true;
  if (adFrom == null || adTo == null) return true;

  const expand = (a, b) => {
    a = Number(a); b = Number(b);
    if (a === b) return [[0, 24]];
    if (a < b) return [[a, b]];
    return [[a, 24], [0, b]];
  };

  for (const [a1, a2] of expand(adFrom, adTo)) {
    for (const [b1, b2] of expand(filterFrom, filterTo)) {
      if (a1 < b2 && b1 < a2) return true;
    }
  }
  return false;
}

/** Wypełnia listę wyboru godzinami 00:00–23:00. */
function fillHourSelect(sel, firstLabel, defaultVal) {
  if (!sel) return;
  sel.innerHTML = "";
  if (firstLabel != null) sel.appendChild(new Option(firstLabel, ""));
  for (let h = 0; h < 24; h++) sel.appendChild(new Option(fmtHour(h), String(h)));
  if (defaultVal != null && defaultVal !== "") sel.value = String(defaultVal);
}

/**
 * Nazwa pliku okładki z nazwy gry: "Counter-Strike 2" -> "counter-strike-2".
 * MUSI dawać ten sam wynik co slug() w server/src/covers.js — inaczej front
 * szuka okładki pod innym adresem, niż zapisał skrypt pobierający.
 */
function slugGry(nazwa) {
  return (nazwa || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
