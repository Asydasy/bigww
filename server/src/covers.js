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
 * UWAGA: gry spoza Steama (Fortnite, Genshin, Roblox, tytuły konsolowe i
 * mobilne) nie zostaną znalezione i to jest normalne. Skrypt wypisuje je na
 * końcu — możesz im dopisać numery ręcznie w RECZNE_NUMERY poniżej.
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

/** Tytuły, których nie ma na Steamie — pomijamy bez wypisywania ostrzeżenia. */
const NIE_MA_NA_STEAMIE = new Set([
  "Fortnite", "Genshin Impact", "Honkai: Star Rail", "Wuthering Waves",
  "Zenless Zone Zero", "Roblox", "Pokémon UNITE", "Halo Infinite",
  "League of Legends", "VALORANT", "Marvel Snap", "eFootball",
  "Call of Duty: Warzone", "Call of Duty: Black Ops 6",
  "Call of Duty: Modern Warfare III", "Apex Legends", "Overwatch 2",
  "Diablo IV", "Diablo III", "World of Warcraft", "Hearthstone",
  "Heroes of the Storm", "Magic: The Gathering Arena", "Stumble Guys",
  "Brawlhalla", "Madden NFL 25", "NBA 2K25", "Destiny 2"
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

async function pobierzListe(log) {
  log("Pobieram listę gier ze Steama (to kilkanaście MB, chwilę trwa)…");
  const res = await fetch(LISTA_GIER);
  if (!res.ok) throw new Error(`Steam oddał ${res.status} przy liście gier`);
  const dane = await res.json();
  const apps = dane?.applist?.apps || [];
  log(`  na liście: ${apps.length.toLocaleString("pl-PL")} pozycji`);

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
    const res = await fetch(`${CDN}/${appid}/${plik}`);
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      // Steam potrafi oddać 200 z obrazkiem zastępczym — takie pliki są małe.
      if (buf.length > 3000) return { buf, plik };
    }
  }
  return null;
}

export async function pobierzOkladki({ force = false, log = console.log } = {}) {
  const gry = await parseGames();
  await mkdir(OUT_DIR, { recursive: true });

  const mapa = await pobierzListe(log);

  let zapisane = 0;
  let pominiete = 0;
  const bezOkladki = [];

  for (const gra of gry) {
    const plikDocelowy = path.join(OUT_DIR, slug(gra.name) + ".jpg");
    if (!force && (await istnieje(plikDocelowy))) { pominiete++; continue; }

    const appid = RECZNE_NUMERY[gra.name] ?? mapa.get(klucz(gra.name));
    if (!appid) {
      if (!NIE_MA_NA_STEAMIE.has(gra.name)) bezOkladki.push(gra.name);
      continue;
    }

    try {
      const wynik = await pobierzOkladke(appid);
      if (!wynik) { bezOkladki.push(`${gra.name} (numer ${appid}, brak pliku)`); continue; }
      await writeFile(plikDocelowy, wynik.buf);
      zapisane++;
      log(`  ✓ ${gra.name} → ${path.basename(plikDocelowy)} (${wynik.plik})`);
    } catch (err) {
      bezOkladki.push(`${gra.name} (${err.message})`);
    }
  }

  // Spis obejmuje wszystko, co leży w katalogu — także pobrane wcześniej.
  const pliki = (await readdir(OUT_DIR)).filter((f) => f.endsWith(".jpg"));
  const slugi = pliki.map((f) => f.replace(/\.jpg$/, "")).sort();
  await writeFile(
    path.join(OUT_DIR, "index.js"),
    "/* Spis pobranych okładek. Plik generowany przez: cd server && npm run covers\n" +
      `   Wygenerowano: ${new Date().toISOString()} */\n` +
      "var OKLADKI_Z_DYSKU = " + JSON.stringify(slugi, null, 2) + ";\n"
  );

  log("");
  log(`Zapisane: ${zapisane}. Pominięte (już były): ${pominiete}. W katalogu: ${pliki.length}.`);
  log(`Gier bez okładki: ${bezOkladki.length + NIE_MA_NA_STEAMIE.size} z ${gry.length}.`);
  if (bezOkladki.length) {
    log("");
    log("Nie znalazłem numeru dla tych tytułów — jeśli któryś jest na Steamie,");
    log("dopisz go do RECZNE_NUMERY w server/src/covers.js i uruchom ponownie:");
    bezOkladki.forEach((n) => log("  - " + n));
  }
  log("");
  log("Gry bez okładki zostają przy grafice generowanej — nic się nie psuje.");

  return { zapisane, pominiete, bezOkladki };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  pobierzOkladki({ force: process.argv.includes("--force") })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Nie udało się pobrać okładek:", err.message);
      process.exit(1);
    });
}
