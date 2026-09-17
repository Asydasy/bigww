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
  ok((await page.evaluate(() => DATA.games.length)) === 205, "katalog 205 gier przyszedł z bazy");

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
