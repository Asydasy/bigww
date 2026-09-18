# Stan projektu — 2026-09-18 (po scaleniu paczki 1.3.0)

## Krótko

**Front i backend są znowu spięte.** Ta sama strona działa w dwóch trybach,
rozpoznawanych raz przy starcie przez `DATA.init()`:

- **serwer** — backend odpowiada na `/api/health`: ogłoszenia, katalog gier,
  konta i obserwowani idą z PostgreSQL. W stopce menu zielone „● serwer”.
- **lokalnie** — backendu nie ma: dane z generatora i localStorage, konta
  w przeglądarce. `index.html` otwarty z dysku dalej pokazuje pełną aplikację.
  W stopce żółte „● lokalnie”.

Podział jest prosty: **serwer trzyma ogłoszenia, gry, konta, obserwowanych,
czat ogólny i prywatne wiadomości**, **przeglądarka trzyma to, czego backend
jeszcze nie ma** — monety, premium, powiadomienia, giveawaye, oceny, blokady
i zapisane filtry.

**Front**: `index.html` + `css/style.css` + 28 plików w `js/`, waniliowy
JavaScript, zero bibliotek. Wersja w `js/boot.js`: `APP_VERSION = "1.3.0"`.
**Backend**: `server/`, Node + Fastify + PostgreSQL, zapytania przez Kysely,
47 testów. Stawia się jednym `docker compose up`.

Widoki nie wiedzą, który tryb jest aktywny — czytają `allPlayers()`, `MINE`
i `SAVED`, a zapisy robią przez `DATA`.

## Jak to uruchomić

```
git clone https://github.com/Asydasy/bigww.git
cd bigww
docker compose up
```

Nic więcej. Kontener sam robi migracje i seed, po czym serwuje front razem
z API pod http://localhost:3000. Bez Dockera: `cd server && npm install &&
npm run migrate && npm run seed && npm run dev`.

Okładki gier (opcjonalnie, raz): `cd server && npm run covers`.

## Co DZIAŁA

### Widoki — 14 sekcji `.page`

Start, Gracze, Baza gier, Ekipy, Giveawaye, Dodaj ogłoszenie, Moje
ogłoszenia, Obserwowani, Wiadomości, Profil gracza, Premium, Sklep, Ustawienia,
Regulamin/Prywatność (jeden widok `v-terms`, dwie treści).

**Zakładki Live nie ma** — wypadła razem z całą warstwą płatnego podglądu
transmisji. Jeśli wróci, to jako osobny widok na prawdziwych danych.

W menu bocznym zostało to, co widzi każdy: Start, Gracze, Baza gier, Ekipy,
Giveawaye. Rzeczy konta — monety, Premium, Dodaj ogłoszenie, Moje
ogłoszenia, Obserwowani, Wiadomości, Sklep, Ustawienia, Discord i Wyloguj —
siedzą w **rozwijanym menu pod awatarem** (`#userMenu`, z animacją wejścia
i wyjścia). Pozycja „Premium” świeci na złoto przy aktywnym planie (`PRO` przy
Pro/rocznym) i pisze „nieaktywne”, gdy planu nie ma.

Sidebar na desktopie (zwijany, skrót `[`), dolny pasek na telefonie, skrót `/`
ustawia kursor w wyszukiwarce graczy, wejście na Start odpala animację hero.
Odsyłacz do serwera Discord (`discord.gg/Q4WD2BR9Ud`) jest w stopce menu
i w menu konta. **Wyloguj jest też wprost w pasku górnym** (`#btnLogoutTop`),
obok awatara — nie tylko w rozwijanym menu.

### Konta

**W trybie serwerowym** rejestracja i logowanie idą do backendu: e-mail plus
hasło (min. 8 znaków, scrypt po stronie serwera), sesja w ciasteczku `httpOnly`
ważnym 30 dni. Przycisk „Discord” przekierowuje na prawdziwy OAuth
(`/api/auth/discord`) — wymaga tylko `DISCORD_CLIENT_ID` i
`DISCORD_CLIENT_SECRET` w `server/.env`. Konto z tym samym potwierdzonym
adresem jest dopinane do istniejącego, a nie dublowane.

**W trybie lokalnym** zostają konta z przeglądarki (`bigww_users_v2`), hasło
min. 6 znaków hashowane w przeglądarce, do tego udawana weryfikacja e-maila,
udawany SMS i udawane „Google/Discord”. To warstwa pokazowa i tylko tam działa.

Dane lokalne są przypisane do konta: klucze z `SCOPED_KEYS` dostają przyrostek
`_u_<id konta>` albo `_guest`, w obu trybach. Widoki `add`, `mine`, `saved`,
`inbox`, `premium`, `shop` wymagają zalogowania (`AUTH_REQUIRED_VIEWS`).

### Ogłoszenia

Formularz z podglądem na żywo, 5 gotowych szablonów opisu, wybór dni tygodnia,
ranga (`beginner` / `mid` / `high` / `pro`), godziny od–do, do 4 tagów, kontakt,
klip z YouTube/Twitch/Medal albo plik z dysku. Edycja własnego ogłoszenia
działa. Własne ogłoszenia są na górze listy.

W trybie serwerowym ogłoszenie idzie do bazy (`POST /api/ads`), limit liczy
serwer (3 / 10 / 20), a kontakt widzi tylko zalogowany — niezalogowanemu karta
pisze wprost „ukryty”, zamiast zmyślać tag Discorda z nicku.

**Plik z dysku zostaje tylko lokalnie** — serwer nie przyjmuje data URL-i.
Formularz mówi o tym w momencie wysyłki.

### Filtry i wyszukiwarka

Gra, region, platforma, styl, ranga, godziny od–do, plus 5 szybkich filtrów
(online, z mikrofonem, świeże 24 h, uczą nowych, po polsku). Zapisywane zestawy
filtrów, przełącznik siatka/lista, wyszukiwarka tokenowa z AND i scoringiem,
odporna na polskie znaki, sortowanie po dopasowaniu (`matchScore()`, maks. 99),
dacie, aktywności, godzinach i ocenie. Paginacja po 24 wyniki.

Filtrowanie i sortowanie dzieje się **po stronie przeglądarki w obu trybach** —
jedna ścieżka kodu, więc nie da się mieć innych wyników z backendem i bez
niego. Backend ma komplet filtrów (`?game=`, `?rank=`, `?day=`, `?q=`…) i
przejmie to, gdy ogłoszeń będzie dużo (patrz „Znane ograniczenia”, punkt 1).

### „Szukam teraz”

Przełącznik ustawia `lookingNow` **na moich ogłoszeniach w bazie**, więc status
widzą inni, a nie tylko właściciel u siebie. Auto-wyłączenie po 2 godzinach.

### Czat ogólny (na serwerze)

Jeden pokój dla całego serwisu, panel w menu bocznym — zwijany, stan zapamiętany
w `PREF.chatOpen`. **Czytać może każdy, pisać tylko zalogowany.** Historia
i wysyłka idą do bazy (`chat_messages`), front odpytuje serwer co 5 sekund
o wiadomości nowsze niż ostatnia, którą ma — i tylko wtedy, gdy panel jest
rozwinięty, a karta przeglądarki widoczna. Zwinięty panel pokazuje odznakę
z liczbą nowych wiadomości.

Reguły: 300 znaków na wiadomość, 20 wiadomości na minutę z konta (limit
po stronie serwera), ta sama treść drugi raz w ciągu 30 sekund to `429`.
Własną wiadomość można skasować — wiersz zostaje w bazie, treść nie wychodzi
już z serwera, a w panelu widać „wiadomość usunięta”. Nick jest zapisywany
razem z wiadomością, więc zmiana nazwy konta nie przepisuje historii.

W nagłówku panelu stoi licznik **„● N aktywnych"** — konta, z których w ciągu
ostatnich 5 minut przyszło żądanie z ważną sesją. **To nie jest ten sam licznik,
co na Starcie**: tam „graczy online teraz" liczy ogłoszenia z włączonym
„szukam teraz" (ilu ludzi szuka ekipy), tu liczymy, ile osób w ogóle jest na
stronie. Dwie różne liczby, dwie różne nazwy i dwa różne miejsca — celowo.
Licznik przyjeżdża razem z odpowiedzią czatu, więc nie robi dodatkowych zapytań;
gości nie liczymy, bo bez konta nie ma czego policzyć.

Bez backendu panel mówi wprost, że czat działa tylko z serwerem, i nie pokazuje
pola do pisania — zamiast udawać rozmowę z samym sobą.

### Społeczność i moderacja (na razie lokalna)

Skrzynka 1:1 (osobna od czatu ogólnego), powiadomienia (maks. 50), blokowanie,
zgłoszenia z pięcioma powodami, ocena gracza 1–5, udostępnianie linku
(`#player=<id>`, `#u/<nick>`). Wszystko zapisuje się u zgłaszającego —
backend tego nie ma.

### Giveawaye

4 losowania pokazowe, jeden darmowy bilet dziennie, dodatkowe za 15 albo 25 WW,
Premium podbija szanse. Udział wymaga konta. Nagrody nie są wysyłane.

### Monetyzacja (cała udawana, bez bramki płatniczej)

- Plany: Darmowy 0 zł, Premium 19,99 zł/mies., Pro/Clan 39,99 zł/mies.,
  Premium na rok 149 zł.
- Limit ogłoszeń: 3 free (4 z dokupionym slotem), 10 premium, 20 pro/rok —
  te same liczby po stronie serwera (`adLimitFor()` w `server/src/config.js`).
- Monety WW: start 40. Kontakt 15 WW (3 darmowe dziennie), wiadomość 6 WW
  (10 darmowych dziennie), bilet na streama 35 WW, przepustka na live 80 WW.
- Sklep: boost 6 h / 25 WW, 24 h / 60 WW, 3 dni / 140 WW, dodatkowy slot
  na 7 dni 80 WW, awatar 10 WW, pakiet 5 kontaktów 70 WW.
- Pakiety monet: 100 za 9,99 zł; 500+100 za 39,99 zł; 1500+500 za 99 zł;
  starter 200+50 z Premium na 3 dni za 14,99 zł.
- Reklamy z nagrodą 15 WW (co 45 s, maks. 12 dziennie), 4 dzienne zadania,
  battle pass 10 poziomów po 100 XP, polecenia z kodem `BIG-XXXX` (+50 WW),
  interstitial co 10 przejść nawigacji.

### Wielojęzyczność PL / EN

`js/i18n.js`: dwa komplety po ok. 180 kluczy, `t()`, `setLang()`,
`applyStaticI18n()`. Przełącznik w interfejsie, wybór w `PREF.lang`, zmiana
bez przeładowania strony.

### Prywatne wiadomości (na serwerze)

Rozmowa 1:1 między dwoma kontami. Wątek jest jeden na parę kont, niezależnie
od tego, kto zaczął. Dwa miejsca, jedno źródło (`DM_THREADS`):

- **pływające okienka** — „Napisz" na karcie gracza otwiera przeciągalne
  okienko rozmowy (`js/im-ui.js`); można mieć otwartych kilka naraz,
- **widok Wiadomości** — spis wątków z licznikiem nieprzeczytanych,
- **przycisk ✉ w pasku górnym** — rozwija spis rozmów z odznaką.

Nadawcę podpisuje **serwer, z sesji** — przeglądarka podaje tylko, do kogo
pisze (`adId` z karty ogłoszenia albo `toUserId` w istniejącym wątku).
Nieprzeczytane liczą się od `a_read_at` / `b_read_at` w `dm_threads`.
Odpytywanie co 5 sekund i **tylko wtedy**, gdy panel albo okienko jest otwarte,
a karta przeglądarki na wierzchu.

Bez backendu skrzynka działa po staremu: zapis do localStorage, wiadomość
widzi tylko autor.

### Oprawa

Ekran powitalny, pasek zgody na cookies, service worker (network-first),
animacja hero na Starcie, odznaki w menu (liczba otwartych giveawayów,
wiadomości, moich ogłoszeń, obserwowanych),
`window.BigWW = { version, api, data, go, t }` do zaglądania z konsoli.

**Efekty wizualne** (`js/fx-bg.js`): animowane tło — shader WebGL na canvasie
plus bloby CSS w `#fx-stage`. Przełącznik „Efekty wizualne" w Ustawieniach
ustawia `data-fx` na `<html>`; przy `off` pętla rysowania staje. Systemowe
`prefers-reduced-motion` wyłącza animacje **niezależnie od tego przełącznika**.

**Radio BigWW** (`js/party.js`): przeciągalny panel z Play, wyciszeniem
i głośnością, sterowany też z Ustawień. Plik `audio/party.mp3` jest **poza
repozytorium** — bez niego panel się nie pokazuje.

### Okładki gier

Kafelek ma dwie warstwy: pod spodem grafikę generowaną z nazwy (jest zawsze),
na wierzchu prawdziwą okładkę. `coverCandidates()` w `js/covers-map.js` podaje
listę adresów od najpewniejszego — plik z dysku `img/games/<slug>.jpg`, potem
CDN Steama po `appid` (mapa 400 gier). Karta próbuje po kolei, aż któryś się
wczyta; gdy żaden nie wejdzie, zostaje grafika generowana.

Karta gry pokazuje też platformy, pięć kropek popularności i znacznik `HOT`
przy `pop >= 5`. Karta gracza ma miniaturę okładki przy nazwie gry.

Katalog `img/games/` jest poza repozytorium — po sklonowaniu
`cd server && npm run covers`.

## Co DZIAŁA po stronie serwera

Szczegóły i lista endpointów: `server/README.md`.

- Konta: rejestracja e-mailem z hasłem (scrypt), logowanie, wylogowanie, `/me`,
  Discord OAuth, ograniczenie liczby prób logowania (10 na 5 minut).
- Katalog 277 gier, wypełniany seedem z `js/data-games.js`, z licznikami
  ogłoszeń na grę.
- Czat ogólny: `GET /api/chat` (czyta każdy, `?after=` do odpytywania),
  `POST /api/chat` (zalogowany, 20/min), `DELETE /api/chat/:id` (właściciel).
- Licznik aktywnych: `GET /api/presence` — konta widziane w ostatnich 5 minutach.
  Ślad zapisuje się przy żądaniu z sesją, najwyżej raz na minutę na konto.
- Prywatne wiadomości: `GET /api/dm` (moje wątki), `POST /api/dm` (wyślij,
  20/min), `POST /api/dm/:id/read` (oznacz przeczytane). Wszystko wymaga
  zalogowania, nadawca zawsze z sesji. Migracja `007`, tabele `dm_threads`
  i `dm_messages`.
- Ogłoszenia: dodawanie, edycja (`PATCH`), usuwanie, obserwowanie, lista
  z filtrami (gra, region, platforma, styl, pora, godziny, mikrofon, ranga,
  dzień tygodnia, tag, język, świeżość, „szukam teraz”), wyszukiwarką odporną
  na polskie znaki i stronicowaniem.
- Limit ogłoszeń liczony po stronie serwera.
- Kontakt tylko dla zalogowanych (`contactLocked` dla reszty).
- **47 testów API** (`npm test`) i **test przeklikujący front w obu trybach**
  (`npm run test:front`, 40 sprawdzeń — wymaga Playwrighta i działającego
  serwera).

## Czego NIE MA

- **Portfela monet po stronie serwera.** Kolumna `coins` jest, logiki wydawania
  nie ma — front trzyma saldo w przeglądarce, więc każdy może je zmienić
  w konsoli. Przy prawdziwych płatnościach to jest blokada startu.
- **Premium w bazie.** To samo co wyżej: kolumny są, ruchu nie ma.
- **Moderacji prywatnych wiadomości.** Wiadomości chodzą przez bazę, ale nie
  ma blokowania nadawcy po stronie serwera, zgłoszeń ani kasowania wątku.
  Blokady z `BLOCKED` działają tylko w przeglądarce blokującego.
- **Powiadomienia o nowej wiadomości poza stroną.** Odznaka odświeża się tylko
  przy otwartym panelu albo okienku rozmowy.
- **Moderacji czatu.** Każdy zalogowany pisze do wszystkich; nie ma banów,
  wyciszeń ani kolejki zgłoszeń. Przy pierwszym trollu to będzie pierwsza
  rzecz do zrobienia.
- **Płatności.** Checkout to modal z opóźnieniem i komunikatem sukcesu.
- **Ekip w bazie.** Istnieją tylko we froncie, na danych demo, także wtedy,
  gdy reszta strony chodzi na serwerze.
- **Plików z ogłoszeń na serwerze.** Data URL zostaje w przeglądarce autora.
- **Moderacji.** Zgłoszenia i blokady zapisują się u zgłaszającego.
- **Prawdziwych giveawayów.**
- **Zgody na regulamin przy rejestracji i usuwania konta.** Dokumenty są,
  ale RODO to nie tylko dokument.
- **Prawdziwych użytkowników.** Baza startuje pusta — w trybie serwerowym
  lista graczy jest pusta, dopóki ktoś nie doda ogłoszenia. To nie jest błąd,
  to jest stan wyjściowy serwisu.

## Znane ograniczenia i pułapki

1. **Front pobiera do 480 ogłoszeń na raz** (`MAX_ADS` w `js/data-source.js`,
   po 60 na stronę) i filtruje je u siebie. Przy większej bazie trzeba przenieść
   filtrowanie na serwer — endpoint już to potrafi, brakuje tylko przepięcia
   `renderPlayers()` na zapytania.
2. **Tryb rozpoznawany jest raz, przy starcie.** Uruchomienie backendu przy
   otwartej stronie nie przełącza jej na serwer — trzeba odświeżyć. Otwarcie
   `index.html` z dysku obok działającego serwera zadziała tylko wtedy, gdy
   adres `file://` jest w `CORS_ORIGIN`; normalnie wchodzi się na
   http://localhost:3000.
3. **`monetization.js` podmienia trzy funkcje** (`go`, `renderPlayers`,
   `submitAd`), opakowując je na końcu pliku. Wzorzec wrócił razem ze
   scaleniem frontu. Działa, dopóki ten plik ładuje się po tamtych i nikt nie
   opakowuje ich drugi raz — szczegóły w `docs/ARCHITEKTURA.md`.
4. **`rawSave()` w `js/state.js` łyka wyjątek po cichu** (`catch (e) {}`).
   localStorage ma ~5 MB, a pliki z ogłoszeń idą jako data URL — jeden film
   z telefonu zapycha limit i od tego momentu nic się nie zapisuje, bez jednego
   komunikatu. Pierwszy realny bug do naprawienia.
5. **Sprzeczna liczba darmowych wiadomości.** `FREE_MSG_LIMIT = 10`
   (`js/state.js`), a plan Darmowy w `js/view-premium.js` obiecuje „5 darmowych
   wiadomości / dzień”.
6. **Konta lokalne to atrapa.** Hash hasła leży w localStorage, kody
   weryfikacyjne generuje i pokazuje ta sama przeglądarka. W trybie serwerowym
   nic z tego nie jest używane, ale kod dalej tam siedzi.
7. **Dane demo są generowane od nowa przy każdym odświeżeniu** (`Date.now()`
   w polach `added`), więc „dodane 3 h temu” zmienia się między wejściami.
8. **Kolejność skryptów w `index.html` ma znaczenie** — wszystko żyje w zasięgu
   globalnym. `util.js` przed `data-demo.js`, `i18n.js` przed `state.js`,
   `api.js` przed `data-source.js`, `monetization.js` po widokach, `main.js`
   przedostatni, `boot.js` ostatni.
9. **Klucze poza obiektem `KEY`**: `bigww_extra_slot`, `bigww_unlock_cred`,
   `bigww_gw_entries`, `bigww_gw_day`, `bigww_cookie_v1`, `bigww_migrated_v3`,
   `bigww_users_v2`, `bigww_session_v2`. Przy czyszczeniu i migracjach trzeba
   je obsłużyć osobno.
10. **Service worker rejestrowany z bloba** (`js/boot.js`) ma zasięg katalogu
    bloba i nic nie cache'uje. Dziś nieszkodliwy, ale to nie jest PWA.
11. **Brak walidacji formularza ogłoszenia** poza `maxlength`, `min/max`
    na wieku i dwoma sprawdzeniami w `submitAd()`.
12. **Klipy z Twitcha wymagają parametru `parent`** przy embedzie — na
    `file://` nie zadziałają.
13. **Fonty lecą z Google Fonts** — jedyna zewnętrzna zależność frontu. Bez
    internetu strona działa na fontach systemowych.
14. **Brak `img/games/index.js` daje 404 w konsoli**, dopóki nie uruchomi się
    skryptu okładek. Strona działa, kafelki mają grafikę generowaną.
15. **`updateBadges()` woła `inboxUnreadCount()`, której nigdzie nie ma**
    (`js/monetization.js`, linia 514). Wywołanie jest osłonięte `typeof`, więc
    nic się nie wywala — odznaka wiadomości pokazuje po prostu liczbę wątków
    zamiast nieprzeczytanych.

## Decyzje

- Backend: **Node + Fastify + PostgreSQL w Dockerze**, zapytania przez
  **Kysely** (zamiast Prismy — powód w `docs/DECYZJE.md`).
- Logowanie: **Discord OAuth oraz e-mail z hasłem** po stronie serwera; konta
  lokalne zostają wyłącznie dla trybu bez backendu.
- **Filtrowanie w przeglądarce w obu trybach**, dopóki ogłoszeń jest mało —
  jedna ścieżka kodu zamiast dwóch.

Kolejność dalszych prac: `docs/TODO.md`.
