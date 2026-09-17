"use strict";

/* =========================================================
   5. NAWIGACJA
========================================================= */
/** Widoki tylko dla zalogowanych: sklep, premium, monety, własne ogłoszenia, inbox */
const AUTH_REQUIRED_VIEWS = new Set(["shop", "premium", "mine", "inbox", "saved", "add"]);

function go(view) {
  if (AUTH_REQUIRED_VIEWS.has(view) && typeof isLoggedIn === "function" && !isLoggedIn()) {
    if (typeof requireLogin === "function") {
      requireLogin(view === "shop" ? "otworzyć sklep i monety WW"
        : view === "premium" ? "zobaczyć Premium"
        : view === "add" ? "dodać ogłoszenie"
        : view === "mine" ? "zobaczyć swoje ogłoszenia"
        : view === "inbox" ? "otworzyć wiadomości"
        : view === "saved" ? "zobaczyć obserwowanych"
        : "wykonać tę akcję");
    } else {
      openAuthModal && openAuthModal("login");
    }
    return;
  }
  const pageView = (view === "privacy") ? "terms" : view;
  document.querySelectorAll(".page").forEach(p => p.classList.toggle("on", p.id === "v-" + pageView));
  document.querySelectorAll("#nav button").forEach(b => b.classList.toggle("on", b.dataset.v === view));
  document.querySelectorAll("#bottomNav button").forEach(b => b.classList.toggle("on", b.dataset.v === view));
  $("#sidebar").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  if (view === "mine") renderMine();
  if (view === "saved") renderSaved();
  if (view === "inbox") renderInbox();
  if (view === "profile" && currentProfileId) {
    const pl = allPlayers().find(x => x.id === currentProfileId);
    if (pl) renderProfilePage(pl);
  }
  if (view === "premium") renderPremium();
  if (view === "settings") renderSettingsPrem();
  if (view === "shop") renderShop();
  if (view === "giveaways" && typeof renderGiveaways === "function") renderGiveaways();
  if (view === "live") renderLives();
  if (view === "terms") renderTerms("terms");
  if (view === "privacy") renderTerms("privacy");
  if (view === "add" && isLoggedIn() && $("#aNick") && !$("#aNick").value) {
    const u = currentUser();
    if (u) $("#aNick").value = u.nick;
  }
  updateLookingUI();
  document.body.classList.toggle("home-on", view === "home");
  if (view === "home") playHomeHero();
}

function playHomeHero() {
  const hero = document.getElementById("homeHero");
  if (!hero) return;
  hero.classList.remove("hero-play");
  // reflow żeby animacja odpaliła się za każdym wejściem na Start
  void hero.offsetWidth;
  hero.classList.add("hero-play");
}

document.querySelectorAll("#nav button").forEach(b => b.onclick = () => go(b.dataset.v));
document.querySelectorAll("#bottomNav button").forEach(b => b.onclick = () => go(b.dataset.v));
document.addEventListener("click", e => {
  const g = e.target.closest("[data-go]");
  if (g) go(g.dataset.go);
});
$("#burger").onclick = () => $("#sidebar").classList.toggle("open");

function setSidebarCollapsed(collapsed) {
  const side = $("#sidebar");
  if (!side) return;
  // na mobile nie używamy desktop collapse
  if (window.matchMedia && window.matchMedia("(max-width:820px)").matches) {
    document.body.classList.remove("sidebar-collapsed");
    side.classList.remove("collapsed");
    return;
  }
  side.classList.toggle("collapsed", !!collapsed);
  document.body.classList.toggle("sidebar-collapsed", !!collapsed);
  if (typeof PREF !== "undefined") {
    PREF.sidebarCollapsed = !!collapsed;
    try { save(KEY.pref, PREF); } catch (e) {}
  }
  const btn = $("#sideCollapse");
  if (btn) btn.title = collapsed ? "Pokaż menu" : "Schowaj menu";
}
function toggleSidebarCollapse() {
  const side = $("#sidebar");
  if (!side) return;
  setSidebarCollapsed(!side.classList.contains("collapsed"));
}
if ($("#sideCollapse")) $("#sideCollapse").onclick = () => setSidebarCollapsed(true);
if ($("#sideExpand")) $("#sideExpand").onclick = () => setSidebarCollapsed(false);
// restore after PREF exists — applied in START as well
document.addEventListener("keydown", e => {
  if (e.key === "[" && !e.target.matches("input,textarea,select")) {
    e.preventDefault();
    toggleSidebarCollapse();
  }
});

function setLooking(on) {
  PREF.looking = !!on;
  PREF.lookingUntil = on ? Date.now() + LOOKING_TTL_MS : 0;
  save(KEY.pref, PREF);
  MINE.forEach(m => { m.status = on ? "on" : (m.status || "on"); });
  save(KEY.mine, MINE);
  updateLookingUI();
  if (on) {
    toast("Szukam teraz — auto-wyłączenie za 2 h");
    pushNotif("Status włączony", "Twoje ogłoszenia są wyżej przez 2 godziny.", "players");
    clearTimeout(setLooking._t);
    setLooking._t = setTimeout(() => {
      if (PREF.lookingUntil && PREF.lookingUntil <= Date.now()) setLooking(false);
    }, LOOKING_TTL_MS + 500);
  } else toast("Status wyłączony");
  renderPlayers(true);
  renderMine();
  renderHome();
}
function updateLookingUI() {
  if (PREF.looking && PREF.lookingUntil && PREF.lookingUntil < Date.now()) {
    PREF.looking = false;
    PREF.lookingUntil = 0;
    save(KEY.pref, PREF);
  }
  const on = !!PREF.looking;
  ["lookingBarHome", "lookingBarPlayers"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("on", on);
  });
  const btn = $("#btnLookingOn");
  if (btn) {
    let lab = on ? "🟢 Szukam teraz (włączone)" : "🟢 Włącz „Szukam teraz”";
    if (on && PREF.lookingUntil) {
      const left = Math.max(0, Math.ceil((PREF.lookingUntil - Date.now()) / 60000));
      lab += " · " + left + " min";
    }
    btn.textContent = lab;
    btn.classList.toggle("pri", on);
  }
}



/** Pokazuje/ukrywa monety, Sklep i Premium dla gościa */
function applyAuthVisibility() {
  const logged = typeof isLoggedIn === "function" && isLoggedIn();
  const coin = document.getElementById("coinBal");
  if (coin) coin.style.display = logged ? "" : "none";
  document.querySelectorAll("#nav button[data-v=\"shop\"], #nav button[data-v=\"premium\"], #bottomNav button[data-v=\"shop\"]").forEach(b => {
    b.style.display = logged ? "" : "none";
  });
  // jeśli gość siedział na zablokowanym widoku — wróć na start
  if (!logged) {
    const on = document.querySelector(".page.on");
    if (on && AUTH_REQUIRED_VIEWS.has(on.id.replace(/^v-/, ""))) {
      document.querySelectorAll(".page").forEach(p => p.classList.toggle("on", p.id === "v-home"));
      document.querySelectorAll("#nav button").forEach(b => b.classList.toggle("on", b.dataset.v === "home"));
      document.querySelectorAll("#bottomNav button").forEach(b => b.classList.toggle("on", b.dataset.v === "home"));
    }
  }
}

// animacja hero przy starcie (zakładka Start)
if (document.getElementById("v-home")?.classList.contains("on")) {
  document.body.classList.add("home-on");
  playHomeHero();
}
