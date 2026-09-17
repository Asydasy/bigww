"use strict";

/* BigWW - Nawigacja miedzy widokami i tryb 'szukam teraz' */

/* =========================================================
   5. NAWIGACJA
========================================================= */
function go(view) {
  // Widoki dla zalogowanych: gościowi zamiast pustej strony pokazujemy
  // logowanie. Łapie to wszystkie wejścia naraz — menu, przyciski na stronie
  // startowej i odsyłacze w pustych stanach.
  if (GUEST_HIDDEN.includes(view) && isGuest()) {
    openAuth("login");
    return;
  }
  // Regulamin i polityka prywatności dzielą jeden widok — różnią się treścią.
  if (view === "terms" || view === "privacy") renderTerms(view);
  const strona = view === "privacy" ? "terms" : view;

  document.querySelectorAll(".page").forEach(p => p.classList.toggle("on", p.id === "v-" + strona));
  document.querySelectorAll("#nav button").forEach(b => b.classList.toggle("on", b.dataset.v === strona));
  document.querySelectorAll("#bottomNav button").forEach(b => b.classList.toggle("on", b.dataset.v === strona));
  $("#sidebar").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  if (view === "mine") renderMine();
  if (view === "saved") renderSaved();
  if (view === "premium") renderPremium();
  if (view === "settings") renderSettingsPrem();
  if (view === "shop") renderShop();
  if (view === "live") renderLives();
  updateLookingUI();
  maybeShowInterstitial(); // monetization.js — co kilka przejsc pokazuje pelnoekranowa reklame
}
document.querySelectorAll("#nav button").forEach(b => b.onclick = () => go(b.dataset.v));
document.querySelectorAll("#bottomNav button").forEach(b => b.onclick = () => go(b.dataset.v));
document.addEventListener("click", e => {
  const g = e.target.closest("[data-go]");
  if (g) go(g.dataset.go);
});
$("#burger").onclick = () => $("#sidebar").classList.toggle("open");

function setLooking(on) {
  PREF.looking = !!on;
  save(KEY.pref, PREF);
  // push own ads to online status
  MINE.forEach(m => { m.status = on ? "on" : (m.status || "on"); });
  save(KEY.mine, MINE);
  updateLookingUI();
  if (on) toast("Status: szukam teraz — jesteś wyżej na liście");
  else toast("Status wyłączony");
  renderPlayers(true);
  renderMine();
  renderHome();
}
function updateLookingUI() {
  const on = !!PREF.looking;
  ["lookingBarHome", "lookingBarPlayers"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("on", on);
  });
  const btn = $("#btnLookingOn");
  if (btn) {
    btn.textContent = on ? "🟢 Szukam teraz (włączone)" : "🟢 Włącz „Szukam teraz”";
    btn.classList.toggle("pri", on);
  }
}
