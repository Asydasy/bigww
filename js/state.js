"use strict";

/* =========================================================
   3. PAMIĘĆ LOKALNA
========================================================= */
const KEY = {
  mine: "bigww_mine_v2", saved: "bigww_saved_v2", pref: "bigww_pref_v2",
  prem: "bigww_premium_v2", coins: "bigww_coins_v2", ref: "bigww_ref_v2",
  boosts: "bigww_boosts_v2", adlog: "bigww_adlog_v2", msg: "bigww_msg_v2",
  bp: "bigww_bp_v2", quests: "bigww_quests_v2", unlocks: "bigww_unlocks_v2",
  navcount: "bigww_nav_v2", livePass: "bigww_livepass_v2", liveTickets: "bigww_livetickets_v2",
  users: "bigww_users_v2", session: "bigww_session_v2",
  blocked: "bigww_blocked_v2", reports: "bigww_reports_v2",
  inbox: "bigww_inbox_v2", notifs: "bigww_notifs_v2", ratings: "bigww_ratings_v2",
  presets: "bigww_presets_v2"
};
const SCOPED_KEYS = new Set([
  KEY.mine, KEY.saved, KEY.pref, KEY.prem, KEY.coins, KEY.ref, KEY.boosts,
  KEY.adlog, KEY.msg, KEY.bp, KEY.quests, KEY.unlocks, KEY.navcount,
  KEY.livePass, KEY.liveTickets, KEY.blocked, KEY.reports, KEY.inbox, KEY.notifs, KEY.ratings,
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

function scopeSuffix() {
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
function isLoggedIn() { return !!(SESSION && SESSION.userId); }
function currentUser() {
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
  LIVEPASS = load(KEY.livePass, { until: 0 });
  LIVETICKETS = load(KEY.liveTickets, []);
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

let MINE, SAVED, PREF, PREM, COINS, REF, BOOSTS, ADLOG, MSG, BP, QUESTS, UNLOCKS, NAVCOUNT, LIVEPASS, LIVETICKETS;
let BLOCKED, REPORTS, INBOX, NOTIFS, RATINGS, PRESETS;
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
function sendInboxMessage(toPlayer, text) {
  if (!requireLogin("wysłać wiadomość")) return false;
  const me = currentUser();
  const threadId = [SESSION.userId, toPlayer.id].sort().join("_");
  let thread = INBOX.find(t => t.id === threadId);
  if (!thread) {
    thread = { id: threadId, withId: toPlayer.id, withNick: toPlayer.nick, messages: [] };
    INBOX.unshift(thread);
  }
  thread.messages.push({ from: SESSION.userId, fromNick: me ? me.nick : SESSION.nick, text, ts: Date.now() });
  thread.updated = Date.now();
  save(KEY.inbox, INBOX);
  pushNotif("Wiadomość wysłana", "Do " + toPlayer.nick + ": " + text.slice(0, 60), "inbox");
  updateBadges();
  return true;
}
function openInboxThread(thread) {
  const msgs = (thread.messages || []).map(m =>
    `<div style="margin:8px 0;padding:10px;border-radius:10px;background:var(--bg2)"><b>${m.fromNick}</b><div class="note">${ago(m.ts)}</div><p style="margin-top:6px">${m.text}</p></div>`
  ).join("");
  openModal(`<h3 style="margin-bottom:8px">${thread.withNick}</h3>
    <div style="max-height:280px;overflow:auto">${msgs || '<p class="note">Brak wiadomości</p>'}</div>
    <div class="field" style="margin-top:12px"><textarea id="inboxReply" maxlength="400" placeholder="Napisz odpowiedź…"></textarea></div>
    <button class="btn pri" id="inboxSend" style="margin-top:8px">Wyślij</button>`);
  $("#inboxSend").onclick = () => {
    const text = ($("#inboxReply").value || "").trim();
    if (text.length < 2) return toast("Wpisz wiadomość");
    const p = allPlayers().find(x => x.id === thread.withId) || { id: thread.withId, nick: thread.withNick };
    if (sendInboxMessage(p, text)) {
      $("#modal").classList.remove("on");
      renderInbox();
      toast("Wysłano");
    }
  };
}
function renderInbox() {
  const box = $("#inboxList");
  if (!box) return;
  box.innerHTML = "";
  if (!INBOX.length) {
    box.innerHTML = `<div class="empty"><h3>Pusta skrzynka</h3><p>Napisz do gracza z karty — wiadomość pojawi się tutaj.</p></div>`;
    return;
  }
  INBOX.slice().sort((a, b) => (b.updated || 0) - (a.updated || 0)).forEach(t => {
    const last = (t.messages || [])[t.messages.length - 1];
    const row = el("div", "inbox-thread");
    row.innerHTML = `<b>${t.withNick}</b><div class="note">${last ? last.text.slice(0, 80) : ""} · ${last ? ago(last.ts) : ""}</div>`;
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

function canWatchLive(streamId) {
  if (isPrem()) return true;
  if (LIVEPASS.until > Date.now()) return true;
  if (LIVETICKETS.includes(streamId)) return true;
  return false;
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

function allPlayers() { return MINE.concat(PLAYERS); }

function todayKey() {
  const d = new Date();
  return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}

