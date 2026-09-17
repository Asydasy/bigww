"use strict";

/* BigWW - Stan aplikacji i localStorage: KEY, load/save, premium, monety, limity */

/* =========================================================
   3. PAMIĘĆ LOKALNA
========================================================= */
const KEY = { mine: "bigww_mine_v2", saved: "bigww_saved_v2", pref: "bigww_pref_v2" };
function load(k, fb) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

KEY.prem = "bigww_premium_v2";
KEY.coins = "bigww_coins_v2";
KEY.ref = "bigww_ref_v2";
KEY.boosts = "bigww_boosts_v2";
KEY.adlog = "bigww_adlog_v2";
KEY.msg = "bigww_msg_v2";
KEY.bp = "bigww_bp_v2";
KEY.quests = "bigww_quests_v2";
KEY.unlocks = "bigww_unlocks_v2";
KEY.navcount = "bigww_nav_v2";
KEY.livePass = "bigww_livepass_v2";
KEY.liveTickets = "bigww_livetickets_v2";

let MINE = load(KEY.mine, []);
let SAVED = load(KEY.saved, []);
let PREF = load(KEY.pref, { theme: "dark", region: "Polska", avaShift: "", looking: false, filters: null, onboarded: false });
if (PREF.region === "Polska — cała" || /^(Mazowieckie|Śląskie|Wielkopolskie|Małopolskie|Dolnośląskie|Pomorskie)/.test(PREF.region || "")) PREF.region = "Polska";
if (PREF.avaShift === undefined) PREF.avaShift = "";
if (PREF.looking === undefined) PREF.looking = false;
if (PREF.onboarded === undefined) PREF.onboarded = false;
if (PREF.filters === undefined) PREF.filters = null;
let PREM = load(KEY.prem, { active: false, plan: null, until: 0, since: 0 });
let COINS = load(KEY.coins, { bal: 40, earned: 0, spent: 0 });
let REF = load(KEY.ref, { code: "", used: [], count: 0, earned: 0, applied: false });
let BOOSTS = load(KEY.boosts, {}); // id -> until timestamp
let ADLOG = load(KEY.adlog, { lastWatch: 0, daily: 0, day: "" });
let MSG = load(KEY.msg, { day: "", used: 0 });
let BP = load(KEY.bp, { level: 1, xp: 0, claimed: [] });
let QUESTS = load(KEY.quests, { day: "", done: {} });
let UNLOCKS = load(KEY.unlocks, []); // player ids with unlocked contact
let NAVCOUNT = load(KEY.navcount, 0);
let LIVEPASS = load(KEY.livePass, { until: 0 }); // session pass for all lives
let LIVETICKETS = load(KEY.liveTickets, []); // individual stream ids unlocked
let pendingMedia = { clipUrl: "", fileData: null, fileType: "" }; // form media

function canWatchLive(streamId) {
  if (isPrem()) return true;
  if (LIVEPASS.until > Date.now()) return true;
  if (LIVETICKETS.includes(streamId)) return true;
  return false;
}

const FREE_MSG_LIMIT = 5;
const UNLOCK_CONTACT_COST = 20;
const MSG_COST = 8;
const BP_XP_PER_LEVEL = 100;
const BP_MAX = 10;

function isPrem() { return !!PREM.active && PREM.until > Date.now(); }
function isPro() { return isPrem() && (PREM.plan === "pro" || PREM.plan === "year"); }
function adLimit() {
  if (isPro()) return 20;
  if (isPrem()) return 10;
  let lim = 2;
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
  if (MSG.day !== t) { MSG.day = t; MSG.used = 0; save(KEY.msg, MSG); }
}
function msgsLeft() {
  if (isPrem()) return 999;
  resetMsgDay();
  return Math.max(0, FREE_MSG_LIMIT - MSG.used);
}

function allPlayers() { return MINE.concat(PLAYERS); }

function genRefCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c = "BIG-";
  for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}
if (!REF.code) { REF.code = genRefCode(); save(KEY.ref, REF); }

function todayKey() {
  const d = new Date();
  return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}
