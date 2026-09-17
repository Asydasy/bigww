"use strict";

/* =========================================================
   START APLIKACJI — splash, cookies, PWA, wybór źródła danych
========================================================= */
const APP_VERSION = "1.2.1";

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

/** Kropka w stopce menu: skąd lecą dane. */
function pokazTrybDanych(mode) {
  const box = $("#dataMode");
  if (!box) return;
  const api = mode === "api";
  box.className = "data-mode " + (api ? "on-api" : "on-local");
  box.textContent = api ? "● serwer" : "● lokalnie";
  box.title = api
    ? "Ogłoszenia i konta z bazy (" + API.base + ")"
    : "Backend nie odpowiada — dane z generatora i localStorage";
}

/** Po rozpoznaniu trybu przerysowujemy to, co mogło się zmienić. */
function odswiezPoStarcie() {
  countCache = null;
  updateAuthUI();
  if (typeof applyAuthVisibility === "function") applyAuthVisibility();
  updateBadges();
  updateCoinUI();
  updateLookingUI();
  renderHome();
  renderPlayers(true);
  renderGames();
  renderMine();
  renderSaved();
  renderInbox();
  renderInfo();
}

// boot
requestAnimationFrame(() => {
  setTimeout(hideSplash, 550);
});
initCookies();
registerPWA();

/* Źródło danych rozpoznajemy raz, przy starcie: gdy backend odpowiada na
   /api/health, ogłoszenia, gry i konta idą z bazy; gdy nie — zostaje warstwa
   lokalna, więc index.html otwarty z dysku dalej działa. */
DATA.init()
  .then(mode => {
    pokazTrybDanych(mode);
    odswiezPoStarcie();
    if (typeof initChat === "function") initChat(mode);
    console.info("[BigWW]", APP_VERSION, "dane:", mode, mode === "api" ? API.base : "");
  })
  .catch(err => {
    console.warn("[BigWW] nie udało się rozpoznać trybu danych:", err);
    pokazTrybDanych("local");
    if (typeof initChat === "function") initChat("local");
  });

window.BigWW = { version: APP_VERSION, api: API, data: DATA, go, t };
