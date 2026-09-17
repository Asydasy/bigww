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
