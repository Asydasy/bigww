# Decyzje projektowe

Zapis „co postanowiliśmy i dlaczego”, żeby nie wracać do tych samych rozmów.

## Produkt

**Wszystkie gry, nie jedna.** Serwis nie zawęża się do jednego tytułu — baza ma
205 gier z gatunkami i platformami. Zawężenie byłoby łatwiejsze do wypełnienia
ludźmi, ale zamyka drogę do skali.

**Wzór biznesowy: ePal + Tinder.** Ogłoszenie gracza jako podstawowa jednostka,
filtrowanie zamiast losowego matchmakingu, kontakt jako rzecz płatna albo
limitowana. Nie kopiujemy mechaniki swipe'a — lista z filtrami lepiej pasuje do
„szukam kogoś do konkretnej gry o konkretnej porze”.

**Darmowe zostaje darmowe.** Premium podbija widoczność ogłoszenia (góra
wyników, złota ramka, wyższy limit ogłoszeń), ale nie blokuje szukania ani
pisania. Blokowanie rdzenia zabiłoby serwis przy pustej bazie użytkowników.

**Nazwa.** Robocza „Ekipa” zastąpiona przez **BigWW** (monety nazywają się WW).

## Techniczne

**Jeden plik HTML zamiast frameworka.** Prototyp ma pokazywać pomysł i dawać się
klikać, nie ma być fundamentem produkcji. Brak builda oznacza, że otwiera się
podwójnym kliknięciem i działa na każdej maszynie — również do testowania.
Przy przejściu na backend ten plik jest referencją UI, nie bazą kodu.

**Zero zależności zewnętrznych we froncie.** Brak bibliotek JS. Awatary i
zapasowe okładki gier są generowane jako SVG z hasza nazwy — dzięki temu repo
waży tyle, co pliki tekstowe, a nic nie wygasa ani nie znika z CDN-u. Prawdziwe
okładki doszły później, ale pobiera się je raz na dysk i serwuje u siebie
(patrz niżej), więc strona dalej nie ciągnie niczego z cudzego serwera.

**Generator deterministyczny (mulberry32 z seeda).** Ten sam nick zawsze daje
ten sam awatar, ta sama gra tę samą okładkę. Bez tego demo wyglądałoby inaczej
przy każdym odświeżeniu i nie dałoby się o nim sensownie rozmawiać.

**localStorage jako „baza”.** Świadomie tymczasowe. Pozwala testować pełny
przepływ (dodaj ogłoszenie → zobacz je na liście → wypromuj → kup premium) bez
ani jednej linijki serwera.

**Monetyzacja doszyta przez nadpisanie funkcji** — cofnięte 17.09.2026,
a potem **przywrócone razem ze scaleniem równoległej wersji frontu**.
`go`, `renderPlayers` i `submitAd` są znowu opakowywane na końcu
`js/monetization.js`. Działa to tylko dlatego, że ten plik ładuje się po
plikach z oryginałami. Zostaje na razie, bo przepisywanie monetyzacji w trakcie
spinania z backendem byłoby dwiema zmianami naraz — jest w `docs/TODO.md`,
punkt 1.

**Dane z serwera wchodzą pod istniejące globalne tablice, zamiast przepisywać
widoki na async.** Po powrocie warstwy `DATA` (18.09.2026) `allPlayers()`,
`MINE` i `SAVED` są w trybie serwerowym wypełniane danymi z bazy, a filtry,
sortowanie i karty zostają bez zmian. Alternatywą było przerobienie
`renderPlayers()` i wszystkich jego wywołań na asynchroniczne — przy froncie,
który w międzyczasie urósł o skrzynkę, giveawaye i profil gracza, to ryzyko
było większe niż zysk. Cena: front pobiera do 480 ogłoszeń na raz i filtruje
je u siebie. Przy większej bazie filtrowanie przenosi się na serwer, który ma
już komplet filtrów.

**Zapis tylko przez `DATA`.** Czytanie może iść po globalnych tablicach, ale
każdy zapis (dodanie, edycja, usunięcie, obserwowanie, „szukam teraz”,
logowanie) przechodzi przez `DATA`. Dzięki temu nie da się napisać kodu, który
działa wyłącznie z backendem albo wyłącznie bez niego.

**Okładki gier pobierane raz na dysk, nie podłączane z cudzego serwera.**
Obrazki idą ze Steama, ale zapisujemy je u siebie i serwujemy z własnego hosta.
Trzyma to zasadę, że strona nie ładuje niczego z zewnątrz: działa offline, nie
zależy od cudzego CDN-u i nie wysyła naszych użytkowników do Steama przy każdym
wejściu. Cena: jedno polecenie po sklonowaniu repozytorium.

Warto wiedzieć, że okładki są własnością wydawców. Pokazywanie ich przy
ogłoszeniach do danej gry to praktyka powszechna i ryzyko niewielkie, ale nie ma
tu licencji — przy zarabianiu na serwisie trzeba wrócić do źródła z regulaminem
(RAWG albo IGDB) i podać je na stronie.

## Backend

**Node + Fastify + PostgreSQL.** Ten sam język co front, więc nie przeskakuje
się między dwoma światami. Baza w kontenerze — `docker compose up` i stoi.

**Kysely zamiast Prismy.** Pierwotnie wybrana była Prisma. Okazało się, że
pobiera swój silnik z `binaries.prisma.sh`, a środowisko, w którym powstaje
kod, ma ten host zablokowany polityką sieci. Każda linijka kodu z Prismą byłaby
pisana bez możliwości uruchomienia. Kysely to czysty pakiet z npm: zapytania
dalej składa się w JavaScripcie, a całość dało się przetestować na żywej bazie
przed oddaniem. Cena: migracje piszemy jako pliki SQL i nie ma `prisma studio`.

**Logowanie dwiema drogami.** Discord jest naturalny dla graczy i daje gotowy,
wiarygodny kontakt. E-mail z hasłem zostaje dla tych, którzy Discorda nie mają.
Konto z tym samym, potwierdzonym przez Discorda adresem jest dopinane do
istniejącego zamiast tworzyć duplikat.

**Hasła przez scrypt z wbudowanego `crypto`.** Bez zewnętrznej biblioteki —
Node ma to od lat, a jest to funkcja zaprojektowana pod hasła.

**Sesja jako JWT w ciasteczku httpOnly.** Token w localStorage byłby do
odczytania przez JavaScript strony, więc jeden udany XSS wynosiłby cudze sesje.

**Nazwy kolumn `time_of_day` i `descr`.** `time` i `desc` to słowa zastrzeżone
w SQL. Zamiana z powrotem na `time` i `desc` siedzi w `server/src/shape.js`,
dzięki czemu front nie musi o tym wiedzieć.

**Wyszukiwanie znormalizowane w bazie.** Front od początku zdejmował polskie
znaki (`norm()`), więc baza musi robić dokładnie to samo — inaczej ten sam
wpisany tekst daje inne wyniki. Stąd funkcja `bigww_norm()`, kolumna
`ads.search_text` pilnowana wyzwalaczem i indeks trigramowy.

**Monety i premium po stronie serwera.** W przeglądarce każdy wpisze sobie
dowolne saldo w konsoli. Dopóki nie ma prawdziwych pieniędzy, to nie boli, ale
schemat bazy jest już przygotowany pod przeniesienie portfela.

**Serwer wstaje bez pliku `.env` — poza produkcją.** Brak `DATABASE_URL`
i `JWT_SECRET` daje wartości testowe i ostrzeżenie w logu, a przy
`NODE_ENV=production` jest błędem, który zatrzymuje start. Powód: „git clone
&& docker compose up" ma działać u kogoś, kto widzi repo pierwszy raz, i nie
kończyć się błędem o brakującym pliku. Compose robi też migracje i seed sam,
bo trzy polecenia do wpisania po kolei to trzy okazje do pomyłki.

**Konta lokalne zostają, ale tylko bez backendu.** Rejestracja w przeglądarce,
kod weryfikacyjny pokazywany na ekranie i „logowanie przez Google" to warstwa
pokazowa — wygląda jak konto, nie jest kontem. W trybie serwerowym nic z tego
nie jest używane: konto zakłada backend, hasło hashuje scrypt po stronie
serwera, a Discord to prawdziwy OAuth. Usunięcie kodu lokalnych kont zabrałoby
możliwość pokazania serwisu z pliku na dysku, więc zostaje — z wyraźną granicą.

## Sposób prowadzenia projektu

- Użytkownik jest adminem i testerem, Claude pisze kod (frontend i backend).
- Projekt ma iść przez wiele sesji, więc stan musi być zapisany poza rozmową:
  repo git + notatki w `docs/` + `CLAUDE.md` dla kolejnych sesji.
- Kontener, w którym to powstaje, jest ulotny — repo trzeba wynosić na zewnątrz
  (paczka do pobrania albo własny remote na GitHubie).
