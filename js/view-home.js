"use strict";

/* BigWW - Widok: strona startowa i statystyki */

/* =========================================================
   11. START / STATYSTYKI
========================================================= */
function renderHome() {
  const online = allPlayers().filter(p => p.status === "on").length;
  $("#onlineNow").textContent = nf(online);

  const stats = [
    [nf(allPlayers().length), "aktywnych ogłoszeń"],
    [nf(GAMES.length), "gier w bazie"],
    [TEAMS.length, "ekip szuka składu"],
    [nf(allPlayers().filter(p => Date.now() - p.added < 24 * HOUR).length), "ogłoszeń z ostatniej doby"]
  ];
  const box = $("#homeStats");
  box.innerHTML = "";
  stats.forEach(([n, l]) => {
    const s = el("div", "stat");
    s.append(el("div", "stat-num", String(n)), el("div", "stat-lab", l));
    box.append(s);
  });

  const top = GAMES.slice().sort((a, b) => countFor(b.name) - countFor(a.name)).slice(0, 10);
  const gbox = $("#homeGames");
  gbox.innerHTML = "";
  top.forEach(g => gbox.append(gameCard(g)));

  const pbox = $("#homePlayers");
  pbox.innerHTML = "";
  allPlayers().slice().sort((a, b) => b.added - a.added).slice(0, 6).forEach(p => pbox.append(playerCard(p)));
}
