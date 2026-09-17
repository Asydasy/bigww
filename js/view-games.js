"use strict";

/* BigWW - Widok: baza gier */

/* =========================================================
   8. GRY
========================================================= */
/** Wypełniane w buildGames(), bo lista gier jest znana dopiero po DATA.init(). */
let GENRES = [];
let genreOn = "";

function buildGames() {
  GENRES = Array.from(new Set(DATA.games.map(g => g.genre))).sort((a, b) => a.localeCompare(b, "pl"));
  const box = $("#genreChips");
  const all = el("button", "chip on", "Wszystkie");
  all.onclick = () => { genreOn = ""; setChip(all); renderGames(); };
  box.append(all);
  GENRES.forEach(gn => {
    const b = el("button", "chip", gn);
    b.onclick = () => { genreOn = gn; setChip(b); renderGames(); };
    box.append(b);
  });
  $("#gSearch").addEventListener("input", renderGames);
}
function setChip(active) {
  document.querySelectorAll("#genreChips .chip").forEach(c => c.classList.toggle("on", c === active));
}
function renderGames() {
  const toks = tokens($("#gSearch").value.trim());
  const list = DATA.games.filter(g => {
    if (genreOn && g.genre !== genreOn) return false;
    if (!toks.length) return true;
    const fields = [
      { text: norm(g.name), w: 10 },
      { text: norm(g.genre), w: 5 },
      { text: norm(g.mode), w: 3 },
      { text: norm((g.plats || []).join(" ")), w: 2 }
    ];
    return searchScore(fields, toks) > 0;
  }).sort((a, b) => {
    if (toks.length) {
      const sa = searchScore([{ text: norm(a.name), w: 10 }, { text: norm(a.genre), w: 5 }], toks);
      const sb = searchScore([{ text: norm(b.name), w: 10 }, { text: norm(b.genre), w: 5 }], toks);
      if (sb !== sa) return sb - sa;
    }
    return DATA.adsForGame(b.name) - DATA.adsForGame(a.name) || a.name.localeCompare(b.name, "pl");
  });
  $("#gCount").textContent = `${nf(list.length)} z ${nf(DATA.games.length)} gier w bazie`;
  const box = $("#gameList");
  box.innerHTML = "";
  if (!list.length) {
    box.innerHTML = `<div class="empty" style="grid-column:1/-1"><h3>Nie ma takiej gry</h3><p>Sprawdź pisownię albo poszukaj po gatunku.</p></div>`;
    return;
  }
  const frag = document.createDocumentFragment();
  list.forEach(g => frag.append(gameCard(g)));
  box.append(frag);
}
