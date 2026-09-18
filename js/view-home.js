"use strict";

/* =========================================================
   11. START / STATYSTYKI
========================================================= */
function renderHome() {
  const online = allPlayers().filter(p => p.status === "on").length;
  $("#onlineNow").textContent = nf(online);
  const onlineLab = document.getElementById("onlineNowLab");
  if (onlineLab) onlineLab.textContent = t("home.online");

  const stats = [
    [nf(allPlayers().length), t("home.statAds")],
    [nf(GAMES.length), t("home.statGames")],
    [TEAMS.length, t("home.statTeams")],
    [nf(allPlayers().filter(p => Date.now() - p.added < 24 * HOUR).length), t("home.statDay")]
  ];
  const box = $("#homeStats");
  box.innerHTML = "";
  stats.forEach(([n, l]) => {
    const s = el("div", "stat");
    s.append(el("div", "stat-num", String(n)), el("div", "stat-lab", l));
    box.append(s);
  });

  // Najpierw popularność gry, dopiero potem liczba ogłoszeń — inaczej przy
  // pustej bazie na górze lądują przypadkowe tytuły z zerem ogłoszeń.
  const top = GAMES.slice().sort((a, b) => (b.pop - a.pop) || (countFor(b.name) - countFor(a.name))).slice(0, 10);

  // Trzy pierwsze jeszcze raz, w większym pasku nad siatką.
  let feat = $("#homeFeatured");
  if (!feat && gbox && gbox.parentNode) {
    feat = el("div", "featured-rail");
    feat.id = "homeFeatured";
    gbox.parentNode.insertBefore(feat, gbox);
  }
  if (feat) {
    feat.innerHTML = "";
    top.slice(0, 3).forEach(g => feat.append(gameCard(g, { featured: true })));
  }
  const gbox = $("#homeGames");
  gbox.innerHTML = "";
  top.forEach(g => gbox.append(gameCard(g)));

  const pbox = $("#homePlayers");
  pbox.innerHTML = "";
  allPlayers().slice().sort((a, b) => b.added - a.added).slice(0, 6).forEach(p => pbox.append(playerCard(p)));
}

