"use strict";

/* BigWW - Start aplikacji - kolejnosc wywolan i globalne skroty */

/* =========================================================
   13. START
========================================================= */

/** Pokazuje w stopce menu, czy strona chodzi na serwerze, czy na danych demo. */
function renderModeTag() {
  const foot = $("#sideFoot");
  if (!foot) return;
  if (DATA.isApi) {
    foot.innerHTML = `<span class="mode-tag api">● serwer</span>
      Ogłoszenia i konta są prawdziwe — zapisują się w bazie i widzą je
      wszyscy. Ekipy, transmisje i płatności dojdą w kolejnych wersjach.`;
  } else {
    foot.innerHTML = `<span class="mode-tag demo">● demo</span>
      Backend nie odpowiada, więc profile graczy są generowane lokalnie —
      nic nie wychodzi poza Twoją przeglądarkę.`;
  }
}

/**
 * W trybie serwerowym chowamy to, czego nie da się naprawdę kupić: Sklep,
 * Premium i saldo monet. Ekrany, które proszą o 19,99 zł i pokazują
 * potwierdzenie zapłaty, a nic nie pobierają, wyglądają jak próba oszustwa —
 * wracają, gdy będzie prawdziwa bramka płatnicza.
 */
function hideFakeMonetization() {
  if (!DATA.isApi) return;
  document.querySelectorAll('#nav button[data-v="premium"], #nav button[data-v="shop"]').forEach(b => b.remove());
  document.querySelectorAll('#bottomNav button[data-v="shop"], #bottomNav button[data-v="premium"]').forEach(b => b.remove());
  const coins = $("#coinBal");
  if (coins) coins.style.display = "none";
  const setPrem = $("#setPrem");
  if (setPrem) setPrem.style.display = "none";
  document.querySelectorAll(".ad-banner").forEach(a => a.remove());
}

async function start() {
  applyTheme();

  // Zanim cokolwiek narysujemy, ustalamy skąd biorą się dane.
  await DATA.init();
  hideFakeMonetization();

  renderAccount();
  renderModeTag();

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
  if (!DATA.isApi) {
    renderPremium();
    renderSettingsPrem();
  }

  // Sklep potrzebuje wiedzieć, jakie mam ogłoszenia (do promowania).
  await DATA.myAds();
  if (!DATA.isApi) renderShop();

  updateCoinUI();
  updateLookingUI();
  startOnboard();
}

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

start();
