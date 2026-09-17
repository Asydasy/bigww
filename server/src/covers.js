/**
 * Pobiera okładki gier ze Steama do katalogu img/games/.
 *
 * Uruchomienie:  cd server && npm run covers
 * Powtórne uruchomienie pomija to, co już jest — dociąga tylko brakujące.
 * Wymuszenie pobrania wszystkiego od nowa:  npm run covers -- --force
 *
 * Jak to działa:
 *  1. ściąga ze Steama listę wszystkich gier (nazwa + numer aplikacji),
 *  2. dopasowuje do niej nasze tytuły z js/data-games.js po znormalizowanej
 *     nazwie, odrzucając dodatki, dema i ścieżki dźwiękowe,
 *  3. pobiera poziomy nagłówek (460x215), a gdy go nie ma — okładkę pionową,
 *  4. zapisuje jako img/games/<slug>.jpg.
 *
 * Na końcu zapisuje spis pobranych okładek do img/games/index.js. Front wczytuje
 * ten jeden plik i wie, dla których gier ma sięgać po obrazek — bez tego
 * strzelałby o okładkę do każdej z 205 gier i dostawał 204 błędy 404.
 *
 * Spis jest plikiem JS, a nie JSON-em, celowo: przy otwarciu index.html
 * podwójnym kliknięciem przeglądarka blokuje odczyt plików z dysku przez
 * fetch(), ale zwykły <script src> wczytuje bez problemu. Gdy spisu nie ma,
 * wszystkie karty zostają przy grafice generowanej.
 *
 * UWAGA: gry spoza Steama (Fortnite, League of Legends, Genshin, Roblox,
 * tytuly konsolowe i mobilne) nie zostana znalezione i to jest normalne.
 * Skrypt wypisuje je na koncu - mozesz im dopisac numery recznie w
 * RECZNE_NUMERY ponizej.
 */
import { mkdir, writeFile, access, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parseGames } from "./games-file.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "..");
const OUT_DIR = path.join(ROOT, "img", "games");

const LISTA_GIER = "https://api.steampowered.com/ISteamApps/GetAppList/v2/";
const CDN = "https://cdn.cloudflare.steamstatic.com/steam/apps";

/**
 * Numery gier wpisane ręcznie — mają pierwszeństwo przed dopasowaniem po nazwie.
 * Numer znajdziesz w adresie strony gry na Steamie:
 * store.steampowered.com/app/730/CounterStrike_2  ->  730
 */
const RECZNE_NUMERY = {
  // "Counter-Strike 2": 730,
};

/**
 * Tytuly, ktorych na pewno nie ma na Steamie - pomijamy je bez wypisywania
 * ostrzezenia. Lista jest celowo krotka: lepiej, zeby skrypt zglosil gre za
 * duzo, niz zeby po cichu pominal taka, ktora dalo sie pobrac.
 */
const NIE_MA_NA_STEAMIE = new Set([
  "Fortnite", "League of Legends", "VALORANT", "Roblox",
  "Genshin Impact", "Honkai: Star Rail", "Zenless Zone Zero", "Wuthering Waves",
  "Pokémon UNITE", "Magic: The Gathering Arena", "Hearthstone",
  "World of Warcraft", "Heroes of the Storm"
]);
/**
 * Nazwa pliku z nazwy gry. MUSI dawać ten sam wynik co slugGry() w js/util.js —
 * inaczej front będzie szukał okładki pod innym adresem, niż zapisał skrypt.
 */
function slug(nazwa) {
  return nazwa
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Do porównywania nazw: same litery i cyfry, bez znaków i spacji. */
function klucz(nazwa) {
  return nazwa
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

const SMIECI = /(soundtrack|ost\b|demo\b|dlc\b|trailer|artbook|dedicated server|test server|playtest|beta\b|sdk\b|benchmark|pre-?order|bonus|upgrade|edition pack)/i;

async function istnieje(p) {
  try { await access(p); return true; } catch { return false; }
}

/** fetch z limitem czasu - bez tego zawieszone polaczenie wisi w nieskonczonosc. */
async function pobierz(url, sekundy) {
  try {
    return await fetch(url, { signal: AbortSignal.timeout(sekundy * 1000) });
  } catch (err) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      throw new Error(`brak odpowiedzi w ${sekundy} s od ${url}`);
    }
    throw new Error(`nie moge polaczyc sie ze Steamem (${err.cause?.code || err.message})`);
  }
}

async function pobierzListe(log) {
  log("1/3 Pobieram liste gier ze Steama (kilkanascie MB, moze potrwac minute)...");
  const start = Date.now();
  const res = await pobierz(LISTA_GIER, 120);
  if (!res.ok) throw new Error(`Steam oddal ${res.status} przy liscie gier`);
  const dane = await res.json();
  log(`    pobrano w ${Math.round((Date.now() - start) / 1000)} s`);
  const apps = dane?.applist?.apps || [];
  log(`    na liscie: ${apps.length} pozycji`);

  // Ta sama nazwa potrafi wystąpić wiele razy (dodatki, serwery, edycje).
  // Zostawiamy najniższy numer, bo to zwykle gra podstawowa.
  const mapa = new Map();
  for (const app of apps) {
    if (!app.name || SMIECI.test(app.name)) continue;
    const k = klucz(app.name);
    if (!k) continue;
    const poprzedni = mapa.get(k);
    if (poprzedni === undefined || app.appid < poprzedni) mapa.set(k, app.appid);
  }
  return mapa;
}

/**
 * Próbuje pobrać okładkę. Najpierw poziomy nagłówek (460x215), bo pasek na
 * karcie gry jest szeroki i niski — pionowa okładka 600x900 zostałaby przycięta
 * do paska nieba albo czyjegoś czoła. Pionowa idzie jako zapas.
 */
async function pobierzOkladke(appid) {
  for (const plik of ["header.jpg", "library_600x900.jpg"]) {
    const res = await pobierz(`${CDN}/${appid}/${plik}`, 30);
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      // Steam potrafi oddać 200 z obrazkiem zastępczym — takie pliki są małe.
      if (buf.length > 3000) return { buf, plik };
    }
  }
  return null;
}

/** Ile obrazkow pobieramy naraz. Wiecej = szybciej, ale Steam zaczyna odmawiac. */
const NARAZ = 8;

export async function pobierzOkladki({ force = false, log = console.log } = {}) {
  log("");
  log("=== BigWW: pobieranie okladek gier ze Steama ===");
  log(`Node ${process.version}. Okladki trafia do: ${OUT_DIR}`);
  log("Jesli ponizej nic sie nie dzieje przez kilka minut, przerwij Ctrl+C");
  log("i wklej to, co widzisz - to znaczy, ze Steam nie odpowiada.");
  log("");

  const gry = await parseGames();
  log(`0/3 Wczytalem ${gry.length} tytulow z js/data-games.js`);
  await mkdir(OUT_DIR, { recursive: true });

  const mapa = await pobierzListe(log);

  // Ustalamy, co w ogole trzeba pobrac, zanim ruszymy z siecia.
  const doPobrania = [];
  let pominiete = 0;
  const bezNumeru = [];

  for (const gra of gry) {
    const plikDocelowy = path.join(OUT_DIR, slug(gra.name) + ".jpg");
    if (!force && (await istnieje(plikDocelowy))) { pominiete++; continue; }

    const appid = RECZNE_NUMERY[gra.name] ?? mapa.get(klucz(gra.name));
    if (!appid) {
      if (!NIE_MA_NA_STEAMIE.has(gra.name)) bezNumeru.push(gra.name);
      continue;
    }
    doPobrania.push({ gra, appid, plikDocelowy });
  }

  log("");
  log(`2/3 Do pobrania: ${doPobrania.length} okladek. Juz mam: ${pominiete}.`);
  if (!doPobrania.length) log("    Nie ma czego pobierac.");

  let zapisane = 0;
  let zrobione = 0;
  const bezPliku = [];

  // Pobieramy paczkami, zeby nie czekac na kazdy obrazek po kolei.
  for (let i = 0; i < doPobrania.length; i += NARAZ) {
    const paczka = doPobrania.slice(i, i + NARAZ);
    await Promise.all(
      paczka.map(async ({ gra, appid, plikDocelowy }) => {
        try {
          const wynik = await pobierzOkladke(appid);
          if (!wynik) {
            bezPliku.push(`${gra.name} (numer ${appid}, Steam nie ma obrazka)`);
          } else {
            await writeFile(plikDocelowy, wynik.buf);
            zapisane++;
          }
        } catch (err) {
          bezPliku.push(`${gra.name} (${err.message})`);
        } finally {
          zrobione++;
          // \r nadpisuje te sama linie, wiec konsola nie zalewa sie tekstem.
          process.stdout.write(`    ${zrobione}/${doPobrania.length} (zapisanych: ${zapisane})\r`);
        }
      })
    );
  }
  if (doPobrania.length) process.stdout.write("\n");

  // Spis obejmuje wszystko, co lezy w katalogu - takze pobrane wczesniej.
  const pliki = (await readdir(OUT_DIR)).filter((f) => f.endsWith(".jpg"));
  const slugi = pliki.map((f) => f.replace(/\.jpg$/, "")).sort();
  await writeFile(
    path.join(OUT_DIR, "index.js"),
    "/* Spis pobranych okladek. Plik generowany przez: cd server && npm run covers\n" +
      `   Wygenerowano: ${new Date().toISOString()} */\n` +
      "var OKLADKI_Z_DYSKU = " + JSON.stringify(slugi, null, 2) + ";\n"
  );

  const bezOkladki = bezNumeru.concat(bezPliku);

  log("");
  log(`3/3 Gotowe. Zapisane teraz: ${zapisane}. W katalogu lacznie: ${pliki.length} z ${gry.length} gier.`);
  log(`    Spis zapisany do img/games/index.js`);

  if (bezOkladki.length) {
    log("");
    log("Bez okladki (jesli ktorys jest na Steamie, dopisz numer do RECZNE_NUMERY");
    log("w server/src/covers.js i uruchom ponownie):");
    bezOkladki.forEach((n) => log("  - " + n));
  }
  log("");
  log("Gry bez okladki zostaja przy grafice generowanej - nic sie nie psuje.");
  log("Odswiez strone z Ctrl+F5, zeby zobaczyc zmiane.");

  return { zapisane, pominiete, bezOkladki };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  pobierzOkladki({ force: process.argv.includes("--force") })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("");
      console.error("BLAD: " + err.message);
      console.error("");
      console.error("Co sprawdzic:");
      console.error("  - czy masz internet i czy strona store.steampowered.com otwiera sie w przegladarce");
      console.error("  - czy firewall albo VPN nie blokuje Node.js");
      console.error("  - okladki sa opcjonalne: bez nich strona dziala, tylko kafelki maja grafike generowana");
      process.exit(1);
    });
}
