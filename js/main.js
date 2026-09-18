"use strict";

/* =========================================================
   13. START
========================================================= */
applyTheme();
if (PREF && PREF.sidebarCollapsed) setSidebarCollapsed(true);
buildFilters();
buildGames();
buildAdd();
updateBadges();
renderHome();
renderPlayers(true);
renderGames();
renderTeams();
renderInfo();
renderPremium();
renderSettingsPrem();
renderShop();
updateCoinUI();
updateLookingUI();
updateAuthUI();
if (typeof applyAuthVisibility === "function") applyAuthVisibility();
applyStaticI18n();
document.querySelectorAll("#langToggle button").forEach(b => {
  b.classList.toggle("on", b.dataset.lang === LANG);
  b.onclick = () => setLang(b.dataset.lang);
});
updateNotifUI();
if ($("#notifBtn")) {
  $("#notifBtn").onclick = e => {
    e.stopPropagation();
    $("#notifPanel")?.classList.toggle("on");
  };
}
if ($("#notifClear")) {
  $("#notifClear").onclick = e => {
    e.stopPropagation();
    NOTIFS = [];
    save(KEY.notifs, NOTIFS);
    updateNotifUI();
    toast("Powiadomienia wyczyszczone");
  };
}
document.addEventListener("click", e => {
  if (!e.target.closest("#notifPanel") && !e.target.closest("#notifBtn")) {
    $("#notifPanel")?.classList.remove("on");
  }
});
// welcome notif once
if (!NOTIFS.length && isLoggedIn()) {
  pushNotif("Witaj w BigWW", "Włącz „Szukam teraz”, dodaj ogłoszenie i filtruj po dopasowaniu.", "add");
}
// deep links: #player=id | #u/nick
function handleDeepLink() {
  const h = location.hash || "";
  if (h.startsWith("#player=")) {
    const pid = decodeURIComponent(h.slice(8));
    const pl = allPlayers().find(x => x.id === pid);
    if (pl) setTimeout(() => openProfile(pl), 200);
  } else if (h.startsWith("#u/")) {
    const nick = decodeURIComponent(h.slice(3));
    const pl = allPlayers().find(x => x.nick.toLowerCase() === nick.toLowerCase());
    if (pl) setTimeout(() => openProfile(pl), 200);
    else toast("Nie znaleziono profilu: " + nick);
  }
}
handleDeepLink();
window.addEventListener("hashchange", handleDeepLink);

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
    <p class="note">Udostępnij kod znajomemu. Po rejestracji z Twoim kodem oboje dostaniecie bonus:</p>
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

// regulamin / prywatność
if ($("#btnTerms")) $("#btnTerms").onclick = () => go("terms");
if ($("#btnPrivacy")) $("#btnPrivacy").onclick = () => go("privacy");
if ($("#footerTerms")) $("#footerTerms").onclick = e => { e.preventDefault(); go("terms"); };
if ($("#footerPrivacy")) $("#footerPrivacy").onclick = e => { e.preventDefault(); go("privacy"); };
if ($("#footTerms2")) $("#footTerms2").onclick = () => go("terms");
if ($("#footPrivacy2")) $("#footPrivacy2").onclick = () => go("privacy");
if ($("#footCookies") || $("#cookiePrivacyLink")) {
  const openPriv = e => { e?.preventDefault?.(); go("privacy"); };
  if ($("#footCookies")) $("#footCookies").onclick = openPriv;
  if ($("#cookiePrivacyLink")) $("#cookiePrivacyLink").onclick = openPriv;
}
if ($("#footContact")) $("#footContact").onclick = () => {
  openModal(`<h3 style="margin-bottom:8px">Kontakt BigWW</h3>
    <p class="note">Wersja produkcyjna: support@bigww.app</p>
    <p class="note" style="margin-top:8px">Reklamacje rozpatrywane w 14 dni (zgodnie z Regulaminem).</p>
    <p class="note" style="margin-top:8px">Obecnie działa warstwa lokalna (demo storage). Po wdrożeniu API ten adres będzie aktywny.</p>`);
};

