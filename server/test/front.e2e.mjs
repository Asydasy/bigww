/**
 * Przeklikanie frontu w obu trybach — serwerowym i lokalnym.
 *
 * Czego pilnuje: że strona rozpoznaje backend, że konto i ogłoszenie robią się
 * naprawdę w bazie, że przeżywają przeładowanie, że niezalogowany nie dostaje
 * kontaktu, i że po odcięciu API ta sama strona wraca na dane lokalne.
 *
 * Wymaga: uruchomionego serwera z SERVE_STATIC=1 (docker compose up) oraz
 * Playwrighta: cd server && npm install && npx playwright install chromium
 *
 * Uruchomienie:  cd server && npm run test:front
 * Inny adres:    BIGWW_URL=http://localhost:8000/index.html npm run test:front
 *
 * Test dopisuje do bazy jedno konto i jedno ogłoszenie — puszczaj go na tej
 * samej bazie, na której testujesz ręcznie, albo na osobnej.
 */
import { chromium } from "playwright";

const BASE = process.env.BIGWW_URL || "http://127.0.0.1:3000/index.html";
const mail = `e2e${Date.now()}@example.com`;
const nick = "e2eGracz" + String(Date.now()).slice(-5);
const haslo = "haslo-testowe-e2e";

const bledy = [];
const ok = (warunek, opis) => {
  console.log(`${warunek ? "  ok  " : " BLAD "} ${opis}`);
  if (!warunek) bledy.push(opis);
};

/** Splash, onboarding i pasek cookies zasłaniają stronę przy pierwszym wejściu. */
async function odsloniec(page) {
  await page.evaluate(() => {
    try {
      PREF.onboarded = true;
      save(KEY.pref, PREF);
      localStorage.setItem("bigww_cookie_v1", JSON.stringify({ mode: "all", at: Date.now() }));
    } catch (e) {}
    document.getElementById("onboard")?.classList.remove("on");
    document.getElementById("cookieBar")?.classList.remove("on");
    document.getElementById("splash")?.remove();
  });
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--no-sandbox"]
});

try {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const bledyStrony = [];
  page.on("pageerror", e => bledyStrony.push(e.message));

  /* ---------- tryb serwerowy ---------- */
  console.log("\nTryb serwerowy (" + BASE + ")");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await odsloniec(page);

  const tryb = (await page.textContent("#dataMode")) || "";
  ok(tryb.includes("serwer"), `stopka pokazuje tryb serwerowy (jest: "${tryb.trim()}")`);
  ok((await page.evaluate(() => DATA.mode)) === "api", "DATA.mode = api");
  // Ile gier ma być, mówi katalog z bazy — nie liczba wpisana w test. Dopisanie
  // tytułu do js/data-games.js nie ma wywracać testu frontu.
  const ileGier = (await (await fetch(BASE.replace("/index.html", "") + "/api/games")).json()).games.length;
  ok((await page.evaluate(() => DATA.games.length)) === ileGier, `katalog ${ileGier} gier przyszedł z bazy`);

  const przed = await page.evaluate(() => allPlayers().length);

  // rejestracja
  await page.click("#btnLoginOpen");
  await page.click("#tabRegister");
  await page.fill("#regNick", nick);
  await page.fill("#regEmail", mail);
  await page.fill("#regPass", haslo);
  await page.fill("#regPass2", haslo);
  await page.click("#btnDoRegister");
  await page.waitForTimeout(1200);

  ok(await page.evaluate(() => isLoggedIn()), "po rejestracji jesteśmy zalogowani");
  ok((await page.evaluate(() => (currentUser() || {}).nick)) === nick, "konto z bazy ma nick z formularza");

  // dodanie ogłoszenia
  await page.evaluate(() => go("add"));
  await page.waitForTimeout(300);
  await page.fill("#aNick", nick);
  await page.fill("#aAge", "29");
  await page.fill("#aDesc", "Szukam ekipy na wieczorne rankedy, bez krzyku i bez spiny.");
  await page.fill("#aContact", "discord: e2e#0001");
  if (await page.$("#aRank")) await page.selectOption("#aRank", "high").catch(() => {});
  await page.evaluate(() => document.getElementById("aSubmit").click());
  await page.waitForTimeout(1200);

  ok((await page.evaluate(() => MINE.length)) === 1, "ogłoszenie trafiło na „moje”");
  ok((await page.evaluate(() => allPlayers().length)) === przed + 1, "ogłoszenie doszło do listy graczy");
  ok((await page.evaluate(() => (MINE[0] || {}).rank)) === "high", "ranga doszła do bazy i wróciła");

  // przeładowanie
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await odsloniec(page);
  ok(await page.evaluate(() => isLoggedIn()), "sesja przeżywa przeładowanie (ciasteczko httpOnly)");
  ok((await page.evaluate(() => MINE.length)) === 1, "ogłoszenie przeżywa przeładowanie");

  // obserwowanie
  const idOgl = await page.evaluate(() => MINE[0].id);
  await page.evaluate(id => toggleSave(id), idOgl);
  await page.waitForTimeout(600);
  ok((await page.evaluate(() => SAVED.length)) === 1, "obserwowanie zapisuje się na serwerze");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await odsloniec(page);
  ok((await page.evaluate(() => SAVED.length)) === 1, "obserwowani przeżywają przeładowanie");

  // „szukam teraz" ląduje w bazie, nie tylko w przeglądarce
  await page.evaluate(() => setLooking(true));
  await page.waitForTimeout(1000);
  const looking = await page.evaluate(async () => (await API.ads({ lookingNow: true })).total);
  ok(looking >= 1, "„szukam teraz” zapisało się w bazie");

  // gość: widzi ogłoszenie, nie widzi kontaktu
  const gosc = await browser.newContext();
  const stronaGoscia = await gosc.newPage();
  await stronaGoscia.goto(BASE, { waitUntil: "networkidle" });
  await stronaGoscia.waitForTimeout(1200);
  await odsloniec(stronaGoscia);
  const widok = await stronaGoscia.evaluate(id => {
    const p = allPlayers().find(x => x.id === id);
    return p ? { kontakt: p.contact, locked: p.contactLocked, napis: contactStr(p) } : null;
  }, idOgl);
  ok(widok !== null, "niezalogowany widzi cudze ogłoszenie");
  ok(widok && widok.kontakt === null && widok.locked === true, "niezalogowany nie dostaje kontaktu z serwera");
  ok(widok && /ukryty/.test(widok.napis), "karta mówi, że kontakt jest ukryty");

  /* ---------- czat ogólny ---------- */
  console.log("\nCzat ogólny");
  await page.evaluate(() => ustawCzatOtwarty(true));
  await page.waitForTimeout(800);
  ok(await page.isVisible("#chatForm"), "panel czatu otwiera się w menu bocznym");

  const tekstCzatu = "Test e2e " + Date.now();
  await page.fill("#chatInput", tekstCzatu);
  await page.evaluate(() => document.getElementById("chatSend").click());
  await page.waitForTimeout(900);
  const mojaNaLiscie = await page.textContent("#chatList");
  ok(mojaNaLiscie.includes(tekstCzatu), "wysłana wiadomość pojawia się w panelu");

  // licznik aktywnych w nagłówku czatu — inna liczba niż ta na Starcie
  const licznik = (await page.textContent("#chatOnline")) || "";
  ok(/\d+\s+aktywn/.test(licznik), `nagłówek czatu pokazuje aktywnych (jest: "${licznik.trim()}")`);
  const dwaLiczniki = await page.evaluate(() => ({
    czat: document.getElementById("chatOnline").textContent,
    start: document.getElementById("onlineNow").textContent
  }));
  ok(
    !/aktywn/.test(dwaLiczniki.start),
    "licznik na Starcie mówi o czym innym niż ten przy czacie (nie powiela nazwy)"
  );

  // druga przeglądarka widzi to samo, bez przeładowania strony
  await stronaGoscia.evaluate(() => ustawCzatOtwarty(true));
  await stronaGoscia.waitForTimeout(6500); // jedno odpytanie co 5 s
  const uGoscia = await stronaGoscia.textContent("#chatList");
  ok(uGoscia.includes(tekstCzatu), "druga przeglądarka dostaje wiadomość przez odpytywanie");
  ok(!(await stronaGoscia.isEnabled("#chatInput")), "gość nie może pisać, ale czyta");

  // XSS: treść ma trafić na stronę jako tekst, nie jako znacznik
  const zlosliwa = "<img src=x onerror=alert(1)> " + Date.now();
  await page.fill("#chatInput", zlosliwa);
  await page.evaluate(() => document.getElementById("chatSend").click());
  await page.waitForTimeout(900);
  const bezObrazka = await page.evaluate(() => ({
    obrazki: document.querySelectorAll("#chatList img").length,
    tekst: document.getElementById("chatList").textContent
  }));
  ok(bezObrazka.obrazki === 0, "cudza treść nie staje się znacznikiem HTML");
  ok(bezObrazka.tekst.includes("<img"), "znaczniki widać jako zwykły tekst");

  // Prywatne wiadomości: ta sama zasada co na czacie — cudza treść wchodzi
  // jako tekst, nigdy jako znacznik. Piszemy z DRUGIEGO konta, żeby sprawdzić
  // dokładnie tę drogę, którą leci cudza wiadomość: przeglądarka -> baza ->
  // moja skrzynka.
  const dmZlosliwa = "<img src=x onerror=alert(2)> " + Date.now();
  const mojeOgloszenie = await page.evaluate(() => (MINE[0] || {}).id);

  await stronaGoscia.evaluate(async (tekst) => {
    await DATA.register({
      email: "dm" + Date.now() + "@example.com",
      password: "haslo-testowe-dm",
      displayName: "PiszeDoCiebie"
    });
  }, dmZlosliwa);
  await stronaGoscia.evaluate(async ([id, tekst]) => {
    await DATA.dmSend({ adId: id, nick: "autor" }, tekst);
  }, [mojeOgloszenie, dmZlosliwa]);

  await page.evaluate(async () => { await refreshInbox(); go("inbox"); });
  await page.waitForTimeout(700);
  const dmBezObrazka = await page.evaluate(() => ({
    obrazki: document.querySelectorAll("#inboxList img").length,
    tekst: document.getElementById("inboxList").textContent
  }));
  ok(dmBezObrazka.obrazki === 0, "treść prywatnej wiadomości nie staje się znacznikiem HTML");
  ok(dmBezObrazka.tekst.includes("<img"), "znaczniki w skrzynce widać jako zwykły tekst");
  ok(dmBezObrazka.tekst.includes("PiszeDoCiebie"), "wątek podpisany nazwą konta nadawcy, nie tym, co przyszło w payloadzie");
  await page.evaluate(() => go("home"));

  // kasowanie własnej wiadomości
  await page.evaluate(() => document.querySelector("#chatList .chat-msg .chat-del").click());
  await page.waitForTimeout(800);
  ok(
    (await page.textContent("#chatList")).includes("wiadomość usunięta"),
    "skasowana wiadomość zostawia ślad zamiast znikać"
  );

  // wylogowanie
  await page.evaluate(() => doLogout());
  await page.waitForTimeout(1000);
  ok(!(await page.evaluate(() => isLoggedIn())), "wylogowanie działa");
  ok((await page.evaluate(() => MINE.length)) === 0, "po wylogowaniu nie ma „moich” ogłoszeń");
  ok((await page.evaluate(() => allPlayers().length)) === przed + 1, "cudze ogłoszenia dalej widać");

  /* ---------- tryb lokalny ---------- */
  console.log("\nTryb lokalny (backend odcięty)");
  const lokalny = await browser.newContext();
  const strona = await lokalny.newPage();
  const bledyLokalne = [];
  strona.on("pageerror", e => bledyLokalne.push(e.message));
  await strona.route("**/api/**", route => route.abort());
  await strona.goto(BASE, { waitUntil: "domcontentloaded" });
  await strona.waitForTimeout(2500);
  await odsloniec(strona);

  const trybL = (await strona.textContent("#dataMode")) || "";
  ok(trybL.includes("lokalnie"), `stopka pokazuje tryb lokalny (jest: "${trybL.trim()}")`);
  ok((await strona.evaluate(() => allPlayers().length)) === 720, "720 wygenerowanych graczy");

  await strona.evaluate(() => ustawCzatOtwarty(true));
  await strona.waitForTimeout(600);
  const czatLokalnie = await strona.textContent("#chatList");
  ok(/tylko z uruchomionym serwerem/.test(czatLokalnie), "czat mówi wprost, że bez serwera nie działa");
  ok(!(await strona.isVisible("#chatForm")), "bez serwera nie ma pola do pisania");

  await strona.click("#btnLoginOpen");
  await strona.click("#tabRegister");
  await strona.fill("#regNick", "lokalny");
  await strona.fill("#regEmail", "lokalny@example.com");
  await strona.fill("#regPass", "haslo1");
  await strona.fill("#regPass2", "haslo1");
  await strona.click("#btnDoRegister");
  await strona.waitForTimeout(700);
  ok(await strona.evaluate(() => isLoggedIn()), "konto lokalne dalej działa bez backendu");

  await strona.evaluate(() => go("add"));
  await strona.waitForTimeout(300);
  await strona.fill("#aNick", "lokalny");
  await strona.fill("#aAge", "30");
  await strona.fill("#aDesc", "Lokalne ogłoszenie testowe, wieczorami po pracy.");
  await strona.evaluate(() => document.getElementById("aSubmit").click());
  await strona.waitForTimeout(700);
  ok((await strona.evaluate(() => MINE.length)) === 1, "ogłoszenie lokalne zapisane w localStorage");
  ok((await strona.evaluate(() => allPlayers().length)) === 721, "moje ogłoszenie doszło do listy demo");

  ok(bledyStrony.length === 0, `brak wyjątków JS w trybie serwerowym ${JSON.stringify(bledyStrony.slice(0, 2))}`);
  ok(bledyLokalne.length === 0, `brak wyjątków JS w trybie lokalnym ${JSON.stringify(bledyLokalne.slice(0, 2))}`);
} finally {
  await browser.close();
}

console.log("\n" + (bledy.length ? `NIEPOWODZENIA: ${bledy.length}` : "Wszystko przeszło."));
process.exit(bledy.length ? 1 : 0);
