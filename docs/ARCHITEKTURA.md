# Architektura

Projekt ma dwie części: front (katalog główny) i backend (`server/`).
Ten plik opisuje front; backend ma własny `server/README.md`.

Front i backend są spięte przez warstwę `DATA` (`js/data-source.js`), która
przy starcie sprawdza, czy serwer odpowiada, i działa w trybie `api` albo
`local`.

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
                        stałe cenowe, adLimit(), canSeeContact(), allPlayers()
js/api.js               surowe wywołania HTTP do serwera (API.login, API.ads, …)
js/data-source.js       DATA — jedyne wejście do zapisu danych; wybiera między
                        serwerem a danymi lokalnymi i tłumaczy kształty
js/auth-ui.js           rejestracja, logowanie, Discord, telefon (tryb lokalny),
                        rozwijane menu konta (#userMenu) z animacją,
                        requireLogin()
js/nav.js               go(view), AUTH_REQUIRED_VIEWS, zwijanie sidebara,
                        setLooking(), applyAuthVisibility(), playHomeHero()
js/cards.js             playerCard, gameCard, teamCard, renderProfilePage,
                        showContact, openModal, toggleSave, podgląd mediów
js/view-players.js      QUICK (5 szybkich filtrów), zestawy filtrów, siatka/lista,
                        filterPlayers(), renderPlayers()
js/view-games.js        baza gier z filtrem gatunku
js/view-teams-live.js   ekipy oraz transmisje live (dane demo w obu trybach)
js/view-add.js          formularz ogłoszenia, szablony opisu, podgląd, submitAd,
                        edycja, renderMine, renderSaved
js/view-home.js         strona startowa i statystyki
js/view-premium.js      PLANS, checkout (udawany), FAQ
js/view-settings.js     motyw, kraj, eksport/import JSON, kasowanie danych
js/view-terms.js        regulamin i polityka prywatności (PL + EN)
js/view-inbox.js        pusty plik — skrzynka siedzi w state.js
js/view-giveaways.js    GIVEAWAYS (4 losowania), bilety, historia
js/chat.js              czat ogólny: panel w menu bocznym, odpytywanie co 5 s,
                        wysyłka, kasowanie własnej wiadomości
js/monetization.js      monety WW, sklep, zadania, battle pass, reklamy,
                        polecenia, interstitial, karta sponsorowana
                        oraz OPAKOWANIA go / renderPlayers / submitAd
js/onboard.js           onboarding przy pierwszym wejściu
js/main.js              start aplikacji — kolejność wywołań, skróty, deep linki
js/boot.js              APP_VERSION, splash, pasek cookies, service worker,
                        DATA.init() i wskaźnik trybu, window.BigWW
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
5. `js/data-demo.js`, `js/state.js`
6. `js/api.js` — **przed** `data-source.js`, bo `DATA` woła `API`
7. `js/data-source.js`, `js/auth-ui.js`, `js/nav.js`, `js/cards.js`, widoki
8. `js/monetization.js` — **po** `nav.js`, `view-players.js` i `view-add.js`,
   bo opakowuje ich funkcje (patrz niżej)
9. `js/chat.js`, `js/onboard.js`
10. `js/main.js` — pierwsze rysowanie na danych lokalnych
11. `js/boot.js` — splash, cookies, PWA, `DATA.init()` i przerysowanie

Przy dokładaniu nowego pliku: dopisz `<script src>` w odpowiednim miejscu listy,
nie na końcu.

## Dwa tryby działania

`DATA.init()` w `js/boot.js` pyta `/api/health` pod kolejnymi adresami
(`window.BIGWW_API_URL`, ten sam host co strona, `http://localhost:3000`)
i zostaje przy pierwszym, który odpowie. Wynik:

- **`api`** — ogłoszenia, gry, konta i obserwowani z bazy,
- **`local`** — generator demo i localStorage.

Tryb widać w stopce menu bocznego (`#dataMode`): zielone „● serwer” albo żółte
„● lokalnie”.

Podział odpowiedzialności:

| co | tryb api | tryb local |
|---|---|---|
| ogłoszenia, gry, konta, obserwowani | serwer (PostgreSQL) | generator + localStorage |
| czat ogólny | serwer (PostgreSQL) | nie działa — panel mówi o tym wprost |
| monety, premium, sklep, zadania, battle pass | localStorage | localStorage |
| skrzynka, powiadomienia, blokady, zgłoszenia, oceny | localStorage | localStorage |
| giveawaye | localStorage | localStorage |
| ekipy i transmisje live | generator demo | generator demo |

**Czytanie** idzie przez globalne `allPlayers()`, `MINE` i `SAVED` — `DATA`
wypełnia je danymi z serwera, więc filtry, sortowanie, karty i profil działają
tak samo w obu trybach. **Zapis** idzie wyłącznie przez `DATA`:

```js
await DATA.createAd(draft())        // dodanie ogłoszenia
await DATA.updateAd(id, draft())    // edycja
await DATA.deleteAd(id)             // usunięcie
await DATA.toggleSave(id)           // obserwowanie
await DATA.setLookingNow(true)      // „szukam teraz" także w bazie
await DATA.chatList(after)          // historia czatu (tylko tryb api)
await DATA.chatSend(tekst)          // wysłanie na czat ogólny
await DATA.chatDelete(id)           // skasowanie własnej wiadomości
await DATA.aktywniTeraz()           // ile kont jest teraz na stronie
await DATA.login({ email, password })
await DATA.register({ email, password, displayName })
await DATA.logout()
DATA.isApi, DATA.user, DATA.games, DATA.limits, DATA.minPassword
```

**Nowy zapis podpinamy do `DATA`, nie do `API` i nie do `MINE`/`SAVED`
bezpośrednio.** Inaczej zadziała tylko w jednym z dwóch trybów.

### Ile danych ściągamy

`DATA.refresh()` pobiera ogłoszenia stronami po 60, maksymalnie `MAX_ADS = 480`,
i trzyma je w pamięci. Filtrowanie i sortowanie robi front (`filterPlayers()`
w `js/view-players.js`) — jedna ścieżka kodu dla obu trybów. Backend ma komplet
filtrów (`?game=`, `?region=`, `?rank=`, `?day=`, `?q=`, `?page=`…) i przejmie
to, gdy ogłoszeń zrobi się więcej niż jedno pobranie; wtedy `renderPlayers()`
trzeba przepiąć na zapytania i zrobić asynchronicznym.

## Czat ogólny

Panel siedzi w menu bocznym (`#chatPanel` w `index.html`), obsługa w
`js/chat.js`. Jeden pokój dla całego serwisu, historia w tabeli `chat_messages`.

- **Odpytywanie zamiast WebSocketu.** `odswiezCzat()` pyta
  `GET /api/chat?after=<czas ostatniej wiadomości, którą mamy>` co 5 sekund
  (`CZAT_ODSTEP_MS`). Pytamy tylko przy rozwiniętym panelu i widocznej karcie
  (`document.visibilityState`) — zwinięty panel i karta w tle nie robią ruchu.
  WebSocket ma sens dopiero przy ruchu, którego jeszcze nie ma.
- **Znacznik czasu bierzemy z wiadomości, nie z zegara przeglądarki**, więc
  przesunięty zegar u użytkownika nie gubi wiadomości.
- **Treść wchodzi na stronę przez `textContent`, nigdy przez `innerHTML`.**
  To jest cudzy tekst — `innerHTML` w tym miejscu to gotowy XSS. Test e2e
  wysyła `<img src=x onerror=…>` i sprawdza, że na stronie nie powstał obrazek.
- W panelu trzymamy ostatnie `CZAT_MAX_W_PANELU` (120) wiadomości; starsze
  wypadają z góry. Przewinięcie w górę wstrzymuje auto-scroll do dołu.
- Stan panelu (rozwinięty / zwinięty) siedzi w `PREF.chatOpen`, licznik nowych
  wiadomości pokazuje odznaka `#chatBadge`.
- **Licznik „N aktywnych" (`#chatOnline`) to co innego niż `#onlineNow` na
  Starcie.** Przy czacie liczymy konta z żądaniem w ostatnich 5 minutach
  (kolumna `users.last_seen_at`, zapis dławiony do raz na minutę na konto);
  na Starcie liczymy ogłoszenia ze statusem `on`, czyli włączonym „szukam
  teraz". Nazwy są różne celowo — ta sama etykieta przy dwóch różnych liczbach
  wygląda jak błąd. Licznik jedzie w odpowiedzi `GET /api/chat`, a osobny
  `GET /api/presence` jest dla wszystkiego innego, co go zechce.

Limity są po stronie serwera: 300 znaków, 20 wiadomości na minutę z konta,
ta sama treść drugi raz w ciągu 30 sekund to `429`. Front tego nie pilnuje
poza obcięciem pola do 300 znaków — pilnowanie w przeglądarce niczego nie
chroni.

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

## Konta i podział danych

Konta w trybie `api` są w bazie; front zna je przez `DATA.user`, a `isLoggedIn()`
i `currentUser()` w `js/state.js` podają je reszcie kodu w tym samym kształcie,
co konta lokalne. Konta lokalne (`bigww_users_v2`, `bigww_session_v2`) działają
tylko w trybie `local`.

Dane lokalne są przypisane do konta — w obu trybach:

```js
scopeSuffix()  ->  "_u_<id konta>"  albo  "_guest"
resolveKey(k)  ->  SCOPED_KEYS.has(k) ? k + scopeSuffix() : k
load/save      ->  zawsze przez resolveKey()
```

Dzięki temu dwa konta w tej samej przeglądarce mają osobne monety, skrzynki
i ustawienia. Po zalogowaniu i wylogowaniu `DATA` woła `loadUserData()`, żeby
przeczytać dane spod właściwego klucza.

Jednorazowa migracja starych, nieprzypisanych danych do gościa siedzi
w `migrateLegacy()` i zapisuje znacznik `bigww_migrated_v3`.

## Gość kontra zalogowany

`AUTH_REQUIRED_VIEWS` w `js/nav.js` wymienia widoki dostępne dopiero po
zalogowaniu: `add`, `mine`, `saved`, `inbox`, `premium`, `shop`. Pilnują tego:

- `go()` — przy każdym przejściu woła `requireLogin()` z nazwą akcji,
- `applyAuthVisibility()` — chowa te pozycje w menu razem z saldem monet.

Wejścia do tych widoków są w rozwijanym menu pod awatarem (`#userMenu`
w `index.html`, obsługa w `updateAuthUI()`): monety, Premium, Dodaj ogłoszenie,
Moje ogłoszenia, Obserwowani, Wiadomości, Sklep, Ustawienia, Discord, Wyloguj.
Gość widzi w tym miejscu przycisk „Zaloguj / Załóż konto”. Menu boczne zostaje
dla widoków publicznych. Odznaki (liczba wątków, moich ogłoszeń, obserwowanych,
otwartych giveawayów, stan Premium) ustawia `updateBadges()`
w `js/monetization.js`.

Kontakt: w trybie `api` decyduje backend (widzi go każdy zalogowany), a
`contactStr()` pokazuje „ukryty”, zamiast zmyślać tag Discorda. W trybie
`local` kontakt odblokowuje się za monety albo za Premium.

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
północ. Sprawdzanie, czy dwa zakresy się nachodzą, jest **zdublowane celowo**:
`hoursOverlap()` w `js/data-demo.js` dla frontu i `bigww_hours_overlap()`
w bazie dla filtrów serwerowych. Zmieniając jedno, zmień drugie.

## Model danych

**Gra**
```js
{ id, name, genre, mode, plats: ["PC","PS",...], pop: 1..5, ads? }
```
`ads` dochodzi w trybie `api` przy `?withCounts=true`.

**Gracz / ogłoszenie**
```js
{ id, nick, age, region, game, gameId, plat, style, rank, time,
  hourFrom, hourTo, mic, lang, hours, rating, status, prem, boosted,
  days: ["mon","fri"], tags: [], desc, added, mine, ownerId?,
  contact?, contactLocked?, clipUrl?, fileData?, fileType? }
```
`rank` to `beginner` / `mid` / `high` / `pro` (etykiety w `RANK_LABEL`),
`days` to dni z `WEEK_DAYS`. `mine: true` oznacza ogłoszenie użytkownika
(tablica `MINE`, zawsze na górze listy). W trybie `api` pola `hours`, `rating`
i `fileData` przychodzą puste — baza ich nie liczy i nie przechowuje.

**Konto z bazy** (`DATA.user`)
```js
{ id, displayName, email, discordTag, avatarSeed, region, coins, premium, createdAt }
```

**Konto lokalne** (`bigww_users_v2`)
```js
{ id, nick, email, emailVerified, salt?, passHash?, provider?, phone?, created }
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

Wszystkie z prefiksem `bigww_`. Kolumna „per konto” mówi, czy klucz dostaje
przyrostek `_u_<id>` / `_guest`.

| klucz | per konto | co trzyma |
|---|---|---|
| `bigww_users_v2` | nie | konta lokalne (tylko tryb bez backendu) |
| `bigww_session_v2` | nie | zalogowane konto lokalne |
| `bigww_mine_v2` | tak | własne ogłoszenia (tryb lokalny) |
| `bigww_saved_v2` | tak | obserwowani (tryb lokalny) |
| `bigww_pref_v2` | tak | motyw, kraj, awatar, język, „szukam teraz", filtry, onboarding, widok listy, otwarty czat |
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

W trybie `api` `MINE` i `SAVED` przychodzą z serwera i **nie** są zapisywane
do localStorage — `DATA` pilnuje, żeby zapis leciał tylko w trybie lokalnym.

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
pro/rok 20. **Te same liczby siedzą w `adLimitFor()` w `server/src/config.js`**
— zmieniasz jedno, zmień drugie, inaczej front obiecuje więcej, niż serwer
pozwala.

Ceny planów są w `PLANS` w `js/view-premium.js`, pakiety monet w `COIN_PACKS`,
przedmioty sklepu w `SHOP_ITEMS`, nagrody battle passa w `BP_REWARDS`,
zadania w `QUEST_DEFS` — wszystkie cztery w `js/monetization.js`.

## Wielojęzyczność

`js/i18n.js` trzyma dwa obiekty tłumaczeń (`I18N.pl`, `I18N.en`), po ok. 180
kluczy. `t("nav.home")` zwraca napis w bieżącym języku, z zejściem na polski,
a na końcu na sam klucz. `setLang()` zapisuje wybór w `PREF.lang`, przestawia
`document.documentElement.lang` i przerysowuje widoki dynamiczne.

Napisy statyczne podmienia `applyStaticI18n()` — mapa `id -> klucz` w kodzie,
nie atrybuty w markupie. Oznacza to, że **każdy nowy napis w HTML wymaga
dopisania linijki w `applyStaticI18n()`**, a napisy generowane w JavaScripcie
(toasty, modale, komunikaty błędów) są w większości po polsku na sztywno.
