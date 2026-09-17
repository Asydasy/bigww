# Architektura

Projekt ma dwie części: front (katalog główny) i backend (`server/`).
Ten plik opisuje front; backend ma własny `server/README.md`.

## Układ plików

```
index.html              sam markup — 11 sekcji .page, modale, lista skryptów
css/style.css           całe style (435 linii)
js/data-games.js        baza 205 gier jako tekst -> tablica GAMES
js/data-demo.js         generator demo: PLAYERS (720), TEAMS (80), LIVES (36),
                        awatary i okładki jako SVG z hasza nazwy
js/state.js             localStorage: obiekt KEY, load/save, premium, monety,
                        limity, canSeeContact(), adLimit(), freeUnlocksLeft()
js/util.js              $, el, norm, nf, tokens, searchScore, ago, toast, fillSelect
                        oraz godziny: fmtHour, timeLabel, hoursOverlap, fillHourSelect
js/api.js               surowe wywołania HTTP do serwera (API.login, API.ads, ...)
js/data-source.js       DATA — jedyne wejście do danych dla widoków; wybiera
                        między serwerem a danymi demo i tłumaczy filtry
js/auth-ui.js           panel konta w menu, okno logowania/rejestracji oraz
                        podział na to, co widzi gość, a co zalogowany
js/nav.js               go(view), podpięcie sidebara i bottom-nav, setLooking()
js/cards.js             playerCard, gameCard, teamCard, openProfile, showContact,
                        openModal, toggleSave, podgląd mediów
js/view-players.js      filtry, wyszukiwarka, renderPlayers()
js/view-games.js        baza gier z filtrem gatunku
js/view-teams-live.js   ekipy oraz transmisje live
js/view-add.js          formularz ogłoszenia, podgląd, submitAd, moje, obserwowani
js/view-home.js         strona startowa i statystyki
js/view-premium.js      plany, checkout (demonstracyjny), FAQ
js/view-settings.js     motyw, region, awatar, kasowanie danych
js/monetization.js      monety WW, sklep, zadania, battle pass, reklamy,
                        polecenia, interstitial, karta sponsorowana
js/onboard.js           onboarding przy pierwszym wejściu
js/main.js              start aplikacji — kolejność wywołań, skrót klawiszowy
```

## Kolejność ładowania

Skrypty są zwykłymi `<script src>`, ładowanymi w kolejności zapisanej w
`index.html` — od `data-games.js` do `main.js`. **`util.js` musi być przed
`data-demo.js`**, bo generator graczy woła `timeLabel()` już przy ładowaniu. Wszystko żyje w zasięgu
globalnym, więc **kolejność ma znaczenie**: `main.js` musi być ostatni, bo to on
uruchamia aplikację, a plik z danymi musi być przed tym, który z nich korzysta.
Nie ma modułów ES, dzięki czemu `index.html` otwiera się także przez podwójne
kliknięcie, bez serwera.

Przy dokładaniu nowego pliku: dopisz `<script src>` w odpowiednim miejscu listy,
nie na końcu.

## Dwa tryby działania

`DATA.init()` przy starcie pyta `/api/health`. Jeśli serwer odpowie, tryb to
`api`; jeśli nie — `demo`. Widoki wołają zawsze to samo:

```js
await DATA.listAds(filtry, strona, naStronie)   // lista ogłoszeń
await DATA.createAd(draft())                    // dodanie
await DATA.myAds()                              // moje + limit konta
await DATA.savedAds() / DATA.toggleSave(id)     // obserwowani
DATA.games / DATA.adsForGame(nazwa)             // katalog gier
DATA.user / DATA.login() / DATA.logout()        // konto (tylko tryb api)
```

W trybie `demo` te same funkcje filtrują dane z generatora i zapisują do
localStorage. **Nowy widok podpinamy do `DATA`, nie do `API` ani do `PLAYERS`.**

Czego backend jeszcze nie obsługuje: ekipy, transmisje live, monety WW, premium,
sklep, zadania i battle pass. Te części działają na danych z przeglądarki
w obu trybach — widać je zawsze, ale nie przechodzą przez serwer.

Wyjątkiem jest kontakt: w trybie `api` o dostępie do niego decyduje backend
(widzi go każdy zalogowany), więc `showContact()` ma dla tego trybu osobną
gałąź zamiast odblokowywania za monety.

## Gość kontra zalogowany

`GUEST_HIDDEN` w `js/auth-ui.js` wymienia widoki dostępne dopiero po
zalogowaniu: `add`, `mine`, `saved`, `premium`, `shop`. Pilnują tego dwie
rzeczy:

- `applyAuthVisibility()` chowa te pozycje w menu razem z saldem monet i,
  gdyby ktoś został na ukrytym widoku po wylogowaniu, cofa na stronę startową;
- `go()` w `js/nav.js` sprawdza to samo przy każdym przejściu, więc przycisk na
  stronie startowej albo odsyłacz w pustym stanie też otworzy logowanie.

`isGuest()` jest prawdziwe tylko w trybie `api`. W trybie demo kont nie ma,
więc cała strona zostaje widoczna.

## Godziny grania

Ogłoszenie ma `hourFrom` i `hourTo` (0-23). Zakres może przechodzić przez
północ. Sprawdzanie, czy dwa zakresy się nachodzą, jest **zdublowane celowo**:
`hoursOverlap()` w `js/util.js` dla trybu demo i `bigww_hours_overlap()` w bazie
dla trybu serwerowego. Zmieniając jedno, zmień drugie — inaczej ten sam filtr da
inne wyniki z backendem i bez niego.

## Model danych

**Gra**
```js
{ id, name, genre, mode, plats: ["PC","PS",...], pop: 1..5 }
```

**Gracz / ogłoszenie**
```js
{ id, nick, age, region, game, gameId, plat, style, time, mic, lang,
  hours, rating, status, prem, tags: [], desc, added, mine,
  contact?, clipUrl?, fileData?, fileType? }
```
`mine: true` oznacza ogłoszenie użytkownika (tablica `MINE`, zawsze na górze
listy). `allPlayers()` zwraca `MINE.concat(PLAYERS)`.

**Ekipa**
```js
{ id, name, game, gameId, size, filled, region, style, time, minAge, desc, added }
```

**Live**
```js
{ id, nick, playerId, game, title, viewers, started, region, plat, thumb, premiumOnly }
```

## Klucze localStorage

Wszystkie z prefiksem `bigww_`, większość zebrana w obiekcie `KEY` w `state.js`:

| klucz | co trzyma |
|---|---|
| `bigww_mine_v2` | własne ogłoszenia |
| `bigww_saved_v2` | obserwowani (id graczy) |
| `bigww_pref_v2` | motyw, region, awatar, „szukam teraz", filtry, onboarding |
| `bigww_premium_v2` | `{active, plan, until, since}` |
| `bigww_coins_v2` | `{bal, earned, spent}` — start 40 WW |
| `bigww_ref_v2` | kod polecający i statystyki |
| `bigww_boosts_v2` | id ogłoszenia → timestamp końca boosta |
| `bigww_adlog_v2` | licznik obejrzanych reklam w dniu |
| `bigww_msg_v2` | zużyte darmowe wiadomości w dniu |
| `bigww_bp_v2` | battle pass: poziom, XP, odebrane |
| `bigww_quests_v2` | dzienne zadania |
| `bigww_unlocks_v2` | id graczy z odblokowanym kontaktem |
| `bigww_nav_v2` | licznik przejść (do interstitiali) |
| `bigww_livepass_v2` | przepustka na wszystkie live |
| `bigww_livetickets_v2` | pojedyncze wykupione streamy |
| `bigww_extra_slot` | **poza `KEY`** — timestamp końca dodatkowego slotu |
| `bigww_unlock_cred` | **poza `KEY`** — kredyty na odblokowanie kontaktu |

## Stałe cenowe

W `state.js` (poza `LIVE_TICKET_COST`, które siedzi na końcu `data-demo.js`):

```
LIVE_TICKET_COST     35 WW
FREE_MSG_LIMIT       10 / dzień
FREE_UNLOCK_DAILY    3 / dzień
UNLOCK_CONTACT_COST  15 WW
MSG_COST             6 WW
BP_XP_PER_LEVEL      100
BP_MAX               10
```

Limit ogłoszeń liczy `adLimit()`: free 3, +1 z `bigww_extra_slot`, premium 10,
pro/rok 20. **Te same liczby siedzą w `adLimitFor()` w
`server/src/config.js`** — zmieniasz jedno, zmień drugie, inaczej front obiecuje
więcej, niż serwer pozwala.

## Miejsca, w których monetyzacja wchodzi w resztę kodu

Kiedyś robiły to podmiany funkcji; teraz są to trzy zwykłe wywołania:

| skąd | co woła | po co |
|---|---|---|
| `nav.js`, koniec `go()` | `maybeShowInterstitial()` | reklama pełnoekranowa co kilka przejść |
| `view-players.js`, koniec `renderPlayers()` | `addSponsoredSlot()` | karta sponsorowana na górze listy |
| `view-add.js`, koniec `submitAd()` | `progressQuest("post")` | postęp dziennego zadania |

Wszystkie trzy funkcje mieszkają w `monetization.js`, który ładuje się przed
`main.js`, więc w chwili wywołania są już zdefiniowane.
