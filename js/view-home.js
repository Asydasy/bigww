"use strict";

/* BigWW - Widok: strona startowa i statystyki */

/* =========================================================
   11. START / STATYSTYKI
========================================================= */
async function renderHome() {
  // Statystyki i najnowsze ogłoszenia idą przez DATA, więc na serwerze
  // pokazują prawdziwe liczby, a bez niego dane demonstracyjne.
  let swieze = 0;
  let online = 0;
  let najnowsze = [];

  try {
    const [doba, teraz, ostatnie] = await Promise.all([
      DATA.listAds({ quick: ["new"] }, 1, 1),
      DATA.listAds({ quick: ["on"] }, 1, 1),
      DATA.listAds({ sort: "new" }, 1, 6)
    ]);
    swieze = doba.total;
    online = teraz.total;
    najnowsze = ostatnie.ads;
  } catch (e) {
    console.warn("BigWW: nie udało się pobrać danych na stronę startową", e);
  }

  $("#onlineNow").textContent = nf(online);

  const stats = [
    [nf(DATA.totalAds), "aktywnych ogłoszeń"],
    [nf(DATA.games.length), "gier w bazie"],
    [TEAMS.length, "ekip szuka składu"],
    [nf(swieze), "ogłoszeń z ostatniej doby"]
  ];
  const box = $("#homeStats");
  box.innerHTML = "";
  stats.forEach(([n, l]) => {
    const s = el("div", "stat");
    s.append(el("div", "stat-num", String(n)), el("div", "stat-lab", l));
    box.append(s);
  });

  const top = DATA.games.slice().sort((a, b) => DATA.adsForGame(b.name) - DATA.adsForGame(a.name)).slice(0, 10);
  const gbox = $("#homeGames");
  gbox.innerHTML = "";
  top.forEach(g => gbox.append(gameCard(g)));

  const pbox = $("#homePlayers");
  pbox.innerHTML = "";
  najnowsze.forEach(p => pbox.append(playerCard(p)));
}
