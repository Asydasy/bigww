# Changelog

Format: najnowsze na górze. Każdy wpis mówi, co zmieniło się w **zachowaniu**,
a nie tylko w plikach.

## [1.1.0] — 2026-09-18

Front znowu rozmawia z backendem, a `docker compose up` stawia całość zaraz po
sklonowaniu repozytorium.

### Naprawione
- **`docker compose up` działa u kogoś, kto klonuje repo.** Wcześniej compose
  wymagał `server/.env`, a plik wzorcowy `server/.env.example` zniknął przy
  scalaniu frontu — nie było z czego go zrobić. Wzór wrócił, kontener sam robi
  migracje i seed, a brak `JWT_SECRET` i `DATABASE_URL` poza produkcją daje
  wartości testowe i ostrzeżenie w logu zamiast błędu przy starcie.
- **„Usuń wszystkie dane” w Ustawieniach kasuje wreszcie wszystko.** Zostawiało
  skrzynkę, powiadomienia, blokady, zgłoszenia, oceny, zestawy filtrów
  i udziały w giveawayach — czyli większość tego, co doszło w wersji 1.0.0.

### Zmienione
- **Warstwa `DATA` wróciła.** Po scaleniu równoległej wersji frontu (commit
  `c247099`) `js/api.js` i `js/data-source.js` były dwulinijkowymi zaślepkami,
  a cała strona chodziła na localStorage — backend stał obok i nikt go nie
  wołał. Teraz strona przy starcie pyta `/api/health` i działa w trybie
  serwerowym albo lokalnym, a tryb widać w stopce menu.
- **Podział danych**: serwer trzyma ogłoszenia, katalog gier, konta
  i obserwowanych; przeglądarka monety, premium, skrzynkę, powiadomienia,
  giveawaye, oceny i blokady. Ekipy i transmisje zostają na danych demo.
- **Konta w trybie serwerowym zakłada backend**: e-mail plus hasło (min.
  8 znaków, scrypt po stronie serwera), sesja w ciasteczku `httpOnly`,
  a przycisk „Discord” przekierowuje na prawdziwy OAuth. Konta lokalne, kod
  z SMS-a i „Google” zostają dla trybu bez backendu — tam to dalej warstwa
  pokazowa.
- **Kontakt nie jest już zmyślany.** Niezalogowanemu karta pisze „ukryty —
  zaloguj się", zamiast układać tag Discorda z nicku. Dla danych demo zmyślanie
  zostaje, bo tam nie ma czego pokazać.
- **„Szukam teraz” zapisuje się w bazie** (`lookingNow` na moich ogłoszeniach),
  więc status widzą inni, a nie tylko właściciel u siebie.
- **Filtrowanie i sortowanie zostaje po stronie przeglądarki w obu trybach** —
  jedna ścieżka kodu, więc nie da się mieć innych wyników z backendem i bez
  niego. Front pobiera do 480 ogłoszeń na raz; przy większej bazie filtry
  przechodzą na serwer, który już je ma.
- **Eksport, import i kasowanie danych mówią wprost**, że ogłoszenia
  i obserwowani siedzą w bazie i zostają.

### Dodane
- **Ranga i dni tygodnia w bazie** (migracja `004`): kolumny `rank` i `days`,
  filtry `?rank=` i `?day=`, walidacja listą wartości. Ogłoszenie bez
  zadeklarowanych dni pasuje do każdego filtru dnia.
- **Test przeklikujący front w obu trybach** — `server/test/front.e2e.mjs`,
  `npm run test:front`. 26 sprawdzeń: rejestracja, dodanie ogłoszenia, ranga
  w bazie, przeżycie przeładowania, obserwowanie, ukryty kontakt u gościa
  i powrót na dane lokalne po odcięciu API. Do tego 26 testów API (`npm test`).
- Wskaźnik źródła danych w stopce menu: zielone „● serwer”, żółte „● lokalnie”.

### Uwagi
- Pliki wrzucane do ogłoszenia **zostają tylko w przeglądarce autora** — serwer
  nie przyjmuje data URL-i. Formularz mówi o tym przy wysyłce.
- Monety i premium dalej siedzą w przeglądarce, więc każdy może zmienić sobie
  saldo w konsoli. To jest blokada przed prawdziwymi płatnościami, nie detal.

## [0.7.0] — 2026-09-17

Przeniesienie tego, co dało się wziąć z kolejnej równoległej wersji frontu
(znów jeden plik HTML, znów na starszym kodzie).

### Dodane
- **Regulamin** (12 paragrafów) i **polityka prywatności** (9 rozdziałów, RODO)
  jako osobny widok `js/view-terms.js`. Odsyłacze w stopce menu bocznego,
  dostępne bez logowania. Oba dokumenty dzielą jeden widok — `go("privacy")`
  przełącza treść.

### Nieprzeniesione i dlaczego
- **Wielojęzyczność PL/EN** (~156 kluczy tłumaczeń). To realna funkcja, ale
  w tamtej wersji działa przez jedną wielką funkcję `applyStaticI18n()`, która
  ręcznie przepisuje `innerHTML` przycisków menu i każdego nagłówka. Przy
  naszym podziale na 20 plików trzeba by ją rozbudowywać przy każdym nowym
  napisie. Jeśli wchodzimy w języki, lepiej zrobić to atrybutami `data-i18n`
  w markupie — wtedy nowy napis nie wymaga dopisywania niczego w kodzie.
  Do ustalenia osobno: dziś nie ma zagranicznych użytkowników.
- **Konta w localStorage, weryfikacja e-maila kodem, logowanie telefonem
  i przez portale społecznościowe.** Kod generuje kod weryfikacyjny w
  przeglądarce i sam go sobie pokazuje — to nie jest weryfikacja, tylko jej
  wygląd. Przy działającym backendzie z prawdziwymi kontami wstawienie tego
  byłoby krokiem wstecz. Prawdziwa weryfikacja e-maila wymaga tokenu po stronie
  serwera i wysyłki poczty; logowanie przez Discorda już mamy.

### Uwaga
- Dokumenty są wzorcowe, napisane pod prawo polskie, ale **nie są poradą
  prawną**. Przed wpuszczeniem prawdziwych użytkowników powinien je przejrzeć
  prawnik — zwłaszcza § 3 (wiek od 13 lat przy serwisie kojarzącym ludzi).
- Samo istnienie dokumentów nie zamyka tematu: **przy rejestracji nie ma jeszcze
  zgody na regulamin, a konta nie da się usunąć** (backend nie ma
  `DELETE /api/auth/me`). To zostaje na liście blokerów.

## [0.6.0] — 2026-09-17

### Dodane
- **Prawdziwe okładki gier ze Steama.** `cd server && npm run covers` ściąga
  listę gier ze Steama, dopasowuje do niej nasze 205 tytułów po znormalizowanej
  nazwie i pobiera poziome nagłówki do `img/games/`. Kafelek gry pokazuje
  okładkę, a pod nią zostaje dotychczasowa grafika generowana — gdy pliku nie
  ma, widać po prostu tę drugą warstwę. Dwuliterowy skrót znika, gdy jest
  prawdziwy obrazek.
- Skrypt można uruchamiać wielokrotnie: pomija to, co już pobrał.
  `npm run covers -- --force` pobiera wszystko od nowa. Tytuły, których nie
  dopasował, wypisuje na końcu — numer ze Steama można im dopisać ręcznie
  w `RECZNE_NUMERY`.

### Uwagi
- **Gry spoza Steama zostają przy grafice generowanej** — Fortnite, Genshin,
  Roblox, tytuły konsolowe i mobilne, w sumie około 50 z 205. To nie jest błąd.
- **Okładki nie trafiają do repozytorium** (`img/games/` w `.gitignore`): to
  kilka MB cudzych plików. Każdy uruchamia skrypt u siebie raz.
- Okładki są własnością wydawców. Przy ogłoszeniach do danej gry to praktyka
  powszechna, ale bez licencji — przy zarabianiu na serwisie trzeba przejść na
  źródło z regulaminem (RAWG, IGDB) i podać je na stronie.
- Bez pobranych okładek strona robi jedno zapytanie o spis, dostaje 404
  i zostaje przy grafice generowanej.
- Spis jest plikiem JS, a nie JSON-em: przy otwarciu `index.html` podwójnym
  kliknięciem przeglądarka blokuje `fetch()` do plików z dysku, więc okładki
  w ogóle by się nie pojawiały. `<script src>` działa w obu przypadkach.

### Sprawdzone
- Kafelek z pobraną okładką pokazuje obrazek i chowa skrót literowy, pozostałe
  zostają przy grafice generowanej.
- Wejście w bazę gier bez okładek: 205 kafelków, jedno zapytanie o spis, zero
  błędów w kodzie. Pierwsza wersja sprawdzała każdy obrazek osobno i dawała
  204 błędy 404 — stąd spis `index.json`.

## [0.5.1] — 2026-09-17

### Naprawione
- **W polach e-mail i hasła nie było widać wpisywanego tekstu.** Style
  formularza obejmowały tylko `input[type=text]` i `[type=number]`, więc pola
  logowania dostawały białe tło przeglądarki i odziedziczony jasny kolor
  tekstu — biały na białym. Reguła obejmuje teraz wszystkie pola tekstowe
  (e-mail, hasło, szukaj, url, telefon, data) i ustawia kolor wprost, zamiast
  liczyć na dziedziczenie. Doszło też stylowanie podpowiedzi w pustym polu.

### Zmienione
- **Podział na to, co widzi gość, i to, co widzi zalogowany.** Niezalogowany
  widzi Start, Szukaj graczy, Bazę gier, Ekipy, Live i Ustawienia. Dodaj
  ogłoszenie, Moje ogłoszenia, Obserwowani, Premium, Sklep i saldo monet WW
  pojawiają się po zalogowaniu.
- Wejście na zablokowany widok otwiera okno logowania zamiast pustej strony —
  pilnuje tego `go()`, więc działa tak samo z menu, z przycisku na stronie
  startowej i z odsyłaczy w pustych stanach.
- Wylogowanie na widoku dla zalogowanych cofa na stronę startową.
- **W trybie demo nic się nie chowa** — kont tam nie ma, więc cała strona
  zostaje dostępna jak dotąd.

## [0.5.0] — 2026-09-17

Scalenie równoległej pracy nad frontem z naszą wersją. Tamta powstawała na
kodzie sprzed czterech commitów, więc zmiany zostały przeniesione ręcznie,
plik po pliku, a nie scalone gitem.

### Dodane
- **Godziny grania od–do** zamiast sztywnych pór dnia — w filtrach, w
  formularzu i na kartach. Zakresy przechodzące przez północ (22–4) są
  obsłużone. Filtr działa w obu trybach: w demo liczy to `hoursOverlap()`
  w przeglądarce, na serwerze funkcja `bigww_hours_overlap()` w bazie.
  Nowe kolumny `hour_from` / `hour_to` (migracja `003_hours.sql`).
- **Edycja własnego ogłoszenia** — przycisk „Edytuj" na karcie wczytuje
  ogłoszenie do formularza; przycisk publikacji zmienia się w „Zapisz zmiany".
  Na serwerze idzie przez `PATCH /api/ads/:id`, w demo nadpisuje localStorage.
- **Przełącznik siatka / lista** nad wynikami, zapamiętywany między wejściami.
- **Aktywne filtry jako chipy z krzyżykiem** — widać, co zawęża wyniki, i da
  się zdjąć pojedynczy warunek bez czyszczenia wszystkiego.
- **Eksport i import danych** w Ustawieniach — cały pakiet z przeglądarki
  (ogłoszenia, obserwowani, ustawienia, monety), do przeniesienia na inny
  komputer albo jako kopia przed czyszczeniem.
- Treść wyśrodkowana i ograniczona do 1100 px, żeby na szerokim monitorze nie
  rozjeżdżała się na całą szerokość.

### Zmienione
- **Łagodniejszy darmowy plan**: 3 ogłoszenia zamiast 2, 10 wiadomości dziennie
  zamiast 5, 3 darmowe odblokowania kontaktu dziennie, odblokowanie za 15 WW
  zamiast 20. Liczby zmienione **po obu stronach** — `js/state.js` i
  `adLimitFor()` w `server/src/config.js`.
- **Wszystkie zakładki zostają w obu trybach** — Premium, Sklep, monety, Ekipy
  i Live działają tak jak wcześniej. Przy płatnościach zostaje informacja, że
  są demonstracyjne (pytanie „Czy płatność jest prawdziwa?" w FAQ Premium i
  opis przy kupowaniu pakietów monet).
- **Kontakt nie jest już towarem za monety.** Na serwerze widzi go każdy
  zalogowany, niezalogowany dostaje kłódkę i zachętę do założenia konta.
  Blokowanie kontaktu za monety, których nie da się kupić, zamykało serwis
  dokładnie w tym miejscu, po co ludzie na niego wchodzą. Płatne odblokowania
  wrócą razem z prawdziwą bramką płatniczą.
- `js/util.js` ładuje się teraz **przed** `js/data-demo.js`, bo generator
  graczy woła `timeLabel()` już przy ładowaniu strony.

### Nieprzeniesione i dlaczego
- **Konta w localStorage** (`js/auth.js` z tamtej wersji). Robiły to samo, co
  nasz backend, ale trzymały hasła w przeglądarce, konto nie przechodziło na
  inne urządzenie, a dwie osoby nigdy nie zobaczyłyby się nawzajem. Zostaje
  logowanie przez serwer.
- **Usunięcie napisów o wersji demonstracyjnej** przy płatnościach — zostają,
  bo ekran, który prosi o 19,99 zł i pokazuje potwierdzenie zapłaty, nie może
  udawać prawdziwego, dopóki nie ma bramki płatniczej.
- **Skasowanie katalogu `server/src`** obecne w tamtej paczce. Wygląda na
  przypadkowe; backend zostaje.

### Naprawione
- `updateBadges()` wpisywało liczby do odznaczek bez sprawdzania, czy istnieją,
  co przy każdej zmianie menu wywracało publikację ogłoszenia. Teraz każde
  przypisanie jest sprawdzane. Znalezione przez test.

### Sprawdzone
- 25 testów API (doszedł filtr godzin i widoczność kontaktu dla zalogowanego).
- Test przeklikujący **oba tryby**: dodanie i edycja ogłoszenia, filtr godzin
  21–23 kontra 6–9, chipy filtrów, przełącznik widoku z zapamiętaniem po
  odświeżeniu, komplet zakładek w menu, ekipy i transmisje.

## [0.4.2] — 2026-09-17

### Dodane
- **`WSPOLPRACA.md`** — zasady pracy we dwójkę: osobne gałęzie zamiast commitów
  na `main`, tabela podziału plików na „bezpieczne" i „wspólne", rozwiązywanie
  konfliktów, numerowanie migracji i reguły dla dwóch równoległych sesji z
  Claude'em.
- **`.gitattributes`** — końce linii trzymane w repo jako LF, żeby drugi
  komputer nie pokazywał całych plików jako zmienionych.

## [0.4.1] — 2026-09-17

### Naprawione
- **Strona otwarta spod innego adresu niż `localhost:3000` nie znajdowała API.**
  Dotyczyło to każdego udostępnienia na zewnątrz: przez tunel, przez adres w
  sieci domowej albo przez domenę. `API.resolveBase()` sprawdza teraz po kolei
  możliwe adresy serwera (ten sam host co strona, potem `localhost:3000`) i
  zostaje przy pierwszym, który odpowie na `/health`.

## [0.4.0] — 2026-09-17

### Dodane
- **Front rozmawia z backendem.** Nowa warstwa `js/data-source.js` (`DATA`) jest
  jedynym miejscem, z którego widoki biorą dane. Rozpoznaje przy starcie, czy
  serwer odpowiada, i działa w dwóch trybach:
  - **serwer** — ogłoszenia z bazy, konta, filtry i wyszukiwanie po stronie
    PostgreSQL, stronicowanie;
  - **demo** — backendu nie ma, więc dane z generatora i localStorage, tak jak
    wcześniej. Dzięki temu `index.html` otwarty z dysku dalej pokazuje pełną
    aplikację.
  W stopce menu widać, który tryb jest aktywny.
- **Ekran logowania i rejestracji** (`js/auth-ui.js`): okno z e-mailem i hasłem
  oraz przyciskiem „Kontynuuj przez Discorda", panel konta w menu bocznym z
  nazwą, adresem i wylogowaniem.
- **Filtry `lang`, `tag` i `newHours` w API** — dzięki nim szybkie filtry
  („Po polsku", „Uczą nowych", „Świeże 24 h") działają też na serwerze.
- Widoki **Moje ogłoszenia** i **Obserwowani** pokazują dane z konta i proszą o
  zalogowanie, gdy go brakuje. „Moje ogłoszenia" pokazują zajęte miejsca z limitu.

### Zmienione
- **„Pokaż więcej" dociąga kolejną stronę** zamiast przerysowywać całą listę.
- **Wyszukiwarka czeka 250 ms po ostatnim znaku**, zanim odpyta serwer —
  wcześniej każde naciśnięcie klawisza oznaczałoby osobne zapytanie.
- Sortowanie po godzinach w grze i ocenie znika w trybie serwerowym, bo tych
  danych nie ma w prawdziwych ogłoszeniach (to pola generatora demo).
- Liczniki w menu, statystyki na stronie startowej i liczba ogłoszeń przy grach
  liczone są przez `DATA`, więc na serwerze pokazują prawdziwe liczby.

### Naprawione
- **Przycisk „Zaloguj się" otwierał formularz zakładania konta** — do funkcji
  trafiał obiekt zdarzenia kliknięcia zamiast nazwy zakładki. Znalezione przez
  test przeklikujący rejestrację.
- **Karta sponsorowana pokazywała się nad komunikatem „Brak wyników"** —
  teraz wchodzi tylko wtedy, gdy na liście są prawdziwe ogłoszenia.
- **„1 graczy" zamiast „1 gracz"** przy kafelkach gier i liczbie wyników.

### Sprawdzone
- Test przeklikujący pełny przepływ na serwerze: rejestracja przez okno
  logowania, dodanie ogłoszenia formularzem, znalezienie go wyszukiwarką,
  filtr po grze, obserwowanie i odobserwowanie, wylogowanie.
- Test trybu demo bez backendu: wszystkie 11 widoków renderuje się bez błędów.

## [0.3.0] — 2026-09-17

### Dodane
- **Backend** w `server/`: Node + Fastify + PostgreSQL, zapytania przez Kysely.
  Konta (rejestracja e-mailem z hasłem, logowanie przez Discorda), sesja w
  ciasteczku httpOnly, katalog gier, pełny CRUD ogłoszeń z filtrami,
  stronicowaniem i limitem na konto, obserwowanie ogłoszeń.
- **`docker-compose.yml`** — `docker compose up` stawia bazę i serwer.
- **Migracje** w `server/migrations/` z własnym runnerem (`npm run migrate`)
  oraz seed katalogu gier z `js/data-games.js` (`npm run seed`), żeby front i
  baza nie rozjechały się co do nazw.
- **23 testy API** (`npm test` w `server/`) — konta, uprawnienia, filtry,
  limity, obserwowanie. Idą na osobnej bazie.
- **`js/api.js`** — jedyne miejsce, przez które front będzie rozmawiał z
  serwerem. Widoki jeszcze z niego nie korzystają; można go wywołać z konsoli
  (`await API.games({ q: "elden" })`).

### Naprawione
- **Wyszukiwarka na serwerze gubiła polskie znaki.** „rankedow" nie znajdowało
  „rankedów", choć front dokładnie tak normalizuje zapytania. Doszła funkcja
  `bigww_norm()` w bazie, kolumna `ads.search_text` pilnowana wyzwalaczem i
  indeks trigramowy. Znalezione przez test.
- **Serwer wysyłał klientowi wewnętrzne komunikaty błędów** (np. nazwę
  brakującej funkcji w bazie), bo handler błędów był rejestrowany po trasach i
  w ogóle nie działał. Teraz idzie przed nimi, a 500 zwraca ogólny komunikat.
  Znalezione przez smoke test po HTTP.
- **`js/api.js` budowało zły adres przy otwarciu strony z dysku** — wychodziło
  `file:///api/...`. Teraz wszystko poza portem 3000 celuje w
  `http://localhost:3000/api`.

### Zmienione
- **ORM: Kysely zamiast Prismy.** Prisma pobiera swój silnik z
  `binaries.prisma.sh`, a środowisko, w którym powstaje kod, ma ten host
  zablokowany — każda linijka byłaby pisana bez możliwości uruchomienia.
  Kysely to czysty pakiet z npm, więc całość dało się przetestować na żywej
  bazie przed oddaniem.

## [0.2.0] — 2026-09-17

### Zmienione
- **Rozdzielony jeden plik `index.html` (3449 linii) na strukturę katalogów.**
  CSS poszedł do `css/style.css`, JavaScript do 16 plików w `js/` podzielonych
  wg odpowiedzialności. `index.html` to teraz sam markup (436 linii) plus lista
  skryptów. Zachowanie aplikacji bez zmian — to czysta reorganizacja.
- **Usunięte nadpisywanie funkcji.** `go`, `renderPlayers` i `submitAd` były
  definiowane, a potem podmieniane przez warstwę monetyzacji. Teraz logika jest
  wpięta wprost w oryginały: `go()` woła `maybeShowInterstitial()`,
  `renderPlayers()` woła `addSponsoredSlot()`, `submitAd()` woła
  `progressQuest("post")`.

### Naprawione
- Liczba gier w bazie to 205, nie 204 — poprawione w dokumentacji.

### Sprawdzone
- Smoke test w headless Chromium: wszystkie 11 widoków renderuje się bez błędów
  w konsoli, wyszukiwarka zwraca 12 wyników dla „valorant", dodanie ogłoszenia
  trafia do `MINE` i na listę.

### Uwaga
- Ładowanie fontów z Google Fonts to jedyna zewnętrzna zależność. Bez internetu
  strona działa na fontach systemowych.

## [0.1.0] — 2026-09-17

### Dodane
- Prototyp BigWW w jednym pliku HTML: 11 widoków, 205 gier, generator 720
  graczy / 80 ekip / 36 transmisji, filtry i wyszukiwarka, formularz ogłoszenia
  z podglądem, motyw ciemny i jasny.
- Warstwa monetyzacji: premium (4 plany), monety WW, sklep, reklamy z nagrodą,
  dzienne zadania, battle pass, program polecający.
- Repozytorium git z notatkami: `README.md`, `CLAUDE.md`, `docs/STAN.md`,
  `docs/ARCHITEKTURA.md`, `docs/DECYZJE.md`, `docs/TODO.md`.
