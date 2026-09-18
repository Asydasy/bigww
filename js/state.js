"use strict";

/* =========================================================
   3. PAMIĘĆ LOKALNA
========================================================= */
const KEY = {
  mine: "bigww_mine_v2", saved: "bigww_saved_v2", pref: "bigww_pref_v2",
  prem: "bigww_premium_v2", coins: "bigww_coins_v2", ref: "bigww_ref_v2",
  boosts: "bigww_boosts_v2", adlog: "bigww_adlog_v2", msg: "bigww_msg_v2",
  bp: "bigww_bp_v2", quests: "bigww_quests_v2", unlocks: "bigww_unlocks_v2",
  navcount: "bigww_nav_v2",
  users: "bigww_users_v2", session: "bigww_session_v2",
  blocked: "bigww_blocked_v2", reports: "bigww_reports_v2",
  inbox: "bigww_inbox_v2", notifs: "bigww_notifs_v2", ratings: "bigww_ratings_v2",
  presets: "bigww_presets_v2"
};
const SCOPED_KEYS = new Set([
  KEY.mine, KEY.saved, KEY.pref, KEY.prem, KEY.coins, KEY.ref, KEY.boosts,
  KEY.adlog, KEY.msg, KEY.bp, KEY.quests, KEY.unlocks, KEY.navcount,
  KEY.blocked, KEY.reports, KEY.inbox, KEY.notifs, KEY.ratings,
  KEY.presets
]);
const LOOKING_TTL_MS = 2 * 3600000;
const RANK_LABEL = { beginner: "Początkujący", mid: "Średni", high: "Wysoki", pro: "Pro / turnieje" };
const WEEK_DAYS = [
  { id: "mon", label: "Pn" }, { id: "tue", label: "Wt" }, { id: "wed", label: "Śr" },
  { id: "thu", label: "Cz" }, { id: "fri", label: "Pt" }, { id: "sat", label: "So" }, { id: "sun", label: "Nd" }
];
const WEEK_LABEL = { mon: "Poniedziałek", tue: "Wtorek", wed: "Środa", thu: "Czwartek", fri: "Piątek", sat: "Sobota", sun: "Niedziela" };
const AD_TEMPLATES = [
  { id: "ranked", label: "Rankedy", text: "Szukam stałego duo/trio do rankedów. Gram spokojnie, bez spiny, mikrofon włączony. Wieczorami." },
  { id: "chill", label: "Chill", text: "Szukam ekipy na luzie — bez presji, bez toksyczności. Możemy grać casual albo co-op." },
  { id: "learn", label: "Uczę się", text: "Dopiero wdrażam się w grę. Szukam kogoś cierpliwego, kto podpowie podstawy na voice." },
  { id: "night", label: "Nocny grind", text: "Gram po północy. Szukam 1–2 osób na dłuższe sesje, bez pośpiechu." },
  { id: "team", label: "Stała ekipa", text: "Zbieram stały skład na sezon. Najpierw kilka wieczorów na próbę, potem decyzja." }
];

function rawLoad(k, fb) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
function rawSave(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

let USERS = rawLoad(KEY.users, []);
let SESSION = rawLoad(KEY.session, null); // { userId, nick, loggedAt }

/** Dane lokalne (monety, skrzynka, powiadomienia) trzymamy osobno dla każdego
 *  konta. W trybie serwerowym kontem jest to z bazy, w lokalnym — SESSION. */
function scopeSuffix() {
  if (typeof DATA !== "undefined" && DATA.isApi) {
    return DATA.user ? "_u_" + DATA.user.id : "_guest";
  }
  return (SESSION && SESSION.userId) ? ("_u_" + SESSION.userId) : "_guest";
}
function resolveKey(k) {
  return SCOPED_KEYS.has(k) ? (k + scopeSuffix()) : k;
}
function load(k, fb) { return rawLoad(resolveKey(k), fb); }
function save(k, v) { rawSave(resolveKey(k), v); }

async function hashPass(pass, salt) {
  const raw = (salt || "") + "::" + pass + "::bigww";
  if (window.crypto && crypto.subtle) {
    try {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
    } catch (e) {}
  }
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) { h ^= raw.charCodeAt(i); h = Math.imul(h, 16777619); }
  return "f" + ((h >>> 0).toString(16));
}
function genSalt() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < 12; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
function isLoggedIn() {
  if (typeof DATA !== "undefined" && DATA.isApi) return !!DATA.user;
  return !!(SESSION && SESSION.userId);
}
function currentUser() {
  if (typeof DATA !== "undefined" && DATA.isApi) {
    const u = DATA.user;
    if (!u) return null;
    // Konto z bazy podane w kształcie, którego oczekuje reszta frontu.
    return {
      id: u.id,
      nick: u.displayName,
      email: u.email || "",
      emailVerified: true,
      provider: u.discordTag ? "discord" : null,
      discordTag: u.discordTag || null,
      created: u.createdAt ? new Date(u.createdAt).getTime() : Date.now()
    };
  }
  if (!SESSION) return null;
  return USERS.find(u => u.id === SESSION.userId) || null;
}
function genRefCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c = "BIG-";
  for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

/* migracja starych globalnych danych → gość (raz) */
(function migrateLegacy() {
  if (localStorage.getItem("bigww_migrated_v3")) return;
  SCOPED_KEYS.forEach(base => {
    const v = rawLoad(base, null);
    if (v != null) rawSave(base + "_guest", v);
  });
  localStorage.setItem("bigww_migrated_v3", "1");
})();

function loadUserData() {
  MINE = load(KEY.mine, []);
  SAVED = load(KEY.saved, []);
  PREF = load(KEY.pref, { theme: "dark", region: "Polska", avaShift: "", looking: false, filters: null, onboarded: false, lang: "pl" });
  if (PREF.region === "Polska — cała" || /^(Mazowieckie|Śląskie|Wielkopolskie|Małopolskie|Dolnośląskie|Pomorskie)/.test(PREF.region || "")) PREF.region = "Polska";
  if (PREF.avaShift === undefined) PREF.avaShift = "";
  if (PREF.looking === undefined) PREF.looking = false;
  if (PREF.onboarded === undefined) PREF.onboarded = false;
  if (PREF.filters === undefined) PREF.filters = null;
  if (PREF.lang !== "en" && PREF.lang !== "pl") PREF.lang = "pl";
  if (PREF.fx !== "off") PREF.fx = "max";
  if (PREF.music !== "on") PREF.music = "off";
  if (typeof PREF.musicVol !== "number") PREF.musicVol = 0.6;
  LANG = PREF.lang || "pl";
  PREM = load(KEY.prem, { active: false, plan: null, until: 0, since: 0 });
  COINS = load(KEY.coins, { bal: 40, earned: 0, spent: 0 });
  REF = load(KEY.ref, { code: "", used: [], count: 0, earned: 0, applied: false });
  BOOSTS = load(KEY.boosts, {});
  ADLOG = load(KEY.adlog, { lastWatch: 0, daily: 0, day: "" });
  MSG = load(KEY.msg, { day: "", used: 0 });
  BP = load(KEY.bp, { level: 1, xp: 0, claimed: [] });
  QUESTS = load(KEY.quests, { day: "", done: {} });
  UNLOCKS = load(KEY.unlocks, []);
  NAVCOUNT = load(KEY.navcount, 0);
  BLOCKED = load(KEY.blocked, []);
  REPORTS = load(KEY.reports, []);
  INBOX = load(KEY.inbox, []);
  NOTIFS = load(KEY.notifs, []);
  RATINGS = load(KEY.ratings, {});
  PRESETS = load(KEY.presets, []);
  if (!REF.code) { REF.code = genRefCode(); save(KEY.ref, REF); }
  // TTL „szukam teraz”
  if (PREF.looking && PREF.lookingUntil && PREF.lookingUntil < Date.now()) {
    PREF.looking = false;
    PREF.lookingUntil = 0;
    save(KEY.pref, PREF);
  }
}

let MINE, SAVED, PREF, PREM, COINS, REF, BOOSTS, ADLOG, MSG, BP, QUESTS, UNLOCKS, NAVCOUNT;
let BLOCKED, REPORTS, INBOX, NOTIFS, RATINGS, PRESETS;

/* Sprzątanie po automatycznym koncie gościa.
 *
 * Wcześniejsza wersja zakładała przy starcie konto `guest_…` i zapisywała je
 * do `bigww_users_v2` razem z sesją. Efekt: strona pokazywała zalogowanego,
 * którego nie dało się wylogować, bo po odświeżeniu zakładała go od nowa.
 * Automat wyleciał, ale komuś, kto go już złapał, siedzi w przeglądarce —
 * to poniżej czyści ten stan raz i na zawsze. Nie dotyka kont prawdziwych. */
(function usunKontaGoscia() {
  if (SESSION && typeof SESSION.userId === "string" && SESSION.userId.indexOf("guest_") === 0) {
    SESSION = null;
    rawSave(KEY.session, null);
  }
  if (Array.isArray(USERS) && USERS.some(u => u && typeof u.id === "string" && u.id.indexOf("guest_") === 0)) {
    USERS = USERS.filter(u => !(u && typeof u.id === "string" && u.id.indexOf("guest_") === 0));
    rawSave(KEY.users, USERS);
  }
})();

// Dopiero teraz — scopeSuffix() czyta SESSION, więc dane muszą wczytać się już
// po wyrzuceniu gościa, inaczej wylądowałyby pod jego przyrostkiem.
loadUserData();
let pickedDays = [];
let currentProfileId = null;
let pendingMedia = { clipUrl: "", fileData: null, fileType: "" }; // form media

/* ---- powiadomienia, blokady, wiadomości, dopasowanie ---- */
function pushNotif(title, body, link) {
  NOTIFS.unshift({ id: "n" + Date.now() + Math.random().toString(36).slice(2, 6), title, body, link: link || "", ts: Date.now(), read: false });
  if (NOTIFS.length > 50) NOTIFS = NOTIFS.slice(0, 50);
  save(KEY.notifs, NOTIFS);
  updateNotifUI();
}
function updateNotifUI() {
  const unread = NOTIFS.filter(n => !n.read).length;
  const badge = $("#notifBadge");
  if (badge) {
    badge.textContent = unread > 9 ? "9+" : String(unread);
    badge.classList.toggle("on", unread > 0);
  }
  const list = $("#notifList");
  if (!list) return;
  list.innerHTML = "";
  if (!NOTIFS.length) {
    list.innerHTML = '<p class="note" style="padding:14px">Brak powiadomień.</p>';
    return;
  }
  NOTIFS.slice(0, 20).forEach(n => {
    const d = el("div", "notif-item" + (n.read ? "" : " unread"));
    d.innerHTML = `<div class="nt">${n.title}</div><div class="nt" style="color:var(--txt-dim)">${n.body || ""}</div><div class="nd">${ago(n.ts)}</div>`;
    d.onclick = () => {
      n.read = true;
      save(KEY.notifs, NOTIFS);
      updateNotifUI();
      if (n.link) go(n.link);
      $("#notifPanel")?.classList.remove("on");
    };
    list.append(d);
  });
}
function isBlocked(id) { return BLOCKED.includes(id); }
function blockPlayer(id, nick) {
  if (!BLOCKED.includes(id)) {
    BLOCKED.push(id);
    save(KEY.blocked, BLOCKED);
    pushNotif("Zablokowano", nick + " nie będzie widoczny na listach.", "players");
    toast("Zablokowano " + nick);
    renderPlayers(true);
    renderSaved();
  }
}
function reportPlayer(p) {
  openModal(`<h3 style="margin-bottom:8px">Zgłoś gracza</h3>
    <p class="note">${p.nick} · ${p.game}</p>
    <div class="field" style="margin-top:12px"><label>Powód</label>
      <select id="repReason">
        <option>Toksyczność / nękanie</option>
        <option>Spam / reklama</option>
        <option>Fałszywe dane</option>
        <option>Treści niedozwolone</option>
        <option>Inne</option>
      </select></div>
    <div class="field"><label>Opis (opcjonalnie)</label><textarea id="repDesc" maxlength="200" placeholder="Krótko opisz sytuację"></textarea></div>
    <button class="btn pri" id="repSend" style="margin-top:12px">Wyślij zgłoszenie</button>`);
  $("#repSend").onclick = () => {
    REPORTS.push({ id: "r" + Date.now(), targetId: p.id, nick: p.nick, reason: $("#repReason").value, desc: ($("#repDesc").value || "").trim(), ts: Date.now() });
    save(KEY.reports, REPORTS);
    pushNotif("Zgłoszenie wysłane", "Dziękujemy. Moderacja (lokalna) odnotowała zgłoszenie wobec " + p.nick + ".", "settings");
    $("#modal").classList.remove("on");
    toast("Zgłoszenie zapisane lokalnie");
  };
}
function matchScore(p) {
  let s = 0;
  const favGame = PREF.filters && PREF.filters.game;
  const region = PREF.region || "Polska";
  if (favGame && p.game === favGame) s += 35;
  else if ($("#fGame") && $("#fGame").value && p.game === $("#fGame").value) s += 35;
  if (p.region === region) s += 20;
  if (p.status === "on") s += 15;
  if (p.mic === "Mikrofon: tak") s += 10;
  if (PREF.filters && PREF.filters.style && p.style === PREF.filters.style) s += 10;
  if (p.lang && String(p.lang).startsWith("PL")) s += 5;
  if (p.rank === "mid" || p.rank === "high") s += 5;
  // overlap hours with evening default if no filter
  const tf = $("#fTimeFrom") ? $("#fTimeFrom").value : "";
  const tt = $("#fTimeTo") ? $("#fTimeTo").value : "";
  if (tf !== "" || tt !== "") {
    if (hoursOverlap(p.hourFrom, p.hourTo, tf === "" ? 0 : tf, tt === "" ? 23 : tt)) s += 10;
  } else if (hoursOverlap(p.hourFrom, p.hourTo, 17, 23)) s += 5;
  return Math.min(99, s);
}
/* ---- prywatna skrzynka ----
 *
 * Wątki trzyma `DM_THREADS`, wypełniane przez `DATA.dmThreads()`: w trybie
 * serwerowym z bazy, bez backendu ze starej skrzynki w localStorage. Widoki
 * nie wiedzą, skąd to przyszło.
 *
 * Wszystko, co napisał ktoś inny — nick i treść — wchodzi na stronę przez
 * `textContent`. To nie jest kosmetyka: od kiedy wiadomości chodzą przez
 * serwer, `innerHTML` w tym miejscu byłby XSS-em działającym na cudzym koncie.
 */
let DM_THREADS = [];

function inboxUnreadCount() {
  return DM_THREADS.reduce((n, t) => n + (Number(t.unread) || 0), 0);
}

async function refreshInbox() {
  if (!isLoggedIn()) { DM_THREADS = []; updateBadges(); return; }
  try {
    DM_THREADS = await DATA.dmThreads();
  } catch (e) {
    DM_THREADS = [];
  }
  updateBadges();
  renderInbox();
}

/** @param cel { adId } — piszę z karty ogłoszenia, albo { userId } — odpowiadam
 *  komuś, z kim wątek już istnieje. Zawsze plus `nick` do podpisu okienka. */
async function sendInboxMessage(cel, text) {
  if (!requireLogin("wysłać wiadomość")) return false;
  text = String(text || "").trim();
  if (!text) return false;
  try {
    await DATA.dmSend(cel, text);
  } catch (e) {
    toast((e && e.message) || "Nie udało się wysłać wiadomości");
    return false;
  }
  await refreshInbox();
  return true;
}

function openInboxThread(thread) {
  openModal(`<h3 style="margin-bottom:8px" id="inboxWith"></h3>
    <div style="max-height:280px;overflow:auto" id="inboxMsgs"></div>
    <div class="field" style="margin-top:12px"><textarea id="inboxReply" maxlength="400" placeholder="Napisz odpowiedź…"></textarea></div>
    <button class="btn pri" id="inboxSend" style="margin-top:8px">Wyślij</button>`);

  $("#inboxWith").textContent = thread.withNick;
  const box = $("#inboxMsgs");
  const msgs = thread.messages || [];
  if (!msgs.length) {
    box.append(el("p", "note", "Brak wiadomości"));
  } else {
    msgs.forEach(m => {
      const row = el("div");
      row.style.cssText = "margin:8px 0;padding:10px;border-radius:10px;background:var(--bg2)";
      row.append(el("b", null, m.fromNick), el("div", "note", ago(m.ts)));
      const p = el("p");
      p.style.marginTop = "6px";
      p.textContent = m.text;
      row.append(p);
      box.append(row);
    });
  }
  box.scrollTop = box.scrollHeight;
  DATA.dmMarkRead(thread.id).catch(() => {});

  $("#inboxSend").onclick = async () => {
    const text = ($("#inboxReply").value || "").trim();
    if (text.length < 2) return toast("Wpisz wiadomość");
    if (await sendInboxMessage({ userId: thread.withId, nick: thread.withNick }, text)) {
      $("#modal").classList.remove("on");
      toast("Wysłano");
    }
  };
}

function renderInbox() {
  const box = $("#inboxList");
  if (!box) return;
  box.innerHTML = "";
  if (!DM_THREADS.length) {
    const empty = el("div", "empty");
    empty.append(
      el("h3", null, "Pusta skrzynka"),
      el("p", null, "Napisz do gracza z karty — rozmowa pojawi się tutaj i w pływającym okienku.")
    );
    box.append(empty);
    return;
  }
  DM_THREADS.slice().sort((a, b) => (b.updated || 0) - (a.updated || 0)).forEach(t => {
    const last = (t.messages || [])[t.messages.length - 1];
    const row = el("div", "inbox-thread" + (t.unread ? " unread" : ""));
    row.append(el("b", null, t.withNick));
    const note = el("div", "note");
    note.textContent = (last ? last.text.slice(0, 80) : "") + (last ? " · " + ago(last.ts) : "");
    row.append(note);
    row.onclick = () => openInboxThread(t);
    box.append(row);
  });
}
function ratePlayer(p) {
  openModal(`<h3 style="margin-bottom:8px">Oceń: ${p.nick}</h3>
    <p class="note">Ocena zapisze się lokalnie i wpłynie na sortowanie „ocena”.</p>
    <div style="display:flex;gap:8px;margin:16px 0;flex-wrap:wrap" id="rateStars"></div>
    <button class="btn pri" id="rateSave" disabled>Zapisz ocenę</button>`);
  let val = 0;
  const box = $("#rateStars");
  for (let i = 1; i <= 5; i++) {
    const b = el("button", "btn sm", "★ " + i);
    b.onclick = () => {
      val = i;
      box.querySelectorAll("button").forEach((x, j) => x.classList.toggle("pri", j < i));
      $("#rateSave").disabled = false;
    };
    box.append(b);
  }
  $("#rateSave").onclick = () => {
    RATINGS[p.id] = { score: val, ts: Date.now() };
    save(KEY.ratings, RATINGS);
    // blend into display rating for gen players
    const num = Number(p.rating) || 4;
    p.rating = ((num + val) / 2).toFixed(1);
    pushNotif("Ocena zapisana", p.nick + ": " + val + "/5", "players");
    $("#modal").classList.remove("on");
    toast("Dzięki za ocenę");
    renderPlayers(true);
  };
}
function shareListing(p) {
  const url = location.href.split("#")[0] + "#player=" + encodeURIComponent(p.id);
  const text = p.nick + " szuka ekipy do " + p.game + " — BigWW";
  if (navigator.share) {
    navigator.share({ title: "BigWW", text, url }).catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(text + "\n" + url).then(() => toast("Link skopiowany")).catch(() => toast(url));
  } else toast(url);
  pushNotif("Udostępniono", "Link do ogłoszenia " + p.nick, "players");
}

const FREE_MSG_LIMIT = 10;
const FREE_UNLOCK_DAILY = 3;
const UNLOCK_CONTACT_COST = 15;
const MSG_COST = 6;
const BP_XP_PER_LEVEL = 100;
const BP_MAX = 10;

function isPrem() { return !!PREM.active && PREM.until > Date.now(); }
function isPro() { return isPrem() && (PREM.plan === "pro" || PREM.plan === "year"); }
function adLimit() {
  if (isPro()) return 20;
  if (isPrem()) return 10;
  let lim = 3;
  const extra = Number(localStorage.getItem("bigww_extra_slot") || 0);
  if (extra > Date.now()) lim += 1;
  return lim;
}
function isBoosted(id) { return (BOOSTS[id] || 0) > Date.now(); }
function cleanBoosts() {
  const now = Date.now();
  let ch = false;
  Object.keys(BOOSTS).forEach(k => { if (BOOSTS[k] <= now) { delete BOOSTS[k]; ch = true; } });
  if (ch) save(KEY.boosts, BOOSTS);
}
function canSeeContact(p) {
  if (p.mine) return true;
  if (isPrem()) return true;
  if (UNLOCKS.includes(p.id)) return true;
  return false;
}
function resetMsgDay() {
  const t = todayKey();
  if (MSG.day !== t) { MSG.day = t; MSG.used = 0; MSG.freeUnlocks = 0; save(KEY.msg, MSG); }
  if (MSG.freeUnlocks == null) MSG.freeUnlocks = 0;
}
function freeUnlocksLeft() {
  if (isPrem()) return 99;
  resetMsgDay();
  return Math.max(0, FREE_UNLOCK_DAILY - (MSG.freeUnlocks || 0));
}
function msgsLeft() {
  if (isPrem()) return 999;
  resetMsgDay();
  return Math.max(0, FREE_MSG_LIMIT - MSG.used);
}

/** Wszystkie ogłoszenia widoczne na listach.
 *  W trybie serwerowym daje je DATA (baza), w lokalnym — moje plus generator.
 *  Widoki wołają tylko to, więc nie muszą wiedzieć, skąd dane przyszły. */
function allPlayers() {
  if (typeof DATA !== "undefined" && DATA.isApi) return DATA.players();
  return MINE.concat(PLAYERS);
}

function todayKey() {
  const d = new Date();
  return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}

