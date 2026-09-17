"use strict";

/* =========================================================
   GIVEAWAYE — demo losowania (akwizycja / retencja)
========================================================= */
const GIVEAWAYS = [
  {
    id: "gw1",
    title: "Nitro 1 miesiąc",
    titleEn: "Nitro 1 month",
    prize: "Discord Nitro",
    desc: "Weź udział: konto BigWW + aktywne ogłoszenie albo Premium.",
    descEn: "Enter with a BigWW account plus an active listing or Premium.",
    ends: Date.now() + 5 * 24 * 3600000,
    entries: 1284,
    costWW: 0,
    premiumBoost: true,
    status: "open"
  },
  {
    id: "gw2",
    title: "7 dni BigWW Premium",
    titleEn: "7 days BigWW Premium",
    prize: "Premium",
    desc: "Darmowy bilet raz dziennie. Dodatkowy bilet: 15 WW.",
    descEn: "One free ticket per day. Extra ticket: 15 WW.",
    ends: Date.now() + 2 * 24 * 3600000,
    entries: 856,
    costWW: 15,
    premiumBoost: true,
    status: "open"
  },
  {
    id: "gw3",
    title: "Klucz Steam (do 50 zł)",
    titleEn: "Steam key (up to ~12 EUR)",
    prize: "Steam",
    desc: "Losowanie partnerskie — wynik w historii po zakończeniu.",
    descEn: "Partner draw — winner appears in history when it ends.",
    ends: Date.now() + 9 * 24 * 3600000,
    entries: 2103,
    costWW: 25,
    premiumBoost: false,
    status: "open"
  },
  {
    id: "gw4",
    title: "Skin CS2 (niski tier)",
    titleEn: "CS2 skin (low tier)",
    prize: "CS2",
    desc: "Zakończone — przykładowy wpis historii.",
    descEn: "Ended — sample history entry.",
    ends: Date.now() - 2 * 24 * 3600000,
    entries: 3401,
    costWW: 0,
    premiumBoost: false,
    status: "ended",
    winner: "zimnyLisek"
  }
];

function gwEntriesKey() {
  return "bigww_gw_entries";
}
function loadGwEntries() {
  try {
    return JSON.parse(localStorage.getItem(gwEntriesKey()) || "{}") || {};
  } catch (e) {
    return {};
  }
}
function saveGwEntries(m) {
  localStorage.setItem(gwEntriesKey(), JSON.stringify(m));
}
function gwDayKey(id) {
  const d = new Date();
  return id + "_" + d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}

function formatGwEnds(ts) {
  if (ts < Date.now()) return (typeof LANG !== "undefined" && LANG === "en") ? "Ended" : "Zakończone";
  const left = ts - Date.now();
  const h = Math.floor(left / 3600000);
  if (h < 48) return (LANG === "en" ? "Ends in " : "Koniec za ") + h + " h";
  const d = Math.ceil(h / 24);
  return (LANG === "en" ? "Ends in " : "Koniec za ") + d + (LANG === "en" ? " days" : " dni");
}

function renderGiveaways() {
  const box = document.getElementById("giveawayList");
  const hist = document.getElementById("giveawayHistory");
  if (!box) return;
  const entries = loadGwEntries();
  const en = typeof LANG !== "undefined" && LANG === "en";

  box.innerHTML = "";
  hist && (hist.innerHTML = "");

  const open = GIVEAWAYS.filter(g => g.status === "open");
  const ended = GIVEAWAYS.filter(g => g.status === "ended");

  const countEl = document.getElementById("gwCount");
  if (countEl) countEl.textContent = open.length + (en ? " active" : " aktywne");

  open.forEach(g => {
    const mine = entries[g.id] || 0;
    const card = document.createElement("article");
    card.className = "card gw-card";
    const title = en ? g.titleEn : g.title;
    const desc = en ? g.descEn : g.desc;
    card.innerHTML =
      '<div class="gw-top">' +
        '<span class="gw-prize">' + g.prize + "</span>" +
        '<span class="gw-ends">' + formatGwEnds(g.ends) + "</span>" +
      "</div>" +
      "<h3>" + title + "</h3>" +
      '<p class="note">' + desc + "</p>" +
      '<div class="gw-meta">' +
        "<span>" + (en ? "Entries" : "Zgłoszenia") + ": <b>" + (typeof nf === "function" ? nf(g.entries + mine) : g.entries + mine) + "</b></span>" +
        "<span>" + (en ? "Your tickets" : "Twoje bilety") + ": <b>" + mine + "</b></span>" +
      "</div>" +
      '<div class="gw-actions"></div>';
    const actions = card.querySelector(".gw-actions");
    const btn = document.createElement("button");
    btn.className = "btn pri sm";
    if (g.costWW > 0) {
      btn.textContent = (en ? "Extra ticket · " : "Dodatkowy bilet · ") + g.costWW + " WW";
    } else {
      btn.textContent = en ? "Free ticket" : "Darmowy bilet";
    }
    btn.onclick = () => enterGiveaway(g);
    actions.appendChild(btn);
    if (g.premiumBoost) {
      const tip = document.createElement("span");
      tip.className = "note";
      tip.textContent = en ? "Premium: 2× ticket weight" : "Premium: 2× waga biletu";
      actions.appendChild(tip);
    }
    box.appendChild(card);
  });

  if (!open.length) {
    box.innerHTML = '<div class="empty"><h3>' + (en ? "No active giveaways" : "Brak aktywnych giveawayów") + "</h3></div>";
  }

  if (hist) {
    ended.forEach(g => {
      const row = document.createElement("div");
      row.className = "gw-hist";
      row.innerHTML =
        "<div><b>" + (en ? g.titleEn : g.title) + "</b>" +
        '<div class="note">' + (en ? "Winner" : "Zwycięzca") + ": " + (g.winner || "—") + "</div></div>" +
        '<span class="note">' + (en ? "Ended" : "Zakończone") + "</span>";
      hist.appendChild(row);
    });
    if (!ended.length) {
      hist.innerHTML = '<p class="note">' + (en ? "No finished draws yet." : "Brak zakończonych losowań.") + "</p>";
    }
  }
}

function enterGiveaway(g) {
  if (typeof requireLogin === "function" && !requireLogin(
    (typeof LANG !== "undefined" && LANG === "en") ? "enter the giveaway" : "wziąć udział w giveawayu"
  )) return;

  const entries = loadGwEntries();
  const day = gwDayKey(g.id);
  const dayMap = loadGwDay();

  if (g.costWW <= 0) {
    if (dayMap[day]) {
      toast(LANG === "en" ? "Free ticket already used today" : "Darmowy bilet już wykorzystany dziś");
      return;
    }
    dayMap[day] = 1;
    saveGwDay(dayMap);
  } else {
    if (typeof COINS === "undefined" || COINS.bal < g.costWW) {
      toast(LANG === "en" ? "Not enough WW" : "Za mało monet WW");
      if (typeof go === "function") go("shop");
      return;
    }
    if (typeof addCoins === "function") addCoins(-g.costWW, (LANG === "en" ? "Giveaway ticket" : "Bilet giveaway"));
    else {
      COINS.bal -= g.costWW;
      if (typeof save === "function" && typeof KEY !== "undefined") save(KEY.coins, COINS);
      if (typeof updateCoinUI === "function") updateCoinUI();
    }
  }

  let tickets = 1;
  if (g.premiumBoost && typeof isPrem === "function" && isPrem()) tickets = 2;
  entries[g.id] = (entries[g.id] || 0) + tickets;
  saveGwEntries(entries);
  toast(LANG === "en"
    ? ("+" + tickets + " ticket(s) — good luck!")
    : ("+" + tickets + " bilet(y) — powodzenia!"));
  renderGiveaways();
}

function loadGwDay() {
  try { return JSON.parse(localStorage.getItem("bigww_gw_day") || "{}") || {}; }
  catch (e) { return {}; }
}
function saveGwDay(m) {
  localStorage.setItem("bigww_gw_day", JSON.stringify(m));
}
