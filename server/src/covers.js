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
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { parseGames } from "./games-file.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "..");
const OUT_DIR = path.join(ROOT, "img", "games");

// Steam czasem wyłącza / zmienia endpoint listy — próbujemy kilka adresów.
const LISTY_GIER = [
  "https://api.steampowered.com/ISteamApps/GetAppList/v2/",
  "https://api.steampowered.com/ISteamApps/GetAppList/v0002/",
  "https://api.steampowered.com/ISteamApps/GetAppList/v2/?format=json",
];
const STORE_SEARCH = "https://store.steampowered.com/api/storesearch/";

const CDN = "https://cdn.cloudflare.steamstatic.com/steam/apps";

/**
 * Numery gier wpisane ręcznie — mają pierwszeństwo przed dopasowaniem po nazwie.
 * Numer znajdziesz w adresie strony gry na Steamie:
 * store.steampowered.com/app/730/CounterStrike_2  ->  730
 */
const RECZNE_NUMERY = {
  "Counter-Strike 2": 730,
  "Dota 2": 570,
  "Team Fortress 2": 440,
  "Rust": 252490,
  "Apex Legends": 1172470,
  "PUBG: BATTLEGROUNDS": 578080,
  "Destiny 2": 1085660,
  "Warframe": 230410,
  "Path of Exile": 238960,
  "Path of Exile 2": 2694490,
  "Lost Ark": 1599340,
  "New World: Aeternum": 1063730,
  "Once Human": 2139460,
  "Sea of Thieves": 1172620,
  "Deep Rock Galactic": 548430,
  "Lethal Company": 1966720,
  "Phasmophobia": 739630,
  "Among Us": 945360,
  "Stardew Valley": 413150,
  "Terraria": 105600,
  "Minecraft": 0, // nie na Steamie jako standardowa gra
  "Grand Theft Auto V": 271590,
  "Red Dead Redemption 2": 1174180,
  "Cyberpunk 2077": 1091500,
  "The Witcher 3: Wild Hunt": 292030,
  "Elden Ring": 1245620,
  "Baldur's Gate 3": 1086940,
  "Hades": 1145360,
  "Hades II": 1145350,
  "Dead by Daylight": 381210,
  "Left 4 Dead 2": 550,
  "Payday 2": 218620,
  "Rocket League": 252950,
  "FIFA": 0,
  "EA Sports FC 25": 2669320,
  "NBA 2K25": 2338770,
  "Forza Horizon 5": 1551360,
  "Assetto Corsa": 244210,
  "iRacing": 0,
  "World of Warcraft": 0,
  "Final Fantasy XIV": 39210,
  "Guild Wars 2": 1284210,
  "Overwatch 2": 2357570,
  "Rainbow Six Siege": 359550,
  "Call of Duty: Warzone": 1962663,
  "Call of Duty: Black Ops 6": 2933620,
  "Call of Duty: Modern Warfare III": 2519060,
  "Battlefield 2042": 1517290,
  "Battlefield V": 1238840,
  "Battlefield 1": 1237950,
  "Escape from Tarkov": 3932890,
  "Hunt: Showdown 1896": 594650,
  "The Finals": 2073850,
  "Halo Infinite": 1240440,
  "Titanfall 2": 1237970,
  "Insurgency: Sandstorm": 581320,
  "Squad": 393380,
  "Arma 3": 107410,
  "Arma Reforger": 1874880,
  "Hell Let Loose": 686810,
  "VALORANT": 0,
  "League of Legends": 0,
  "Fortnite": 0,
  "Roblox": 0,
  "Genshin Impact": 0
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
  let apps = [];
  let lastErr = null;

  for (const url of LISTY_GIER) {
    try {
      log(`    próba: ${url}`);
      const res = await pobierz(url, 120);
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status}`);
        log(`    → ${res.status}, kolejny endpoint…`);
        continue;
      }
      const dane = await res.json();
      apps = dane?.applist?.apps || [];
      if (apps.length) {
        log(`    OK, pobrano w ${Math.round((Date.now() - start) / 1000)} s`);
        break;
      }
      lastErr = new Error("pusta lista");
    } catch (e) {
      lastErr = e;
      log(`    → błąd: ${e.message}`);
    }
  }

  const mapa = new Map();
  for (const app of apps) {
    if (!app.name || SMIECI.test(app.name)) continue;
    const k = klucz(app.name);
    if (!k) continue;
    const poprzedni = mapa.get(k);
    if (poprzedni === undefined || app.appid < poprzedni) mapa.set(k, app.appid);
  }

  if (!mapa.size) {
    log("    Lista Steam niedostępna — używam RECZNE_NUMERY + wyszukiwarki sklepu.");
    if (lastErr) log(`    (ostatni błąd: ${lastErr.message})`);
  } else {
    log(`    na liscie: ${apps.length} pozycji, unikalnych kluczy: ${mapa.size}`);
  }
  return mapa;
}

/** Szuka appid po nazwie w API sklepu Steam (gdy pełna lista padła). */
async function szukajAppId(nazwa) {
  const url = STORE_SEARCH + "?term=" + encodeURIComponent(nazwa) + "&l=english&cc=US";
  const res = await pobierz(url, 20);
  if (!res.ok) return null;
  const dane = await res.json();
  const items = dane?.items || [];
  const k = klucz(nazwa);
  for (const it of items) {
    if (!it || it.type !== "app" || !it.id) continue;
    if (SMIECI.test(it.name || "")) continue;
    if (klucz(it.name) === k || klucz(it.name).includes(k) || k.includes(klucz(it.name))) {
      return it.id;
    }
  }
  // pierwszy wynik typu app jako ostatnia deska
  const first = items.find((it) => it && it.type === "app" && it.id);
  return first ? first.id : null;
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

    let appid = RECZNE_NUMERY[gra.name] ?? mapa.get(klucz(gra.name));
    if (!appid || appid === 0) appid = null;
    if (!appid && !NIE_MA_NA_STEAMIE.has(gra.name) && mapa.size === 0) {
      // pełna lista Steam padła — dociągnij appid z wyszukiwarki sklepu
      try {
        appid = await szukajAppId(gra.name);
        if (appid) log(`    search: ${gra.name} → ${appid}`);
      } catch (e) {
        /* ignore */
      }
    }
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
      "var OKLADKI_Z_DYSKU = " + JSON.stringify(slugi, null, 2) + ";\n" +
      "window.OKLADKI = window.OKLADKI || {};\n" +
      "if (typeof OKLADKI_Z_DYSKU !== 'undefined' && Array.isArray(OKLADKI_Z_DYSKU)) {\n" +
      "  OKLADKI_Z_DYSKU.forEach(function (slug) { window.OKLADKI[slug] = true; });\n" +
      "}\n"
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

/** Czy ten plik jest uruchomiony bezpośrednio (nie importowany). Działa na Windows i Unix. */
function isMain() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return pathToFileURL(path.resolve(entry)).href === import.meta.url;
  } catch {
    return false;
  }
}

if (isMain()) {
  console.log("BigWW — pobieranie okładek ze Steama…");
  console.log("Katalog wyjściowy:", OUT_DIR);
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

