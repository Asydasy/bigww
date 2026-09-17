# Stan projektu — 2026-09-18

## Krótko

**Front chodzi w całości na przeglądarce. Backend istnieje, ale nikt go nie
woła.** To jest najważniejsza rzecz do zrozumienia przed pierwszą zmianą.

- **Front** (katalog główny): `index.html` + `css/style.css` + 24 pliki w `js/`,
  waniliowy JavaScript, zero zależności JS. Wersja podana w
  `js/boot.js` jako `APP_VERSION = "1.0.0"`. Dane: generator demo + localStorage.
  Konta też są w localStorage (`bigww_users_v2`).
- **Backend** (`server/`): Node + Fastify + PostgreSQL, zapytania przez Kysely,
  25 testów, pełny CRUD ogłoszeń i konta z sesją w ciasteczku. Działa, ale
  **front nie wysyła do niego ani jednego zapytania**.

Warstwy `DATA` już nie ma. `js/data-source.js`, `js/api.js` i `js/view-inbox.js`
to dwulinijkowe zaślepki zostawione po to, żeby lista `<script src>` w
`index.html` się nie posypała. Obiekt `API` jest definiowany w `js/boot.js` i
mapuje na localStorage (`STORAGE_MODE = "local"`).

Stało się to w commicie `c247099` (17.09.2026, 23:23), który wciągnął równoległą
wersję frontu w miejsce wersji spiętej z backendem. Decyzja, co dalej —
`docs/TODO.md`, punkt 0.

## Co DZIAŁA (front)

### Widoki — 15 sekcji `.page`

Start, Gracze, Baza gier, Ekipy, Live, Giveawaye, Dodaj ogłoszenie, Moje
ogłoszenia, Obserwowani, Wiadomości, Profil gracza, Premium, Sklep, Ustawienia,
Regulamin/Prywatność (jeden widok `v-terms`, dwie treści — `go("privacy")`
przełącza).

Sidebar na desktopie (zwijany, stan w `PREF.sidebarCollapsed`), dolny pasek na
telefonie, skrót `/` ustawia kursor w wyszukiwarce graczy.

### Konta — lokalne, w przeglądarce

- Rejestracja: nick 3–24 znaki (litery, cyfry, `_ - .`), e-mail, hasło min. 6
  znaków. Hasło hashowane w przeglądarce: SHA-256 przez `crypto.subtle` z solą
  12 znaków, awaryjnie FNV-1a. Zapis w `bigww_users_v2`.
- Logowanie nickiem albo e-mailem, sesja w `bigww_session_v2`.
- **Weryfikacja e-maila jest udawana**: kod 6-cyfrowy generuje przeglądarka i
  sama go wyświetla („Demo — Twój kod: 123456").
- **Logowanie przez Google i Discord jest udawane**: modal pyta o nick i e-mail,
  po czym zakłada konto lokalne z `emailVerified: true`.
- **Logowanie telefonem jest udawane**: kod SMS pokazuje się na ekranie, ważny
  10 minut, nick generowany jako `tel` + 4 ostatnie cyfry.
- Dane są **oddzielone per konto**: klucze z `SCOPED_KEYS` dostają przyrostek
  `_u_<id>` albo `_guest`. Jednorazowa migracja starych, globalnych danych do
  gościa siedzi pod `bigww_migrated_v3`.
- Widoki tylko dla zalogowanych (`AUTH_REQUIRED_VIEWS` w `js/nav.js`):
  `add`, `mine`, `saved`, `inbox`, `premium`, `shop`. Pilnuje tego `go()` przez
  `requireLogin()`.

### Dane demo (generowane przy każdym załadowaniu, deterministycznie z seeda 20260917)

- 205 gier z gatunkiem, trybem, platformami i popularnością 1–5
- 720 graczy: nick, wiek 15–41, region, gra, platforma, styl, godziny od–do,
  mikrofon, język, przegrane godziny, ocena, status, **ranga** (`beginner`,
  `mid`, `high`, `pro`), **dni tygodnia**, tagi, opis
- 80 ekip, 36 transmisji „live"
- awatary rysowane jako SVG z hasza nicku; okładki gier — patrz niżej

### Ogłoszenia

Formularz z podglądem na żywo, 5 gotowych szablonów opisu (`AD_TEMPLATES`:
rankedy, chill, uczę się, nocny grind, stała ekipa), wybór dni tygodnia, ranga,
godziny od–do, do 4 tagów, kontakt, klip z YouTube/Twitch/Medal albo plik z
dysku (data URL w localStorage). Edycja własnego ogłoszenia działa
(`startEditAd()`). Własne ogłoszenia lądują na górze listy.

### Filtry i wyszukiwarka

Gra, region, platforma, styl, godziny od–do, mikrofon. Do tego 5 szybkich
filtrów (`QUICK`): tylko online, z mikrofonem, świeże 24 h, uczą nowych,
po polsku. Zapisywane zestawy filtrów (`bigww_presets_v2`). Przełącznik
siatka/lista. Wyszukiwarka tokenowa z AND i scoringiem, ignoruje polskie znaki.
Paginacja po 24 wyniki. Sortowanie ma opcję „dopasowanie" liczoną przez
`matchScore()` (gra 35 pkt, region 20, online 15, mikrofon 10, styl 10,
język 5, ranga 5, nachodzenie godzin 5–10; maks. 99).

### Społeczność i moderacja (lokalna)

- **Skrzynka** (`bigww_inbox_v2`): wątki 1:1, wiadomość z karty gracza albo z
  profilu. Nic nigdzie nie leci — wątek zapisuje się u nadawcy.
- **Powiadomienia** (`bigww_notifs_v2`): panel w nagłówku, licznik
  nieprzeczytanych, maks. 50 ostatnich.
- **Blokowanie** (`bigww_blocked_v2`) i **zgłoszenia** (`bigww_reports_v2`,
  5 powodów) — zapisywane lokalnie, nikt ich nie czyta.
- **Ocena gracza** (`bigww_ratings_v2`), 1–5 gwiazdek, wpływa na sortowanie.
- **Udostępnianie**: `navigator.share` albo schowek, link `#player=<id>`.
- **Deep linki**: `#player=<id>` i `#u/<nick>` otwierają profil.

### Giveawaye

4 losowania demonstracyjne (Nitro, 7 dni Premium, klucz Steam, skin CS2 —
ostatnie zakończone). Jeden darmowy bilet dziennie (`bigww_gw_day`), dodatkowe
bilety za 15 albo 25 WW, Premium podbija szanse. Udział wymaga konta. Zapis
w `bigww_gw_entries`. **Nagrody nie są wysyłane** — to warstwa pokazowa.

### Monetyzacja (cała udawana, bez bramki płatniczej)

- Plany: Darmowy 0 zł, Premium 19,99 zł/mies., Pro/Clan 39,99 zł/mies.,
  Premium na rok 149 zł.
- Limit ogłoszeń (`adLimit()`): 3 free (4 z dokupionym slotem), 10 premium,
  20 pro/rok.
- Monety WW: start 40. Odblokowanie kontaktu 15 WW (3 darmowe dziennie),
  wiadomość 6 WW (10 darmowych dziennie), bilet na streama 35 WW, przepustka
  na wszystkie live 80 WW.
- Sklep: boost 6 h 25 WW, boost 24 h 60 WW, boost 3 dni 140 WW, dodatkowy slot
  na 7 dni 80 WW, nowy awatar 10 WW, pakiet 5 kontaktów 70 WW.
- Pakiety monet: 100 za 9,99 zł; 500+100 za 39,99 zł; 1500+500 za 99 zł;
  starter 200+50 z Premium na 3 dni za 14,99 zł.
- Reklamy z nagrodą: 15 WW, odstęp 45 sekund, maks. 12 dziennie.
- Dzienne zadania: 2 reklamy → 10 WW, 1 wiadomość → 8 WW, 1 boost → 15 WW,
  dodanie/edycja ogłoszenia → 12 WW.
- Battle pass: 10 poziomów po 100 XP, nagrody od 10 WW do 150 WW + boosty i slot.
- Program polecający: kod `BIG-XXXX`, bonus 50 WW.
- Interstitial co 10 przejść nawigacji.

### Wielojęzyczność PL / EN

`js/i18n.js`: dwa komplety tłumaczeń (po ok. 180 kluczy), `t(key)`,
`setLang(lang)`, `applyStaticI18n()`. Przełącznik `#langToggle` w interfejsie,
wybór zapisywany w `PREF.lang`. Zmiana języka przerysowuje widoki dynamiczne
bez przeładowania strony.

### Oprawa startowa

- Ekran powitalny (splash) chowany po ~550 ms.
- Pasek zgody na cookies z wyborem „Akceptuję" / „Tylko niezbędne"
  (`bigww_cookie_v1`).
- Service worker rejestrowany z bloba — strategia network-first, pusty cache.
- `window.BigWW = { version, api, go, t }` do zaglądania z konsoli.
- Odsyłacz do serwera Discord BigWW w stopce menu bocznego.

### Ustawienia

Motyw ciemny / jasny / systemowy (z nasłuchem zmiany w systemie), domyślny kraj,
eksport danych do JSON, import z JSON, kasowanie danych lokalnych.

### Okładki gier

Kafelek gry ma dwie warstwy: prawdziwą okładkę z `img/games/<slug>.jpg` i pod
nią grafikę generowaną z nazwy. Spis pobranych okładek to `img/games/index.js`
(plik JS, nie JSON — patrz `docs/ARCHITEKTURA.md`). Katalog `img/games/` jest
poza repozytorium; po sklonowaniu uruchamia się `cd server && npm run covers`.

## Co DZIAŁA w `server/` (ale front tego nie używa)

Szczegóły i lista endpointów: `server/README.md`.

- Konta: rejestracja e-mailem z hasłem (scrypt), logowanie, wylogowanie, sesja
  w ciasteczku httpOnly ważna 30 dni, ograniczenie liczby prób logowania.
- Logowanie przez Discorda (prawdziwy OAuth) — wymaga `DISCORD_CLIENT_ID`
  i `DISCORD_CLIENT_SECRET`.
- Katalog 205 gier w bazie, wypełniany seedem z `js/data-games.js`.
- Ogłoszenia: dodawanie, edycja (`PATCH`), usuwanie, obserwowanie, lista
  z filtrami, wyszukiwarką odporną na polskie znaki i stronicowaniem.
- Limit ogłoszeń liczony po stronie serwera: 3 / 10 / 20.
- 25 testów (`npm test` w `server/`).
- Skrypt okładek (`npm run covers`) — jedyna część `server/`, z której front
  faktycznie korzysta, i to pośrednio, przez pliki na dysku.

## Czego NIE MA

- **Jakiegokolwiek serwera pod frontem.** Wszystko, co widzi użytkownik, siedzi
  w jego przeglądarce. Dwie osoby na dwóch komputerach nie widzą swoich
  ogłoszeń.
- **Prawdziwej weryfikacji e-maila, SMS-a i logowania społecznościowego.**
  Kody generuje i pokazuje ta sama przeglądarka, która je sprawdza.
- **Bezpieczeństwa haseł.** Hash liczy się w przeglądarce i leży w localStorage —
  każdy, kto ma dostęp do komputera (albo do konsoli), ma wszystkie konta.
- **Płatności.** Checkout to modal z opóźnieniem i komunikatem sukcesu.
- **Wysyłania wiadomości.** Skrzynka jest lokalna, odbiorca nigdy nic nie
  dostanie.
- **Moderacji.** Zgłoszenia i blokady zapisują się u zgłaszającego.
- **Prawdziwych giveawayów.** Losowania są pokazowe, nagrody nie idą.
- **Zgody na regulamin przy rejestracji i usuwania konta.** Same dokumenty są
  (Regulamin, Polityka prywatności), ale RODO to nie tylko dokument.
- **Testów frontu w repozytorium.**

## Znane błędy i pułapki

1. **`server/.env.example` został skasowany** w commicie `c247099`, a
   `docker-compose.yml` ma `env_file: server/.env` i README każe zacząć od
   `cp server/.env.example server/.env`. Kto sklonuje repo dzisiaj, nie
   uruchomi backendu. Plik jest do odtworzenia z historii:
   `git show ba6df87:server/.env.example > server/.env.example`.
2. **„Usuń wszystkie dane" w Ustawieniach nie kasuje nowych kluczy.** `sWipe`
   w `js/view-settings.js` czyści ogłoszenia, monety, premium, boosty, zadania
   i bilety, ale zostawia: `bigww_inbox_v2`, `bigww_notifs_v2`,
   `bigww_blocked_v2`, `bigww_reports_v2`, `bigww_ratings_v2`,
   `bigww_presets_v2`, `bigww_gw_entries`, `bigww_gw_day`, `bigww_cookie_v1`,
   `bigww_users_v2`, `bigww_session_v2`. Użytkownik klika „usuń wszystko"
   i zostaje ze skrzynką, blokadami i kontem.
3. **`rawSave()` w `js/state.js` (linia 39) łyka wyjątek po cichu**
   (`catch (e) {}`). localStorage ma ~5 MB, a pliki z ogłoszeń idą jako data
   URL — jeden film z telefonu zapycha limit i od tego momentu nic się nie
   zapisuje, bez jednego komunikatu. To jest pierwszy realny bug do naprawienia.
4. **Sprzeczna liczba darmowych wiadomości.** `FREE_MSG_LIMIT = 10`
   (`js/state.js`), a plan Darmowy w `js/view-premium.js` obiecuje „5 darmowych
   wiadomości / dzień".
5. **Zaślepki w `js/`**: `api.js`, `data-source.js` i `view-inbox.js` mają po
   dwie linie komentarza i dalej są ładowane w `index.html`.
6. **Dane demo są generowane od nowa przy każdym odświeżeniu** z `Date.now()`
   w polach `added`, więc „dodane 3 h temu" zmienia się między wejściami.
7. **Kolejność skryptów w `index.html` ma znaczenie** — wszystko żyje w zasięgu
   globalnym. `util.js` musi być przed `data-demo.js` (generator woła
   `timeLabel()` przy ładowaniu), `i18n.js` przed `state.js`, `main.js`
   przedostatni, `boot.js` na końcu.
8. **Klucze poza obiektem `KEY`**: `bigww_extra_slot`, `bigww_unlock_cred`,
   `bigww_gw_entries`, `bigww_gw_day`, `bigww_cookie_v1`, `bigww_migrated_v3`.
   Przy czyszczeniu i migracjach trzeba je obsłużyć osobno.
9. **Service worker rejestrowany z bloba** (`js/boot.js`) ma zasięg katalogu
   bloba, nie strony, i nic nie cache'uje (`addAll([])`). Na `file://` nie
   zadziała w ogóle. Dziś nieszkodliwy, ale to nie jest działające PWA.
10. **Brak walidacji formularza ogłoszenia** poza `maxlength` i `min/max`
    na wieku.
11. **Klipy z Twitcha wymagają parametru `parent`** przy embedzie — na
    `file://` nie zadziałają.
12. **Monety i premium są po stronie klienta.** Każdy może otworzyć konsolę
    i wpisać sobie dowolny balans.
13. **Fonty lecą z Google Fonts** (`index.html`, linie 32–34) — jedyna
    zewnętrzna zależność frontu. Bez internetu strona działa na fontach
    systemowych.
14. **`ratePlayer()` nadpisuje `p.rating`** na wygenerowanym obiekcie —
    po odświeżeniu ocena wraca do wartości z generatora, choć wpis
    w `bigww_ratings_v2` zostaje.

## Decyzje

- Front: **waniliowy JS bez builda**, grafika generowana jako SVG, okładki
  pobierane raz na dysk.
- Backend: **Node + Fastify + PostgreSQL w Dockerze**, zapytania przez
  **Kysely** (zamiast Prismy — powód w `docs/DECYZJE.md`).
- Konta w wersji 1.0.0 są **lokalne**; backendowe konta z Discord OAuth czekają
  w `server/`.

Kolejność dalszych prac: `docs/TODO.md`.
