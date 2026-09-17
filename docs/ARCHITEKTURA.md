# Mapa kodu — index.html

Numery linii dotyczą commita startowego. Po każdej większej zmianie warto je
odświeżyć, bo to jedyna nawigacja po pliku o 3449 liniach.

## Układ pliku

```
1    - 12     <head>, fonty Google
13   - 480    <style> — cały CSS
481  - 853    <body> — 11 sekcji .page (widoki) + modale
854  - 3448   <script> — cała logika
```

## Sekcje w CSS (linie 13-480)

Zmienne w `:root` (motyw ciemny) i `:root[data-theme="light"]` (jasny).
Kolor akcentu `--acc` #7c5cff, złoty `--gold` dla premium i monet.
Dalej kolejno: layout (shell, sidebar, main), nawigacja, karty gracza, karty
gry, karty ekipy, live, formularz ogłoszenia, plany premium, sklep, modale,
onboarding, bottom-nav (mobile).

## Widoki w HTML (sekcje `.page`, przełączane klasą `on`)

| id | linia | co to |
|---|---|---|
| `v-home` | 482 | Start: hero, statystyki, popularne gry, najnowsze ogłoszenia |
| `v-players` | 519 | Szukaj graczy — filtry, wyszukiwarka, lista kart |
| `v-games` | 575 | Baza gier z filtrem gatunku |
| `v-teams` | 599 | Ekipy szukające składu |
| `v-live` | 620 | Transmisje (płatne dostępy) |
| `v-add` | 644 | Formularz ogłoszenia + podgląd |
| `v-mine` | 699 | Moje ogłoszenia |
| `v-saved` | 705 | Obserwowani gracze |
| `v-premium` | 711 | Plany i FAQ |
| `v-shop` | 725 | Monety WW, sklep, zadania, battle pass, polecenia |
| `v-settings` | 797 | Motyw, region, awatar, kasowanie danych |

## Sekcje w JS (numerowane komentarzami w kodzie)

| nr | linia | zawartość |
|---|---|---|
| 1 | 857 | `GAME_DATA` — 204 gry jako tekst `nazwa\|gatunek\|tryb\|platformy\|pop`, parsowane do `GAMES` |
| 2 | 1081 | Generator graczy: `rng(seed)` (mulberry32), `hashOf`, `avatarArt`, `coverArt`, `makeNick`; tworzy `PLAYERS` (720), `TEAMS` (80), `LIVES` (36) |
| 3 | 1334 | Pamięć lokalna: obiekt `KEY`, `load`/`save`, cały stan aplikacji, stałe cenowe |
| 4 | 1437 | Pomocnicze: `$`, `el`, `norm`, `nf`, `tokens`, `searchScore`, `ago`, `toast`, `fillSelect` |
| 5 | 1511 | Nawigacja: `go(view)`, podpięcie sidebara i bottom-nav, `setLooking` |
| 6 | 1562 | Karty: `playerCard`, `gameCard`, `teamCard`, `liveCard`, `openProfile`, `showContact`, `openModal`, `toggleSave`, media |
| 7 | 1929 | Filtry graczy: `buildFilters`, `filterPlayers`, `renderPlayers` |
| 8 | 2097 | Gry: `buildGames`, `renderGames` |
| 9 | 2150 | Ekipy: `renderTeams`; dalej (2186) live: `openLive`, `renderLives` |
| 10 | 2316 | Dodawanie ogłoszenia: `buildAdd`, `draft`, `preview`, `submitAd`, `renderMine`, `renderSaved` |
| 11 | 2456 | Start/statystyki: `renderHome`; dalej (2487) premium: `PLANS`, `renderPremium`, `checkout`, `processPay`, `cancelPrem` |
| 12 | 2694 | Ustawienia: `applyTheme`, `renderInfo`, kasowanie danych |
| — | 2757 | Monetyzacja: `SHOP_ITEMS`, `COIN_PACKS`, `BP_REWARDS`, `QUEST_DEFS`, monety, XP, zadania, reklamy, boosty, polecenia, `renderShop`, interstitiale |
| — | 3300 | **Nadpisania**: `go`, `renderPlayers`, `submitAd` są podmieniane, żeby doszyć monetyzację |
| — | 3355 | Onboarding: `OB_STEPS`, `startOnboard`, `finishOnboard` |
| 13 | 3399 | START — kolejność wywołań przy załadowaniu strony |

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
`mine: true` oznacza ogłoszenie użytkownika (trzymane w `MINE`, na górze listy).
`allPlayers()` = `MINE.concat(PLAYERS)`.

**Ekipa**
```js
{ id, name, game, gameId, size, filled, region, style, time, minAge, desc, added }
```

**Live**
```js
{ id, nick, playerId, game, title, viewers, started, region, plat, thumb, premiumOnly }
```

## Klucze localStorage

Wszystkie z prefiksem `bigww_`, większość w obiekcie `KEY` (linie 1337-1352):

| klucz | co trzyma |
|---|---|
| `bigww_mine_v2` | własne ogłoszenia |
| `bigww_saved_v2` | obserwowani (id graczy) |
| `bigww_pref_v2` | motyw, region, awatar, „szukam teraz”, filtry, onboarding |
| `bigww_premium_v2` | `{active, plan, until, since}` |
| `bigww_coins_v2` | `{bal, earned, spent}` — start 40 WW |
| `bigww_ref_v2` | kod polecający i statystyki |
| `bigww_boosts_v2` | mapa id ogłoszenia → timestamp końca boosta |
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

## Stałe cenowe (linie 1332, 1385-1388)

```
LIVE_TICKET_COST     35 WW
FREE_MSG_LIMIT       5 / dzień
UNLOCK_CONTACT_COST  20 WW
MSG_COST             8 WW
BP_XP_PER_LEVEL      100
BP_MAX               10
```

Limit ogłoszeń wylicza `adLimit()` (1391): free 2, +1 z `bigww_extra_slot`,
premium 10, pro/rok 20.
