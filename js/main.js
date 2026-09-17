"use strict";

/* BigWW - Start aplikacji - kolejnosc wywolan i globalne skroty */

/* =========================================================
   13. START
========================================================= */
applyTheme();
buildFilters();
buildGames();
buildAdd();
updateBadges();
renderHome();
renderPlayers(true);
renderGames();
renderTeams();
renderLives();
renderInfo();
renderPremium();
renderSettingsPrem();
renderShop();
updateCoinUI();
updateLookingUI();

// looking now
if ($("#btnLookingOn")) $("#btnLookingOn").onclick = () => setLooking(!PREF.looking);
if ($("#lookingOffHome")) $("#lookingOffHome").onclick = () => setLooking(false);
if ($("#lookingOffPlayers")) $("#lookingOffPlayers").onclick = () => setLooking(false);

// bind shop buttons
if ($("#btnWatchAd")) $("#btnWatchAd").onclick = watchAd;
if ($("#refCopy")) $("#refCopy").onclick = () => {
  navigator.clipboard?.writeText(REF.code).then(() => toast("Kod skopiowany")).catch(() => toast(REF.code));
};
if ($("#refShare")) $("#refShare").onclick = () => {
  openModal(`<h3 style="margin-bottom:8px">Link polecający</h3>
    <p class="note">W prawdziwej wersji link prowadziłby do rejestracji z Twoim kodem. Tutaj możesz skopiować kod:</p>
    <div class="ref-code">${REF.code}</div>
    <p class="note" style="margin-top:10px">Znajomy wpisuje go w Sklepie → Program polecający.</p>`);
};
if ($("#refApply")) $("#refApply").onclick = applyReferral;

// keyboard: / focuses search
document.addEventListener("keydown", e => {
  if (e.key === "/" && !e.target.matches("input,textarea,select")) {
    e.preventDefault();
    go("players");
    setTimeout(() => $("#pSearch")?.focus(), 50);
  }
});

startOnboard();
