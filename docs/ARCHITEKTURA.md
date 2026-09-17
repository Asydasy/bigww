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
                        limity, canSeeContact(), adLimit()
js/util.js              $, el, norm, nf, tokens, searchScore, ago, toast, fillSelect
js/api.js               jedyne wejście do serwera (API.login, API.ads, ...);
                        widoki jeszcze z niego nie korzystają
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
`index.html` — od `data-games.js` do `main.js`. Wszystko żyje w zasięgu
globalnym, więc **kolejność ma znaczenie**: `main.js` musi być ostatni, bo to on
uruchamia aplikację, a plik z danymi musi być przed tym, który z nich korzysta.
Nie ma modułów ES, dzięki czemu `index.html` otwiera się także przez podwójne
kliknięcie, bez serwera.

Przy dokładaniu nowego pliku: dopisz `<script src>` w odpowiednim miejscu listy,
nie na końcu.

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
FREE_MSG_LIMIT       5 / dzień
UNLOCK_CONTACT_COST  20 WW
MSG_COST             8 WW
BP_XP_PER_LEVEL      100
BP_MAX               10
```

Limit ogłoszeń liczy `adLimit()`: free 2, +1 z `bigww_extra_slot`, premium 10,
pro/rok 20.

## Miejsca, w których monetyzacja wchodzi w resztę kodu

Kiedyś robiły to podmiany funkcji; teraz są to trzy zwykłe wywołania:

| skąd | co woła | po co |
|---|---|---|
| `nav.js`, koniec `go()` | `maybeShowInterstitial()` | reklama pełnoekranowa co kilka przejść |
| `view-players.js`, koniec `renderPlayers()` | `addSponsoredSlot()` | karta sponsorowana na górze listy |
| `view-add.js`, koniec `submitAd()` | `progressQuest("post")` | postęp dziennego zadania |

Wszystkie trzy funkcje mieszkają w `monetization.js`, który ładuje się przed
`main.js`, więc w chwili wywołania są już zdefiniowane.
