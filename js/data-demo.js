"use strict";

/* =========================================================
   2. GENERATOR GRACZY (deterministyczny)
========================================================= */
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const R = rng(20260917);
const pick = arr => arr[Math.floor(R() * arr.length)];
const pickN = (arr, n) => {
  const c = arr.slice(), out = [];
  while (out.length < n && c.length) out.push(c.splice(Math.floor(R() * c.length), 1)[0]);
  return out;
};
const int = (a, b) => a + Math.floor(R() * (b - a + 1));

const NICK_A = ["zimny","nocny","szybki","stary","mały","cichy","dziki","leniwy","kwaśny","zły","srebrny","krzywy","pusty","ostry","miękki","łysy","gorzki","chudy","mokry","ciepły","glitch","pixel","null","turbo","mega","kartofel","beton","chrupki","kebab","mleczny"];
const NICK_B = ["Lisek","Sokol","Wilk","Kret","Jez","Bobr","Zubr","Ryjek","Kos","Borsuk","Ryba","Golab","Mysz","Kruk","Sum","Karp","Zolw","Ciapek","Kaktus","Pomidor","Ogorek","Dzik","Kanarek","Slimak","Chomik","Pingwin","Renifer","Motyl","Tygrys","Foka"];
const NICK_C = ["","","","_pl","PL","69","2137","xd","_","07","1337","ttv","yt","_gg","99","_pro","x","ez","_ogr","01"];
const REGIONS = [
  "Polska","Niemcy","Czechy","Słowacja","Ukraina","Litwa","Łotwa","Estonia",
  "Węgry","Austria","Rumunia","Bułgaria","Chorwacja","Słowenia","Serbia",
  "Francja","Hiszpania","Włochy","Portugalia","Belgia","Holandia","Szwajcaria",
  "Wielka Brytania","Irlandia","Szwecja","Norwegia","Dania","Finlandia",
  "USA","Kanada","Brazylia","Argentyna","Turcja","Rosja","Inny kraj"
];
const PLATS = ["PC","PS","XBOX","SWITCH","MOBILE"];
const PLAT_LABEL = { PC: "PC", PS: "PlayStation", XBOX: "Xbox", SWITCH: "Switch", MOBILE: "Mobile" };
const STYLES = ["Na luzie","Półkompetytywnie","Rankedy","Turnieje / esport","Tylko fabuła i co-op","Roleplay","Granie z modami","Farmienie i grind"];
const TIMES = ["Rano","Popołudniami","Wieczorami","Po północy","Weekendy","Nieregularnie"];
const TIME_BANDS = {
  "Rano": [6, 12],
  "Popołudniami": [12, 17],
  "Wieczorami": [17, 23],
  "Po północy": [22, 4],
  "Weekendy": [10, 22],
  "Nieregularnie": [0, 23]
};
function fmtHour(h) {
  const n = ((Number(h) % 24) + 24) % 24;
  return String(n).padStart(2, "0") + ":00";
}
function timeLabel(from, to) {
  if (from == null || to == null || from === "" || to === "") return "Elastycznie";
  return fmtHour(from) + "–" + fmtHour(to);
}
/** Czy przedział gracza [pFrom,pTo) nachodzi na filtr [fFrom,fTo). Obsługa przejścia przez północ. */
function hoursOverlap(pFrom, pTo, fFrom, fTo) {
  if (fFrom === "" || fFrom == null || fTo === "" || fTo == null) return true;
  if (pFrom == null || pTo == null) return true;
  const pf = Number(pFrom), pt = Number(pTo), ff = Number(fFrom), ft = Number(fTo);
  function expand(a, b) {
    const ranges = [];
    if (a === b) ranges.push([0, 24]);
    else if (a < b) ranges.push([a, b]);
    else { ranges.push([a, 24]); ranges.push([0, b]); }
    return ranges;
  }
  const pr = expand(pf, pt);
  const fr = expand(ff, ft);
  for (const [a1, a2] of pr) {
    for (const [b1, b2] of fr) {
      if (a1 < b2 && b1 < a2) return true;
    }
  }
  return false;
}
function fillHourSelect(sel, firstLabel, defaultVal) {
  if (!sel) return;
  sel.innerHTML = "";
  if (firstLabel != null) sel.appendChild(new Option(firstLabel, ""));
  for (let h = 0; h < 24; h++) sel.appendChild(new Option(fmtHour(h), String(h)));
  if (defaultVal != null && defaultVal !== "") sel.value = String(defaultVal);
}
const MICS = ["Mikrofon: tak","Mikrofon: czasem","Mikrofon: nie"];
const LANGS = ["PL","PL / EN","PL / EN / DE","PL / EN / UA"];
const TAGS = ["bez toksyczności","cierpliwy","uczę nowych","szukam stałej ekipy","gram codziennie","discord","tryb rankingowy","chill","dobry aim","gram taktycznie","lubię mody","wolne granie","gram z mamą xd","nocny marek","świeżak","weteran","gram na padzie","streamuję","bez mikrofonu też ok","lubię hardcore"];
const DESC = [
  "Szukam ekipy do {g} na stałe, nie na jeden wieczór. Gram {t}, bez spiny.",
  "Wracam do {g} po przerwie, więc nie oczekuję cudów — po prostu chcę pograć z kimś normalnym.",
  "Mam trochę godzin w {g} i mogę wytłumaczyć podstawy, jeśli ktoś dopiero zaczyna.",
  "Szukam ludzi do {g} {t}. Ważne, żeby ktoś się odzywał, reszta się ułoży.",
  "{g} solo mnie wykańcza. Szukam dwóch, trzech osób do regularnego grania.",
  "Gram w {g} głównie {t}. Bez wyzwisk po przegranej rundzie, to moje jedyne wymaganie.",
  "Chcę podbić rangę w {g}, ale spokojnie i bez presji. Szukam kogoś z podobnym podejściem.",
  "Szukam kogoś do {g} — mogę grać wsparcie, mogę prowadzić, dogadam się.",
  "Zbieram skład do {g}. Najpierw kilka wieczorów na próbę, potem zobaczymy.",
  "Nowy w {g}, uczę się szybko. Szukam kogoś, kto ogarnie mnie przez pierwsze godziny.",
  "Mam swój serwer do {g} i szukam ludzi, którzy pograją dłużej niż tydzień.",
  "{g} najlepiej smakuje w ekipie. Gram {t}, mikrofon mam, humor też."
];
const STATUSES = ["on", "on", "on", "idle", "off", "off"];

/* ---- generowana grafika (SVG w data URI, zero plików z sieci) ---- */
function hashOf(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function uri(svg) {
  return 'url("data:image/svg+xml,' + encodeURIComponent(svg).replace(/"/g, "%22") + '")';
}

/* awatar: mozaika 5x5 lustrzana, jak identikon */
function avatarArt(seedStr, shift) {
  const h = hashOf(seedStr + (shift || ""));
  const r = rng(h);
  const hue = h % 360, hue2 = (hue + 45) % 360;
  const bgA = `hsl(${hue} 52% 34%)`, bgB = `hsl(${hue2} 58% 17%)`;
  const fg = `hsl(${(hue + 20) % 360} 88% 72%)`;
  let cells = "";
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 3; x++) {
      if (r() > 0.46) {
        cells += `<rect x="${x * 12}" y="${y * 12}" width="12" height="12"/>`;
        if (x < 2) cells += `<rect x="${(4 - x) * 12}" y="${y * 12}" width="12" height="12"/>`;
      }
    }
  }
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${bgA}"/><stop offset="1" stop-color="${bgB}"/></linearGradient></defs>
<rect width="60" height="60" fill="url(#g)"/><g fill="${fg}" opacity=".92">${cells}</g></svg>`);
}

/* okładka gry: wzór zależny od gatunku, kolor od nazwy */
function coverArt(game) {
  const h = hashOf(game.name);
  const hue = h % 360, hue2 = (hue + 38) % 360;
  const a = `hsl(${hue} 58% 30%)`, b = `hsl(${hue2} 64% 13%)`;
  const ink = `hsl(${(hue + 25) % 360} 90% 72%)`;
  const g = game.genre;
  let art = "";
  const S = (s, o) => `<g stroke="${ink}" fill="none" stroke-width="2" opacity="${o || .55}">${s}</g>`;
  const F = (s, o) => `<g fill="${ink}" opacity="${o || .5}">${s}</g>`;

  if (g === "FPS" || g === "Shooter") {
    art = S(`<circle cx="180" cy="46" r="26"/><circle cx="180" cy="46" r="10"/>
      <path d="M180 8v20M180 64v20M142 46h20M198 46h20"/>`, .6)
      + F(`<path d="M0 90 40 20h18L18 90zM40 90 80 20h18L58 90z" opacity=".22"/>`, .22);
  } else if (g === "Battle Royale") {
    art = S(`<circle cx="120" cy="45" r="14"/><circle cx="120" cy="45" r="30"/><circle cx="120" cy="45" r="46"/>
      <path d="M120 0v12M120 78v12"/>`, .5);
  } else if (g === "Survival" || g === "Sandbox") {
    art = F(`<path d="M30 78 56 26l26 52zM96 78l22-42 22 42zM156 78l30-56 30 56z" opacity=".35"/>`)
      + S(`<path d="M0 78h240"/>`, .5);
  } else if (g === "MOBA") {
    art = S(`<path d="M-10 90 90 -6M50 96 150 0M110 96 210 0"/><circle cx="120" cy="45" r="9"/>`, .5);
  } else if (g === "MMO" || g === "RPG" || g === "RPG akcji") {
    art = S(`<path d="M120 10l40 14v26c0 22-22 34-40 40-18-6-40-18-40-40V24z"/>
      <path d="M120 28v44M104 48h32"/>`, .55);
  } else if (g === "Wyścigi") {
    art = S(`<path d="M10 24h110M30 44h130M0 64h96M130 64h80"/>`, .6)
      + F(`<path d="M170 14l60 0-22 62h-60z" opacity=".2"/>`, .2);
  } else if (g === "Sportowa") {
    art = S(`<rect x="12" y="12" width="216" height="66" rx="4"/><path d="M120 12v66"/>
      <circle cx="120" cy="45" r="16"/><path d="M12 30h26v30H12M228 30h-26v30h26"/>`, .5);
  } else if (g === "Bijatyka") {
    art = S(`<path d="M30 14l80 62M110 14l-80 62M130 14l80 62M210 14l-80 62"/>`, .5);
  } else if (g === "Horror") {
    art = F(`<path d="M0 0h240v18c-14 0-14 26-28 26s-14-18-28-18-14 30-28 30-14-24-28-24-14 20-28 20-14-26-28-26-14 14-28 14-14-12-28-12z" opacity=".3"/>`)
      + S(`<circle cx="98" cy="58" r="6"/><circle cx="142" cy="58" r="6"/>`, .6);
  } else if (g === "Imprezowa") {
    let d = "";
    const rr = rng(h);
    for (let i = 0; i < 26; i++) d += `<circle cx="${(rr() * 240).toFixed(0)}" cy="${(rr() * 90).toFixed(0)}" r="${(2 + rr() * 5).toFixed(1)}"/>`;
    art = F(d, .45);
  } else if (g === "Strategia") {
    art = S(`<path d="M20 45l16-28h32l16 28-16 28H36zM104 45l16-28h32l16 28-16 28h-32zM188 45l16-28h32l16 28-16 28h-32z"/>`, .45);
  } else if (g === "Symulacja") {
    art = S(`<path d="M60 70a44 44 0 0 1 88 0"/><path d="M104 66l34-28"/><circle cx="104" cy="70" r="5"/>
      <path d="M176 70a34 34 0 0 1 56-26"/>`, .55);
  } else if (g === "Karcianka") {
    art = S(`<rect x="60" y="18" width="46" height="62" rx="6" transform="rotate(-12 83 49)"/>
      <rect x="96" y="14" width="46" height="62" rx="6"/>
      <rect x="132" y="18" width="46" height="62" rx="6" transform="rotate(12 155 49)"/>`, .5);
  } else {
    art = S(`<path d="M20 78l34-58 34 58M100 78l34-58 34 58M180 78l34-58"/>`, .45);
  }

  return uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 90" preserveAspectRatio="none">
<defs><linearGradient id="c" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
<rect width="240" height="90" fill="url(#c)"/>${art}
<rect width="240" height="90" fill="url(#c)" opacity=".12"/></svg>`);
}

const gamePool = [];
GAMES.forEach(g => { for (let i = 0; i < g.pop * g.pop; i++) gamePool.push(g); });

const usedNicks = new Set();
function makeNick() {
  for (let i = 0; i < 40; i++) {
    const n = pick(NICK_A) + pick(NICK_B) + pick(NICK_C);
    if (!usedNicks.has(n)) { usedNicks.add(n); return n; }
  }
  return pick(NICK_A) + pick(NICK_B) + int(100, 999);
}

const HOUR = 3600000;
const PLAYERS = [];
for (let i = 0; i < 720; i++) {
  const game = pick(gamePool);
  const plat = pick(game.plats);
  const nick = makeNick();
  const style = pick(STYLES);
  const time = pick(TIMES);
  const band = TIME_BANDS[time] || [17, 23];
  let hourFrom = band[0], hourTo = band[1];
  // lekkie losowe przesunięcie w obrębie pasma
  if (hourFrom < hourTo && hourTo - hourFrom >= 3) {
    hourFrom = hourFrom + int(0, Math.min(2, hourTo - hourFrom - 1));
    hourTo = hourTo - int(0, Math.min(2, hourTo - hourFrom - 1));
  }
  const tLab = timeLabel(hourFrom, hourTo);
  PLAYERS.push({
    id: "gen" + i,
    nick,
    age: int(15, 41),
    region: R() < 0.55 ? "Polska" : R() < 0.75 ? pick(REGIONS.slice(0, 15)) : pick(REGIONS),
    game: game.name,
    gameId: game.id,
    plat,
    style,
    time: tLab,
    hourFrom,
    hourTo,
    mic: R() < 0.72 ? MICS[0] : pick(MICS),
    lang: pick(LANGS),
    hours: int(12, 3600),
    rating: (3.4 + R() * 1.6).toFixed(1),
    status: pick(STATUSES),
    prem: R() < 0.09,
    rank: pick(["beginner", "mid", "mid", "mid", "high", "high", "pro"]),
    days: R() < 0.45 ? pickN(["mon","tue","wed","thu","fri","sat","sun"], int(1, 4)) : [],
    tags: pickN(TAGS, int(2, 4)),
    desc: pick(DESC).replace("{g}", game.name).replace("{t}", tLab),
    added: Date.now() - Math.floor(R() * 340 * HOUR),
    mine: false
  });
}

/* ---- ekipy ---- */
const TEAM_A = ["Nocna","Dzika","Zimna","Ostatnia","Cicha","Krzywa","Wolna","Ciepła","Twarda","Leniwa","Głodna","Mokra"];
const TEAM_B = ["Zmiana","Ekipa","Zgraja","Banda","Drużyna","Kompania","Załoga","Piwnica","Kanapa","Szopa","Brygada","Paczka"];
const TEAMS = [];
for (let i = 0; i < 80; i++) {
  const game = pick(gamePool);
  const size = pick([3, 4, 5, 5, 6, 8, 10]);
  const filled = int(1, size - 1);
  TEAMS.push({
    id: i,
    name: pick(TEAM_A) + " " + pick(TEAM_B),
    game: game.name,
    gameId: game.id,
    size, filled,
    region: R() < 0.5 ? "Polska" : pick(REGIONS),
    style: pick(STYLES),
    time: pick(TIMES),
    minAge: pick([0, 16, 18, 18, 21]),
    desc: pick([
      "Gramy {t}, szukamy {n} osób na stałe. Discord obowiązkowo, mikrofon też.",
      "Ekipa istnieje od kilku miesięcy, brakuje nam {n} osób do pełnego składu.",
      "Zbieramy skład na sezon. {n} wolnych miejsc, próbne granie w weekend.",
      "Szukamy {n} osób, które po prostu lubią pograć {t}. Zero dramy."
    ]).replace("{t}", pick(TIMES).toLowerCase()),
    added: Date.now() - Math.floor(R() * 400 * HOUR)
  });
  TEAMS[i].desc = TEAMS[i].desc.replace("{n}", size - filled);
}

/* ---- live streamy (demo) ---- */
const LIVE_TITLES = [
  "Szukam duo ranked — bez toksyczności",
  "Gram chill, wpadaj na voice",
  "Ostatni slot do 5-stacka",
  "Nocny grind, mikrofon on",
  "Uczę nowych — spokojnie",
  "Turniejowa rozgrzewka, 2 miejsca",
  "SoloQ piekło — ratunku",
  "Customki z ekipą, open lobby"
];
const LIVES = [];
for (let i = 0; i < 36; i++) {
  const p = PLAYERS[int(0, PLAYERS.length - 1)];
  const game = GAMES.find(g => g.name === p.game) || GAMES[0];
  LIVES.push({
    id: "live" + i,
    nick: p.nick,
    playerId: p.id,
    game: p.game,
    title: pick(LIVE_TITLES),
    viewers: int(3, 420),
    started: Date.now() - int(2, 180) * 60000,
    region: p.region,
    plat: p.plat,
    thumb: coverArt(game),
    premiumOnly: R() < 0.55
  });
}

const LIVE_TICKET_COST = 35;

