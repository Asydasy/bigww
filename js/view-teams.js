"use strict";

/* =========================================================
   9. EKIPY
========================================================= */
function renderTeams() {
  const toks = tokens($("#tSearch").value.trim());
  const list = TEAMS.filter(t => {
    if (!toks.length) return true;
    return searchScore([
      { text: norm(t.name), w: 10 },
      { text: norm(t.game), w: 9 },
      { text: norm(t.style), w: 5 },
      { text: norm(t.region), w: 4 },
      { text: norm(t.time), w: 3 },
      { text: norm(t.desc), w: 2 }
    ], toks) > 0;
  }).sort((a, b) => {
    if (toks.length) {
      const sa = searchScore([{ text: norm(a.name), w: 10 }, { text: norm(a.game), w: 9 }], toks);
      const sb = searchScore([{ text: norm(b.name), w: 10 }, { text: norm(b.game), w: 9 }], toks);
      if (sb !== sa) return sb - sa;
    }
    return b.added - a.added;
  });
  $("#tCount").textContent = `${list.length} ekip z wolnymi miejscami`;
  const box = $("#teamList");
  box.innerHTML = "";
  if (!list.length) {
    box.innerHTML = `<div class="empty" style="grid-column:1/-1"><h3>Żadna ekipa nie pasuje</h3><p>Spróbuj innej nazwy albo gry.</p></div>`;
    return;
  }
  const frag = document.createDocumentFragment();
  list.forEach(t => frag.append(teamCard(t)));
  box.append(frag);
}
