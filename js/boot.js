"use strict";

/* =========================================================
   OFFICIAL BOOT — splash, cookies, PWA, API adapter
========================================================= */
const APP_VERSION = "1.0.0";
const STORAGE_MODE = "local"; // later: "api"

/** Adapter pod przyszły backend — dziś mapuje na localStorage */
const API = {
  mode: STORAGE_MODE,
  async getPlayers(filters) {
    return filterPlayers();
  },
  async saveListing(ad) {
    MINE.unshift(ad);
    save(KEY.mine, MINE);
    return ad;
  },
  async health() {
    return { ok: true, mode: STORAGE_MODE, version: APP_VERSION, ts: Date.now() };
  }
};

function hideSplash() {
  const s = $("#splash");
  if (!s) return;
  s.classList.add("hide");
  setTimeout(() => { s.style.display = "none"; s.setAttribute("aria-hidden", "true"); }, 400);
}
function initCookies() {
  const key = "bigww_cookie_v1";
  if (localStorage.getItem(key)) return;
  const bar = $("#cookieBar");
  if (!bar) return;
  bar.classList.add("on");
  const accept = (mode) => {
    localStorage.setItem(key, JSON.stringify({ mode, at: Date.now() }));
    bar.classList.remove("on");
  };
  $("#cookieAccept")?.addEventListener("click", () => accept("all"));
  $("#cookieEssential")?.addEventListener("click", () => accept("essential"));
}
function registerPWA() {
  if (!("serviceWorker" in navigator)) return;
  const swCode = `
    const CACHE = 'bigww-v1';
    self.addEventListener('install', e => {
      self.skipWaiting();
      e.waitUntil(caches.open(CACHE).then(c => c.addAll([])));
    });
    self.addEventListener('activate', e => {
      e.waitUntil(self.clients.claim());
    });
    self.addEventListener('fetch', e => {
      // network-first; offline fallback to cache if present
      e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
      );
    });
  `;
  try {
    const blob = new Blob([swCode], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    navigator.serviceWorker.register(url).catch(() => {});
  } catch (e) {}
}

// boot
requestAnimationFrame(() => {
  setTimeout(hideSplash, 550);
});
initCookies();
registerPWA();
API.health().then(h => {
  console.info("[BigWW]", h.version, "storage:", h.mode);
}).catch(() => {});
window.BigWW = { version: APP_VERSION, api: API, go, t };
