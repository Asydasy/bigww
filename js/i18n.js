"use strict";

/* =========================================================
   2b. TŁUMACZENIA (PL / EN)
========================================================= */
const I18N = {
  pl: {
    // nav
    "nav.home": "Start",
    "nav.players": "Szukaj graczy",
    "nav.games": "Baza gier",
    "nav.teams": "Ekipy",
    "nav.live": "Live",
    "nav.add": "Dodaj ogłoszenie",
    "nav.mine": "Moje ogłoszenia",
    "nav.saved": "Obserwowani",
    "nav.inbox": "Wiadomości",
    "nav.premium": "Premium",
    "nav.shop": "Sklep i monety",
    "nav.settings": "Ustawienia",
    "nav.foot": "BigWW — znajdź ekipę do grania. Baw się dobrze i graj fair.",
    // topbar
    "user.guest": "Gość",
    "user.notLogged": "Nie jesteś zalogowany",
    "user.logged": "Zalogowany",
    "user.loginBtn": "Zaloguj / Załóż konto",
    "user.logout": "Wyloguj",
    "nav.giveaways": "Giveawaye",
    "gw.title": "Giveawaye",
    "gw.sub": "Losowania dla społeczności BigWW. Udział wymaga konta. Warstwa demonstracyjna — nagrody nie są wysyłane automatycznie.",
    "gw.history": "Historia",

    "footer.tagline": "BigWW — znajdź ekipę do grania.",
    "footer.terms": "Regulamin",
    "footer.privacy": "Polityka prywatności",
    "footer.cookies": "Cookies",
    "footer.contact": "Kontakt",
    "footer.copy": "© BigWW. Prototyp demonstracyjny.",
    "cookie.text": "Używamy niezbędnych danych w przeglądarce (localStorage), żeby zapamiętać sesję i preferencje. Analityka marketingowa jest wyłączona. Szczegóły w Polityce prywatności.",
    "cookie.accept": "Akceptuję",
    "cookie.essential": "Tylko niezbędne",
    "cookie.aria": "Zgoda na pliki cookies",
    "user.verifyEmail": "Potwierdź e-mail",
    "user.unverified": "e-mail niepotwierdzony",
    "user.verified": "potwierdzony",
    "user.settings": "Ustawienia",
    "user.account": "Konto",

    // home
    "home.looking": "Szukasz teraz",
    "home.lookingNote": "Twoje ogłoszenia są wyżej w sortowaniu „online”",
    "home.lookingOff": "Wyłącz",
    "home.online": "graczy online teraz",
    "home.hero": "Nie graj sam, kiedy ktoś obok szuka tego samego.",
    "home.heroP": "Wybierz grę, ustaw region i porę grania, a znajdziesz ludzi, którzy pasują do Twojego stylu — bez losowego matchmakingu i bez przeglądania trzech Discordów naraz.",
    "home.ctaPlayers": "Przeglądaj graczy",
    "home.ctaAdd": "Dodaj swoje ogłoszenie",
    "home.topGames": "Najczęściej szukane gry",
    "home.allGames": "cała baza →",
    "home.newest": "Najnowsze ogłoszenia",
    "home.allPlayers": "wszystkie →",
    "home.statAds": "aktywnych ogłoszeń",
    "home.statGames": "gier w bazie",
    "home.statTeams": "ekip szuka składu",
    "home.statDay": "ogłoszeń z ostatniej doby",
    // players
    "players.title": "Szukaj graczy",
    "players.sub": "Filtruj po grze, regionie, platformie i porze grania. Wyniki układają się od najświeższych ogłoszeń.",
    "players.lookingOn": "Jesteś oznaczony jako „szukam teraz”",
    "players.lookingNote": "Twoje karty rankują wyżej przy sortowaniu online",
    "players.btnLooking": "🟢 Włącz „Szukam teraz”",
    "players.search": "Szukaj po nicku, grze, opisie lub tagu",
    "players.searchPh": "np. Valorant, wolne granie, PL, rankedy",
    "players.game": "Gra",
    "players.region": "Kraj",
    "players.plat": "Platforma",
    "players.style": "Styl grania",
    "players.hours": "Godziny grania",
    "players.sort": "Sortuj",
    "players.sortNew": "Najnowsze",
    "players.sortOnline": "Najpierw online",
    "players.sortHours": "Najwięcej godzin",
    "players.sortRating": "Najlepsza ocena",
    "players.reset": "Wyczyść filtry",
    "players.allGames": "Wszystkie gry",
    "players.allRegions": "Wszystkie kraje",
    "players.anyPlat": "Każda platforma",
    "players.anyStyle": "Każdy styl",
    "players.from": "Od",
    "players.to": "Do",
    "quick.on": "Tylko online",
    "quick.mic": "Z mikrofonem",
    "quick.new": "Świeże (24 h)",
    "quick.learn": "Uczą nowych",
    "quick.pl": "Po polsku",
    // games
    "games.title": "Baza gier",
    "games.sub": "Kliknij grę, żeby zobaczyć wszystkich, którzy właśnie w nią szukają ekipy.",
    "games.search": "Szukaj gry",
    "games.searchPh": "np. Rust, CS2, Elden Ring, Farming Simulator",
    "games.all": "Wszystkie",
    // teams
    "teams.title": "Ekipy szukające składu",
    "teams.sub": "Grupy z wolnymi miejscami. Wolne sloty pokazują, ile osób jeszcze brakuje.",
    "teams.search": "Szukaj ekipy lub gry",
    "teams.searchPh": "np. Rust, klan, turniej, casual",
    // live
    "live.title": "Live — grają na żywo",
    "live.sub": "Streamerzy i gracze szukający ekipy na żywo. Oglądanie streamów wymaga Premium albo jednorazowej opłaty w monetach WW.",
    "live.search": "Szukaj streamu lub gry",
    "live.searchPh": "np. CS2, Valorant, Rust",
    "live.sort": "Sortuj",
    "live.sortViewers": "Najwięcej widzów",
    "live.sortNew": "Najnowsze",
    // add
    "add.title": "Dodaj ogłoszenie",
    "add.sub": "Ogłoszenie trafia na listę graczy. Możesz dołączyć klip lub screen z rozgrywki.",
    "add.nick": "Nick",
    "add.age": "Wiek",
    "add.game": "Gra",
    "add.region": "Kraj",
    "add.plat": "Platforma",
    "add.style": "Styl grania",
    "add.hours": "Godziny grania",
    "add.mic": "Mikrofon",
    "add.contact": "Kontakt",
    "add.contactPh": "np. discord: nick#0001",
    "add.desc": "Opis",
    "add.descPh": "Czego szukasz? Np. Szukam dwóch osób do wieczornych rankedów, gram spokojnie, bez krzyku.",
    "add.clip": "Klip / film (link YouTube, Twitch lub Medal)",
    "add.clipNote": "Wklej publiczny link — podgląd w ogłoszeniu.",
    "add.file": "Screen / nagranie z dysku",
    "add.fileClear": "Usuń plik",
    "add.fileNote": "Dodaj screen lub krótkie nagranie do ogłoszenia.",
    "add.tags": "Tagi (max 4)",
    "add.submit": "Opublikuj ogłoszenie",
    "add.clear": "Wyczyść formularz",
    "add.preview": "Podgląd",
    "add.previewNote": "Dobre ogłoszenie mówi trzy rzeczy: w co grasz, o jakiej porze i czego oczekujesz od ekipy. Reszta znajdzie się w rozmowie.",
    // mine / saved
    "mine.title": "Moje ogłoszenia",
    "mine.sub": "Zarządzaj swoimi ogłoszeniami — edytuj, wypromuj lub usuń w każdej chwili.",
    "saved.title": "Obserwowani gracze",
    "saved.sub": "Lista osób, które oznaczyłeś gwiazdką.",
    // premium
    "prem.title": "BigWW Premium",
    "prem.sub": "Twoje ogłoszenie ląduje na górze wyników i widać je od razu. Reszta zostaje darmowa — premium nie blokuje szukania ani pisania.",
    "prem.faq": "Najczęstsze pytania",
    // shop
    "shop.title": "Sklep i monety WW",
    "shop.sub": "Zarabiaj monety oglądając reklamy, wypromuj ogłoszenie albo zaproś znajomych.",
    "shop.balance": "Twoje saldo",
    "shop.watchAd": "▶ Obejrzyj reklamę (+15 WW)",
    "shop.packs": "Kup monety (pakiety)",
    "shop.packsNote": "Jednorazowy zakup monet — dla osób, które nie chcą subskrypcji.",
    "shop.bp": "Battle Pass sezonu",
    "shop.quests": "Codzienne zadania",
    "shop.earn": "Zarabiaj monety",
    "shop.boost": "Wypromuj ogłoszenie",
    "shop.ref": "Program polecający",
    "shop.coinShop": "Sklep za monety",
    // settings
    "set.title": "Ustawienia",
    "set.sub": "Wygląd, konto i prywatność.",
    "set.appearance": "Wygląd",
    "set.theme": "Motyw",
    "set.themeDark": "Ciemny",
    "set.themeLight": "Jasny",
    "set.region": "Domyślny kraj",
    "set.account": "Konto",
    "set.data": "Twoje dane",
    "set.export": "Eksportuj dane",
    "set.import": "Importuj dane",
    "set.wipe": "Usuń konto i dane",
    "set.about": "O bazie",
    // bottom nav
    "bn.home": "Start",
    "bn.players": "Gracze",
    "bn.live": "Live",
    "bn.add": "Dodaj",
    "bn.shop": "Sklep",
    // auth
    "auth.login": "Logowanie",
    "auth.register": "Rejestracja",
    "auth.nickEmail": "Nick lub e-mail",
    "auth.pass": "Hasło",
    "auth.doLogin": "Zaloguj się",
    "auth.nick": "Nick",
    "auth.email": "E-mail",
    "auth.passMin": "Hasło (min. 6 znaków)",
    "auth.pass2": "Powtórz hasło",
    "auth.doReg": "Załóż konto",
    "auth.hint": "Zakładając konto akceptujesz zasady BigWW. Chroń hasło i nie udostępniaj go nikomu.",
    "auth.close": "Zamknij",
    // common
    "common.close": "Zamknij",
    "common.ad": "Reklama",
    "common.lookingOff": "Wyłącz",
    "logo.sub": "Znajdź ludzi do grania"
  },
  en: {
    "nav.home": "Home",
    "nav.players": "Find players",
    "nav.games": "Game library",
    "nav.teams": "Teams",
    "nav.live": "Live",
    "nav.add": "Post listing",
    "nav.mine": "My listings",
    "nav.saved": "Watchlist",
    "nav.inbox": "Messages",
    "nav.premium": "Premium",
    "nav.shop": "Shop & coins",
    "nav.settings": "Settings",
    "nav.foot": "BigWW — find a squad to play with. Have fun and play fair.",
    "user.guest": "Guest",
    "user.notLogged": "Not signed in",
    "user.logged": "Signed in",
    "user.loginBtn": "Sign in / Register",
    "user.logout": "Sign out",
    "nav.giveaways": "Giveaways",
    "gw.title": "Giveaways",
    "gw.sub": "Community draws on BigWW. Account required to enter. Demo layer — prizes are not shipped automatically.",
    "gw.history": "History",

    "footer.tagline": "BigWW — find a squad to play with.",
    "footer.terms": "Terms",
    "footer.privacy": "Privacy Policy",
    "footer.cookies": "Cookies",
    "footer.contact": "Contact",
    "footer.copy": "© BigWW. Demo prototype.",
    "cookie.text": "We use essential browser storage (localStorage) for session and preferences. Marketing analytics are off. See the Privacy Policy for details.",
    "cookie.accept": "Accept",
    "cookie.essential": "Essential only",
    "cookie.aria": "Cookie consent",
    "user.verifyEmail": "Verify email",
    "user.unverified": "email not verified",
    "user.verified": "verified",
    "user.settings": "Settings",
    "user.account": "Account",

    "home.looking": "Looking now",
    "home.lookingNote": "Your listings rank higher in “online” sort",
    "home.lookingOff": "Turn off",
    "home.online": "players online now",
    "home.hero": "Don’t play alone when someone nearby wants the same.",
    "home.heroP": "Pick a game, set region and play hours — find people who match your style, without random matchmaking or three Discords at once.",
    "home.ctaPlayers": "Browse players",
    "home.ctaAdd": "Post your listing",
    "home.topGames": "Most searched games",
    "home.allGames": "full library →",
    "home.newest": "Newest listings",
    "home.allPlayers": "see all →",
    "home.statAds": "active listings",
    "home.statGames": "games in library",
    "home.statTeams": "teams looking for members",
    "home.statDay": "listings from last 24h",
    "players.title": "Find players",
    "players.sub": "Filter by game, region, platform and play hours. Results are ordered from newest listings.",
    "players.lookingOn": "You’re marked as “looking now”",
    "players.lookingNote": "Your cards rank higher when sorting by online",
    "players.btnLooking": "🟢 Turn on “Looking now”",
    "players.search": "Search by nick, game, description or tag",
    "players.searchPh": "e.g. Valorant, casual, PL, ranked",
    "players.game": "Game",
    "players.region": "Country",
    "players.plat": "Platform",
    "players.style": "Play style",
    "players.hours": "Play hours",
    "players.sort": "Sort",
    "players.sortNew": "Newest",
    "players.sortOnline": "Online first",
    "players.sortHours": "Most hours",
    "players.sortRating": "Best rating",
    "players.reset": "Clear filters",
    "players.allGames": "All games",
    "players.allRegions": "All countries",
    "players.anyPlat": "Any platform",
    "players.anyStyle": "Any style",
    "players.from": "From",
    "players.to": "To",
    "quick.on": "Online only",
    "quick.mic": "With mic",
    "quick.new": "Fresh (24 h)",
    "quick.learn": "Teaching newbies",
    "quick.pl": "Polish speakers",
    "games.title": "Game library",
    "games.sub": "Click a game to see everyone currently looking for a squad.",
    "games.search": "Search games",
    "games.searchPh": "e.g. Rust, CS2, Elden Ring, Farming Simulator",
    "games.all": "All",
    "teams.title": "Teams looking for members",
    "teams.sub": "Groups with open slots. Open slots show how many people are still needed.",
    "teams.search": "Search team or game",
    "teams.searchPh": "e.g. Rust, clan, tournament, casual",
    "live.title": "Live — playing right now",
    "live.sub": "Streamers and players looking for a squad live. Watching streams requires Premium or a one-time WW coin fee.",
    "live.search": "Search stream or game",
    "live.searchPh": "e.g. CS2, Valorant, Rust",
    "live.sort": "Sort",
    "live.sortViewers": "Most viewers",
    "live.sortNew": "Newest",
    "add.title": "Post a listing",
    "add.sub": "Your listing goes to the player list. You can attach a clip or screenshot.",
    "add.nick": "Nick",
    "add.age": "Age",
    "add.game": "Game",
    "add.region": "Country",
    "add.plat": "Platform",
    "add.style": "Play style",
    "add.hours": "Play hours",
    "add.mic": "Microphone",
    "add.contact": "Contact",
    "add.contactPh": "e.g. discord: nick#0001",
    "add.desc": "Description",
    "add.descPh": "What are you looking for? e.g. Looking for two people for evening ranked, chill play, no yelling.",
    "add.clip": "Clip / video (YouTube, Twitch or Medal link)",
    "add.clipNote": "Paste a public link — preview in the listing.",
    "add.file": "Screenshot / recording from disk",
    "add.fileClear": "Remove file",
    "add.fileNote": "Add a screenshot or short clip to your listing.",
    "add.tags": "Tags (max 4)",
    "add.submit": "Publish listing",
    "add.clear": "Clear form",
    "add.preview": "Preview",
    "add.previewNote": "A good listing says three things: what you play, when, and what you expect from the squad. The rest comes in chat.",
    "mine.title": "My listings",
    "mine.sub": "Manage your listings — edit, boost or delete anytime.",
    "saved.title": "Watchlisted players",
    "saved.sub": "People you starred.",
    "prem.title": "BigWW Premium",
    "prem.sub": "Your listing goes to the top of results and is seen right away. Everything else stays free — Premium doesn’t block browsing or messaging.",
    "prem.faq": "FAQ",
    "shop.title": "Shop & WW coins",
    "shop.sub": "Earn coins by watching ads, boost a listing or invite friends.",
    "shop.balance": "Your balance",
    "shop.watchAd": "▶ Watch ad (+15 WW)",
    "shop.packs": "Buy coins (packs)",
    "shop.packsNote": "One-time coin purchase — for those who don’t want a subscription.",
    "shop.bp": "Season Battle Pass",
    "shop.quests": "Daily quests",
    "shop.earn": "Earn coins",
    "shop.boost": "Boost listing",
    "shop.ref": "Referral program",
    "shop.coinShop": "Coin shop",
    "set.title": "Settings",
    "set.sub": "Appearance, account and privacy.",
    "set.appearance": "Appearance",
    "set.theme": "Theme",
    "set.themeDark": "Dark",
    "set.themeLight": "Light",
    "set.region": "Default country",
    "set.account": "Account",
    "set.data": "Your data",
    "set.export": "Export data",
    "set.import": "Import data",
    "set.wipe": "Delete account & data",
    "set.about": "About the library",
    "bn.home": "Home",
    "bn.players": "Players",
    "bn.live": "Live",
    "bn.add": "Post",
    "bn.shop": "Shop",
    "auth.login": "Sign in",
    "auth.register": "Register",
    "auth.nickEmail": "Nick or email",
    "auth.pass": "Password",
    "auth.doLogin": "Sign in",
    "auth.nick": "Nick",
    "auth.email": "Email",
    "auth.passMin": "Password (min. 6 characters)",
    "auth.pass2": "Repeat password",
    "auth.doReg": "Create account",
    "auth.hint": "By creating an account you accept BigWW rules. Protect your password and don’t share it.",
    "auth.close": "Close",
    "common.close": "Close",
    "common.ad": "Ad",
    "common.lookingOff": "Turn off",
    "logo.sub": "Find people to play with"
  }
};

let LANG = "pl";
function t(key) {
  const pack = I18N[LANG] || I18N.pl;
  return (pack && pack[key]) || (I18N.pl[key]) || key;
}
function setLang(lang) {
  if (lang !== "pl" && lang !== "en") return;
  LANG = lang;
  if (typeof PREF !== "undefined") {
    PREF.lang = lang;
    try { save(KEY.pref, PREF); } catch (e) {}
  }
  document.documentElement.lang = lang === "en" ? "en" : "pl";
  applyStaticI18n();
  document.querySelectorAll("#langToggle button").forEach(b => {
    b.classList.toggle("on", b.dataset.lang === lang);
  });
  // re-render dynamic views
  try {
    updateAuthUI();
    updateLookingUI();
    updateBadges();
    if (typeof renderHome === "function") renderHome();
    if (typeof renderPlayers === "function") renderPlayers(true);
    if (typeof renderGames === "function") renderGames();
    if (typeof renderTeams === "function") renderTeams();
    if (typeof renderLives === "function") renderLives();
    if (typeof renderPremium === "function") renderPremium();
    if (typeof renderShop === "function") renderShop();
    if (typeof renderSettingsPrem === "function") renderSettingsPrem();
    if (typeof renderInfo === "function") renderInfo();
    if (typeof renderMine === "function") renderMine();
    if (typeof renderSaved === "function") renderSaved();
    if (typeof rebuildFilterLabels === "function") rebuildFilterLabels();
    if (typeof renderTerms === "function" && document.getElementById("v-terms")?.classList.contains("on")) {
      const isPriv = /Privacy|Prywatności/i.test(document.getElementById("termsTitle")?.textContent || "");
      renderTerms(isPriv ? "privacy" : "terms");
    }
  } catch (e) { console.warn("i18n refresh", e); }
}

function applyStaticI18n() {
  // logo subtitle
  const logoSmall = document.querySelector(".sidebar .logo small");
  if (logoSmall) logoSmall.textContent = t("logo.sub");
  const mobileLogo = document.querySelector(".mobile-top .logo");
  // nav buttons
  const navMap = {
    home: "nav.home", players: "nav.players", games: "nav.games", teams: "nav.teams",
    live: "nav.live", giveaways: "nav.giveaways", add: "nav.add", mine: "nav.mine", saved: "nav.saved", inbox: "nav.inbox",
    premium: "nav.premium", shop: "nav.shop", settings: "nav.settings"
  };
  document.querySelectorAll("#nav button[data-v]").forEach(btn => {
    const key = navMap[btn.dataset.v];
    if (!key) return;
    const ico = btn.querySelector(".ico");
    const badge = btn.querySelector(".badge");
    const icoHtml = ico ? ico.outerHTML : "";
    const badgeHtml = badge ? badge.outerHTML : "";
    btn.innerHTML = icoHtml + " " + t(key) + badgeHtml;
  });
  const foot = document.querySelector(".side-foot");
  if (foot) {
    const links = foot.querySelector(".side-foot-links");
    const intro = t("nav.foot");
    Array.from(foot.childNodes).forEach(n => { if (n.nodeType === 3) n.remove(); });
    foot.insertBefore(document.createTextNode(intro + " "), foot.firstChild);
    const ft = document.getElementById("footerTerms");
    const fp = document.getElementById("footerPrivacy");
    if (ft) ft.textContent = LANG === "en" ? "Terms of Service" : "Regulamin serwisu";
    if (fp) fp.textContent = LANG === "en" ? "Privacy Policy" : "Polityka prywatności";
  }
  // bottom site footer
  const sf = document.getElementById("siteFooter");
  if (sf) {
    const tag = sf.querySelector(".footer-tagline");
    if (tag) tag.textContent = t("footer.tagline");
    // structure: links then copy
    const ft2 = document.getElementById("footTerms2");
    const fp2 = document.getElementById("footPrivacy2");
    const fc = document.getElementById("footContact");
    const fcook = document.getElementById("footCookies");
    if (ft2) ft2.textContent = t("footer.terms");
    if (fp2) fp2.textContent = t("footer.privacy");
    if (fc) fc.textContent = t("footer.contact");
    if (fcook) fcook.textContent = t("footer.cookies");
    const copy = sf.querySelector(".footer-copy");
    if (copy) copy.textContent = t("footer.copy");
    else {
      // last text-ish nodes
      sf.querySelectorAll("span, p").forEach(el => {
        if (/©|BigWW|Prototyp|Demo|prototype/i.test(el.textContent)) el.textContent = t("footer.copy");
      });
    }
  }
  // cookie bar
  const cbar = document.getElementById("cookieBar");
  if (cbar) {
    cbar.setAttribute("aria-label", t("cookie.aria"));
    const cp = cbar.querySelector("p");
    if (cp) {
      cp.innerHTML = t("cookie.text").replace(
        LANG === "en" ? "Privacy Policy" : "Polityce prywatności",
        '<a href="#" id="cookiePrivacyLink" style="color:var(--acc)">' + t("footer.privacy") + "</a>"
      );
      // re-bind
      const link = document.getElementById("cookiePrivacyLink");
      if (link) link.onclick = e => { e.preventDefault(); go("privacy"); };
    }
    const ca = document.getElementById("cookieAccept");
    const ce = document.getElementById("cookieEssential");
    if (ca) ca.textContent = t("cookie.accept");
    if (ce) ce.textContent = t("cookie.essential");
  }
  // bottom nav
  const bnMap = { home: "bn.home", players: "bn.players", live: "bn.live", add: "bn.add", shop: "bn.shop" };
  document.querySelectorAll("#bottomNav button[data-v]").forEach(btn => {
    const key = bnMap[btn.dataset.v];
    if (!key) return;
    const ico = btn.querySelector(".bico");
    btn.innerHTML = (ico ? ico.outerHTML : "") + t(key);
  });
  // page heads
  const setHead = (id, titleKey, subKey) => {
    const page = document.getElementById(id);
    if (!page) return;
    const h1 = page.querySelector(".head h1");
    const p = page.querySelector(".head p");
    if (h1) h1.textContent = t(titleKey);
    if (p) p.textContent = t(subKey);
  };
  setHead("v-players", "players.title", "players.sub");
  setHead("v-games", "games.title", "games.sub");
  setHead("v-teams", "teams.title", "teams.sub");
  setHead("v-live", "live.title", "live.sub");
  setHead("v-giveaways", "gw.title", "gw.sub");
  const gwH = document.querySelector("#v-giveaways .section-title h2");
  if (gwH) gwH.textContent = t("gw.history");
  setHead("v-add", "add.title", "add.sub");
  setHead("v-mine", "mine.title", "mine.sub");
  setHead("v-saved", "saved.title", "saved.sub");
  setHead("v-premium", "prem.title", "prem.sub");
  setHead("v-shop", "shop.title", "shop.sub");
  setHead("v-settings", "set.title", "set.sub");
  // home hero
  const heroH = document.querySelector("#v-home .hero h1");
  const heroP = document.querySelector("#v-home .hero p");
  if (heroH) heroH.textContent = t("home.hero");
  if (heroP) heroP.textContent = t("home.heroP");
  const ctaPlayers = document.querySelector('#v-home [data-go="players"]');
  const ctaAdd = document.querySelector('#v-home [data-go="add"]');
  if (ctaPlayers) ctaPlayers.textContent = t("home.ctaPlayers");
  if (ctaAdd) ctaAdd.textContent = t("home.ctaAdd");
  // section titles on home
  const secTitles = document.querySelectorAll("#v-home .section-title");
  if (secTitles[0]) {
    const h2 = secTitles[0].querySelector("h2");
    const a = secTitles[0].querySelector("a");
    if (h2) h2.textContent = t("home.topGames");
    if (a) a.textContent = t("home.allGames");
  }
  if (secTitles[1]) {
    const h2 = secTitles[1].querySelector("h2");
    const a = secTitles[1].querySelector("a");
    if (h2) h2.textContent = t("home.newest");
    if (a) a.textContent = t("home.allPlayers");
  }
  // looking bars
  const lbHome = document.querySelector("#lookingBarHome b");
  const lbHomeNote = document.querySelector("#lookingBarHome .note");
  const lbHomeOff = document.querySelector("#lookingOffHome");
  if (lbHome) lbHome.textContent = t("home.looking");
  if (lbHomeNote) lbHomeNote.textContent = t("home.lookingNote");
  if (lbHomeOff) lbHomeOff.textContent = t("home.lookingOff");
  const lbPl = document.querySelector("#lookingBarPlayers b");
  const lbPlNote = document.querySelector("#lookingBarPlayers .note");
  const lbPlOff = document.querySelector("#lookingOffPlayers");
  if (lbPl) lbPl.textContent = t("players.lookingOn");
  if (lbPlNote) lbPlNote.textContent = t("players.lookingNote");
  if (lbPlOff) lbPlOff.textContent = t("common.lookingOff");
  const btnLooking = document.getElementById("btnLookingOn");
  if (btnLooking) btnLooking.textContent = t("players.btnLooking");
  // filters labels
  const setLabel = (forId, key) => {
    const lab = document.querySelector('label[for="' + forId + '"]');
    if (lab) lab.textContent = t(key);
  };
  setLabel("pSearch", "players.search");
  setLabel("fGame", "players.game");
  setLabel("fRegion", "players.region");
  setLabel("fPlat", "players.plat");
  setLabel("fStyle", "players.style");
  setLabel("fSort", "players.sort");
  setLabel("gSearch", "games.search");
  setLabel("tSearch", "teams.search");
  setLabel("lSearch", "live.search");
  setLabel("lSort", "live.sort");
  // hours label (no for)
  document.querySelectorAll("#v-players .filters .field label").forEach(lab => {
    if (lab.getAttribute("for") == null && /Godziny|Play hours|Hours/i.test(lab.textContent)) lab.textContent = t("players.hours");
  });
  const pSearch = document.getElementById("pSearch");
  if (pSearch) pSearch.placeholder = t("players.searchPh");
  const gSearch = document.getElementById("gSearch");
  if (gSearch) gSearch.placeholder = t("games.searchPh");
  const tSearch = document.getElementById("tSearch");
  if (tSearch) tSearch.placeholder = t("teams.searchPh");
  const lSearch = document.getElementById("lSearch");
  if (lSearch) lSearch.placeholder = t("live.searchPh");
  // sort options
  const fSort = document.getElementById("fSort");
  if (fSort) {
    const opts = fSort.options;
    if (opts[0]) opts[0].text = t("players.sortNew");
    if (opts[1]) opts[1].text = t("players.sortOnline");
    if (opts[2]) opts[2].text = t("players.sortHours");
    if (opts[3]) opts[3].text = t("players.sortRating");
  }
  const lSort = document.getElementById("lSort");
  if (lSort) {
    if (lSort.options[0]) lSort.options[0].text = t("live.sortViewers");
    if (lSort.options[1]) lSort.options[1].text = t("live.sortNew");
  }
  const pReset = document.getElementById("pReset");
  if (pReset) pReset.textContent = t("players.reset");
  // add form
  setLabel("aNick", "add.nick");
  setLabel("aAge", "add.age");
  setLabel("aGame", "add.game");
  setLabel("aRegion", "add.region");
  setLabel("aPlat", "add.plat");
  setLabel("aStyle", "add.style");
  setLabel("aMic", "add.mic");
  setLabel("aContact", "add.contact");
  setLabel("aDesc", "add.desc");
  const aContact = document.getElementById("aContact");
  if (aContact) aContact.placeholder = t("add.contactPh");
  const aDesc = document.getElementById("aDesc");
  if (aDesc) aDesc.placeholder = t("add.descPh");
  document.querySelectorAll("#v-add .form-grid .field label").forEach(lab => {
    const txt = lab.textContent || "";
    if (/Godziny|Play hours/i.test(txt) && !lab.getAttribute("for")) lab.textContent = t("add.hours");
    if (/Klip|Clip/i.test(txt)) lab.textContent = t("add.clip");
    if (/Screen|nagranie|Screenshot/i.test(txt)) lab.textContent = t("add.file");
    if (/Tagi|Tags/i.test(txt)) lab.textContent = t("add.tags");
  });
  const aClip = document.getElementById("aClip");
  // clip note
  const clipNotes = document.querySelectorAll("#v-add .note");
  // submit / clear
  const aSubmit = document.getElementById("aSubmit");
  if (aSubmit && !aSubmit.dataset.editing) aSubmit.textContent = t("add.submit");
  const aClear = document.getElementById("aClear");
  if (aClear) aClear.textContent = t("add.clear");
  const aFileClear = document.getElementById("aFileClear");
  if (aFileClear) aFileClear.textContent = t("add.fileClear");
  const previewH = document.querySelector("#v-add .panel h3");
  if (previewH) previewH.textContent = t("add.preview");
  // settings
  setLabel("sTheme", "set.theme");
  setLabel("sRegion", "set.region");
  const sTheme = document.getElementById("sTheme");
  if (sTheme) {
    if (sTheme.options[0]) sTheme.options[0].text = t("set.themeDark");
    if (sTheme.options[1]) sTheme.options[1].text = t("set.themeLight");
  }
  document.querySelectorAll("#v-settings .panel h3").forEach(h => {
    const x = h.textContent || "";
    if (/Wygląd|Appearance/i.test(x)) h.textContent = t("set.appearance");
    if (/Konto|Account/i.test(x)) h.textContent = t("set.account");
    if (/Twoje dane|Your data/i.test(x)) h.textContent = t("set.data");
    if (/O bazie|About/i.test(x)) h.textContent = t("set.about");
  });
  const sExport = document.getElementById("sExport");
  if (sExport) sExport.textContent = t("set.export");
  const sImport = document.getElementById("sImport");
  if (sImport) sImport.textContent = t("set.import");
  const sWipe = document.getElementById("sWipe");
  if (sWipe) sWipe.textContent = t("set.wipe");
  // premium faq title
  const premFaq = document.querySelector("#v-premium .panel h3");
  if (premFaq) premFaq.textContent = t("prem.faq");
  // shop section titles
  document.querySelectorAll("#v-shop .section-title h2").forEach(h => {
    const x = h.textContent || "";
    if (/Kup monety|Buy coins/i.test(x)) h.textContent = t("shop.packs");
    if (/Battle Pass/i.test(x)) h.textContent = t("shop.bp");
    if (/Codzienne|Daily/i.test(x)) h.textContent = t("shop.quests");
    if (/Zarabiaj|Earn/i.test(x)) h.textContent = t("shop.earn");
    if (/Wypromuj|Boost/i.test(x)) h.textContent = t("shop.boost");
    if (/Program polec|Referral/i.test(x)) h.textContent = t("shop.ref");
    if (/Sklep za monety|Coin shop/i.test(x)) h.textContent = t("shop.coinShop");
  });
  const shopBal = document.querySelector("#v-shop .prem-banner div[style] > div");
  // balance label
  const balLab = document.querySelector("#v-shop .prem-banner div div");
  if (balLab && /saldo|balance/i.test(balLab.textContent || "")) balLab.textContent = t("shop.balance");
  const btnWatch = document.getElementById("btnWatchAd");
  if (btnWatch) btnWatch.textContent = t("shop.watchAd");
  // auth modal
  const tabLogin = document.getElementById("tabLogin");
  const tabReg = document.getElementById("tabRegister");
  if (tabLogin) tabLogin.textContent = t("auth.login");
  if (tabReg) tabReg.textContent = t("auth.register");
  setLabel("loginNick", "auth.nickEmail");
  setLabel("loginPass", "auth.pass");
  setLabel("regNick", "auth.nick");
  setLabel("regEmail", "auth.email");
  setLabel("regPass", "auth.passMin");
  setLabel("regPass2", "auth.pass2");
  const btnDoLogin = document.getElementById("btnDoLogin");
  if (btnDoLogin) btnDoLogin.textContent = t("auth.doLogin");
  const btnDoReg = document.getElementById("btnDoRegister");
  if (btnDoReg) btnDoReg.textContent = t("auth.doReg");
  const authHint = document.querySelector(".auth-hint");
  if (authHint) authHint.textContent = t("auth.hint");
  const authClose = document.getElementById("authClose");
  if (authClose) authClose.textContent = t("auth.close");
  // ad labels
  document.querySelectorAll(".ad-label").forEach(el => { el.textContent = t("common.ad"); });
  // online label
  const onlineLab = document.getElementById("onlineNowLab");
  if (onlineLab) onlineLab.textContent = t("home.online");
}

