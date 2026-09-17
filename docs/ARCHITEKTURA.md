# Architektura

Projekt ma dwie części: front (katalog główny) i backend (`server/`).
Ten plik opisuje front; backend ma własny `server/README.md`.

**Front i backend nie są ze sobą spięte.** Front w wersji 1.0.0 działa
wyłącznie na generatorze i localStorage. Warstwy `DATA`, która kiedyś wybierała
między serwerem a danymi demo, już nie ma.

## Układ plików

```
index.html              markup — 15 sekcji .page, modale, splash, lista skryptów
css/style.css           całe style
img/games/index.js      spis pobranych okładek (poza repo, tworzy go skrypt)
js/data-games.js        baza 205 gier jako tekst -> tablica GAMES
js/util.js              $, el, norm, nf, tokens, regionMatches, searchScore,
                        playerSearchFields, ago, toast, fillSelect, slugGry
js/i18n.js              I18N (pl / en, ~180 kluczy każdy), LANG, t(), setLang(),
                        applyStaticI18n()
js/data-demo.js         generator demo: PLAYERS (720), TEAMS (80), LIVES (36),
                        avatarArt/coverArt jako SVG, godziny: fmtHour, timeLabel,
                        hoursOverlap, fillHourSelect, LIVE_TICKET_COST
js/state.js             localStorage: KEY, SCOPED_KEYS, USERS, SESSION,
                        load/save z podziałem na konta, hashPass, powiadomienia,
                        blokady, zgłoszenia, skrzynka, oceny, matchScore,
                        stałe cenowe, adLimit(), canSeeContact()
js/api.js               ZAŚLEPKA — dwie linie komentarza. API żyje w boot.js
js/data-source.js       ZAŚLEPKA — po usuniętej warstwie DATA
js/auth-ui.js           rejestracja, logowanie, „Google/Discord", telefon,
                        weryfikacja e-maila, menu konta, requireLogin()
js/nav.js               go(view), AUTH_REQUIRED_VIEWS, zwijanie sidebara,
                        setLooking(), applyAuthVisibility()
js/cards.js             playerCard, gameCard, teamCard, renderProfilePage,
                        showContact, openModal, toggleSave, podgląd mediów
js/view-players.js      QUICK (5 szybkich filtrów), zestawy filtrów, siatka/lista,
                        filterPlayers(), renderPlayers()
js/view-games.js        baza gier z filtrem gatunku
js/view-teams-live.js   ekipy oraz transmisje live
js/view-add.js          formularz ogłoszenia, szablony opisu, podgląd, submitAd,
                        edycja, renderMine, renderSaved
js/view-home.js         strona startowa i statystyki
js/view-premium.js      PLANS, checkout (udawany), FAQ
js/view-settings.js     motyw, kraj, eksport/import JSON, kasowanie danych
js/view-terms.js        regulamin i polityka prywatności (PL + EN)
js/view-inbox.js        ZAŚLEPKA — skrzynka siedzi w state.js
js/view-giveaways.js    GIVEAWAYS (4 losowania), bilety, historia
js/monetization.js      monety WW, sklep, zadania, battle pass, reklamy,
                        polecenia, interstitial, karta sponsorowana
                        oraz OPAKOWANIA go / renderPlayers / submitAd
js/onboard.js           onboarding przy pierwszym wejściu
js/main.js              start aplikacji — kolejność wywołań, skróty, deep linki
js/boot.js              APP_VERSION, API (adapter na localStorage), splash,
                        pasek cookies, service worker, window.BigWW
```

## Kolejność ładowania

Skrypty są zwykłymi `<script src>`, ładowanymi w kolejności zapisanej
w `index.html`. Nie ma modułów ES — wszystko żyje w zasięgu globalnym, więc
**kolejność ma znaczenie**:

1. `img/games/index.js` — spis okładek, przed `cards.js`
2. `js/data-games.js`
3. `js/util.js` — **przed** `data-demo.js`, bo generator woła `timeLabel()`
   już przy ładowaniu
4. `js/i18n.js` — przed `state.js`, bo `loadUserData()` ustawia `LANG`
5. `js/data-demo.js`, `js/state.js`, `js/api.js`, `js/data-source.js`
6. `js/auth-ui.js`, `js/nav.js`, `js/cards.js`, widoki
7. `js/monetization.js` — **musi być po** `nav.js`, `view-players.js`
   i `view-add.js`, bo opakowuje ich funkcje (patrz niżej)
8. `js/onboard.js`
9. `js/main.js` — uruchamia aplikację
10. `js/boot.js` — splash, cookies, PWA; ostatni

Przy dokładaniu nowego pliku: dopisz `<script src>` w odpowiednim miejscu listy,
nie na końcu.

## Opakowywanie funkcji (uwaga, wróciło)

Koniec `js/monetization.js` podmienia trzy funkcje:

```js
const _goOrig = go;            go = function (view) { _goOrig(view); maybeShowInterstitial(); };
const _renderPlayersOrig = renderPlayers;   // dokłada kartę sponsorowaną
const _submitAdOrig = submitAd;             // zalicza dzienne zadanie „post"
```

We wrześniu 2026 ten wzorzec został usunięty, a potem wrócił razem ze scaleniem
równoległej wersji frontu. Działa, ale ma dwa warunki:

- `monetization.js` musi ładować się **po** plikach z oryginałami,
- nikt inny nie może opakowywać tych samych funkcji drugi raz.

Nowe punkty wejścia rób zwykłym wywołaniem na końcu funkcji, nie kolejnym
opakowaniem. Jeśli będziesz przepisywać monetyzację — te trzy miejsca zamień
na wywołania i usuń podmiany.

## Dwa tryby? Już nie

`STORAGE_MODE` w `js/boot.js` ma wartość `"local"` i nie ma drugiej gałęzi.
`API` z `boot.js` to adapter na localStorage z trzema metodami (`getPlayers`,
`saveListing`, `health`) — żadna z nich nie wychodzi w sieć. Widoki i tak wołają
bezpośrednio globalne tablice (`PLAYERS`, `MINE`, `TEAMS`, `LIVES`) i `save()`.

Backend w `server/` jest kompletny i przetestowany, ale front go nie zna.
Ewentualny powrót do trybu serwerowego opisuje `docs/TODO.md`, punkt 0.

## Konta i podział danych

`js/state.js` trzyma listę kont w `bigww_users_v2`, a sesję w
`bigww_session_v2`. Wszystko, co należy do konkretnego użytkownika, idzie pod
klucz z przyrostkiem:

```js
scopeSuffix()  ->  "_u_<id>"  albo  "_guest"
resolveKey(k)  ->  SCOPED_KEYS.has(k) ? k + scopeSuffix() : k
load/save      ->  zawsze przez resolveKey()
```

Dzięki temu dwa konta w tej samej przeglądarce mają osobne ogłoszenia, monety
i skrzynki. Klucze spoza `SCOPED_KEYS` (`bigww_users_v2`, `bigww_session_v2`,
`bigww_cookie_v1`, `bigww_gw_entries`, `bigww_gw_day`, `bigww_extra_slot`,
`bigww_unlock_cred`) są wspólne dla całej przeglądarki.

Jednorazowa migracja starych, nieprzypisanych danych do gościa siedzi w
`migrateLegacy()` i zapisuje znacznik `bigww_migrated_v3`.

Hasła: `hashPass()` liczy SHA-256 z soli i hasła przez `crypto.subtle`, a gdy
go nie ma — FNV-1a. **To zabezpieczenie na pokaz**: hash leży w localStorage
obok konta.

## Gość kontra zalogowany

`AUTH_REQUIRED_VIEWS` w `js/nav.js` wymienia widoki dostępne dopiero po
zalogowaniu: `add`, `mine`, `saved`, `inbox`, `premium`, `shop`. Pilnują tego:

- `go()` — przy każdym przejściu woła `requireLogin()` z nazwą akcji,
- `applyAuthVisibility()` — chowa te pozycje w menu razem z saldem monet.

## Okładki gier

Kafelek gry ma dwie warstwy tła: prawdziwą okładkę z `img/games/<slug>.jpg`
i pod nią grafikę generowaną z nazwy. Gdy pliku nie ma, widać drugą warstwę.

Które gry mają okładkę, mówi `img/games/index.js` — jeden spis wczytywany
zwykłym `<script src>` do zbioru `OKLADKI` w `js/cards.js`. Plik JS, a nie
JSON, bo przy otwarciu `index.html` podwójnym kliknięciem przeglądarka blokuje
`fetch()` do plików z dysku.

`slugGry()` w `js/util.js` i `slug()` w `server/src/covers.js` **muszą dawać ten
sam wynik** — inaczej front szuka pliku pod innym adresem, niż zapisał skrypt.

Katalog `img/games/` jest poza repozytorium: to kilka MB cudzych plików.
Po sklonowaniu repozytorium uruchamia się `cd server && npm run covers`.

## Godziny grania

Ogłoszenie ma `hourFrom` i `hourTo` (0–23). Zakres może przechodzić przez
północ. Nachodzenie liczy `hoursOverlap()` w `js/data-demo.js`. Ta sama logika
istnieje w bazie jako `bigww_hours_overlap()` — dopóki backend jest odłączony,
nie da się ich rozjechać w praktyce, ale przy powrocie do trybu serwerowego
trzeba je zestawić.

## Model danych

**Gra**
```js
{ id, name, genre, mode, plats: ["PC","PS",...], pop: 1..5 }
```

**Gracz / ogłoszenie**
```js
{ id, nick, age, region, game, gameId, plat, style, rank, time,
  hourFrom, hourTo, mic, lang, hours, rating, status, prem,
  days: ["mon","fri"], tags: [], desc, added, mine, ownerId?,
  contact?, clipUrl?, fileData?, fileType? }
```
`rank` to jedno z `beginner` / `mid` / `high` / `pro` (etykiety w `RANK_LABEL`).
`days` to dni tygodnia z `WEEK_DAYS`. `mine: true` oznacza ogłoszenie
użytkownika (tablica `MINE`, zawsze na górze listy); `ownerId` wiąże je
z kontem. `allPlayers()` zwraca `MINE.concat(PLAYERS)`.

**Konto**
```js
{ id, nick, email, emailVerified, salt?, passHash?, provider?, providerId?,
  phone?, verifyCode?, created }
```

**Ekipa**
```js
{ id, name, game, gameId, size, filled, region, style, time, minAge, desc, added }
```

**Live**
```js
{ id, nick, playerId, game, title, viewers, started, region, plat, thumb, premiumOnly }
```

**Wątek w skrzynce**
```js
{ id: "<userId>_<playerId>", withId, withNick, updated,
  messages: [{ from, fromNick, text, ts }] }
```

## Klucze localStorage

Wszystkie z prefiksem `bigww_`. Kolumna „per konto" mówi, czy klucz dostaje
przyrostek `_u_<id>` / `_guest`.

| klucz | per konto | co trzyma |
|---|---|---|
| `bigww_users_v2` | nie | lista kont (nick, e-mail, hash hasła) |
| `bigww_session_v2` | nie | zalogowane konto |
| `bigww_mine_v2` | tak | własne ogłoszenia |
| `bigww_saved_v2` | tak | obserwowani (id graczy) |
| `bigww_pref_v2` | tak | motyw, kraj, awatar, język, „szukam teraz", filtry, onboarding, widok listy |
| `bigww_premium_v2` | tak | `{active, plan, until, since}` |
| `bigww_coins_v2` | tak | `{bal, earned, spent}` — start 40 WW |
| `bigww_ref_v2` | tak | kod polecający i statystyki |
| `bigww_boosts_v2` | tak | id ogłoszenia → koniec boosta |
| `bigww_adlog_v2` | tak | licznik obejrzanych reklam w dniu |
| `bigww_msg_v2` | tak | zużyte darmowe wiadomości i odblokowania w dniu |
| `bigww_bp_v2` | tak | battle pass: poziom, XP, odebrane |
| `bigww_quests_v2` | tak | dzienne zadania |
| `bigww_unlocks_v2` | tak | id graczy z odblokowanym kontaktem |
| `bigww_nav_v2` | tak | licznik przejść (do interstitiali) |
| `bigww_livepass_v2` | tak | przepustka na wszystkie live |
| `bigww_livetickets_v2` | tak | pojedyncze wykupione streamy |
| `bigww_inbox_v2` | tak | wątki wiadomości |
| `bigww_notifs_v2` | tak | powiadomienia (maks. 50) |
| `bigww_blocked_v2` | tak | zablokowani gracze |
| `bigww_reports_v2` | tak | wysłane zgłoszenia |
| `bigww_ratings_v2` | tak | wystawione oceny |
| `bigww_presets_v2` | tak | zapisane zestawy filtrów |
| `bigww_extra_slot` | nie | koniec dodatkowego slotu ogłoszenia |
| `bigww_unlock_cred` | nie | kredyty na odblokowanie kontaktu |
| `bigww_gw_entries` | nie | udziały w giveawayach |
| `bigww_gw_day` | nie | dzienny darmowy bilet |
| `bigww_cookie_v1` | nie | zgoda na cookies |
| `bigww_migrated_v3` | nie | znacznik jednorazowej migracji |

`sWipe` w `js/view-settings.js` kasuje dziś tylko część tej tabeli — brakujące
klucze wypisuje `docs/STAN.md`, punkt 2 „Znane błędy".

## Stałe cenowe

W `js/state.js` (poza `LIVE_TICKET_COST`, które siedzi na końcu `data-demo.js`):

```
FREE_MSG_LIMIT       10 / dzień
FREE_UNLOCK_DAILY    3 / dzień
UNLOCK_CONTACT_COST  15 WW
MSG_COST             6 WW
BP_XP_PER_LEVEL      100
BP_MAX               10
LIVE_TICKET_COST     35 WW
```

W `js/monetization.js`:

```
AD_REWARD            15 WW za reklamę
AD_COOLDOWN_MS       45 000 (45 sekund między reklamami)
DAILY_AD_CAP         12 reklam dziennie
REF_BONUS            50 WW za polecenie
INTER_EVERY          10 przejść nawigacji na interstitial
BOOST_OPTS           6 h / 25 WW, 24 h / 60 WW, 72 h / 140 WW
```

Limit ogłoszeń liczy `adLimit()`: free 3, +1 z `bigww_extra_slot`, premium 10,
pro/rok 20. Te same liczby siedzą w `adLimitFor()` w `server/src/config.js` —
gdyby backend wrócił do gry, trzeba je zestawić.

Ceny planów są w `PLANS` w `js/view-premium.js`, pakiety monet w `COIN_PACKS`,
przedmioty sklepu w `SHOP_ITEMS`, nagrody battle passa w `BP_REWARDS`,
zadania w `QUEST_DEFS` — wszystkie cztery w `js/monetization.js`.

## Wielojęzyczność

`js/i18n.js` trzyma dwa obiekty tłumaczeń (`I18N.pl`, `I18N.en`), po ok. 180
kluczy. `t("nav.home")` zwraca napis w bieżącym języku, z zejściem na polski,
a na końcu na sam klucz. `setLang()` zapisuje wybór w `PREF.lang`, przestawia
`document.documentElement.lang` i przerysowuje widoki dynamiczne bez
przeładowania strony.

Napisy statyczne podmienia `applyStaticI18n()` — mapa `id -> klucz` w kodzie,
nie atrybuty w markupie. W `index.html` są tylko trzy atrybuty `data-i18n`.
Oznacza to, że **każdy nowy napis w HTML wymaga dopisania linijki w
`applyStaticI18n()`**, a napisy generowane w JavaScripcie (toasty, modale,
komunikaty błędów) są w większości po polsku na sztywno.
