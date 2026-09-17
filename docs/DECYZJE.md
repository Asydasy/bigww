# Decyzje projektowe

Zapis „co postanowiliśmy i dlaczego”, żeby nie wracać do tych samych rozmów.

## Produkt

**Wszystkie gry, nie jedna.** Serwis nie zawęża się do jednego tytułu — baza ma
204 gry z gatunkami i platformami. Zawężenie byłoby łatwiejsze do wypełnienia
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

**Zero zależności zewnętrznych.** Brak bibliotek JS, brak obrazków. Awatary i
okładki gier są generowane jako SVG z hasza nazwy — dzięki temu repo waży tyle,
co jeden plik tekstowy, a nic nie wygasa ani nie znika z CDN-u.

**Generator deterministyczny (mulberry32 z seeda).** Ten sam nick zawsze daje
ten sam awatar, ta sama gra tę samą okładkę. Bez tego demo wyglądałoby inaczej
przy każdym odświeżeniu i nie dałoby się o nim sensownie rozmawiać.

**localStorage jako „baza”.** Świadomie tymczasowe. Pozwala testować pełny
przepływ (dodaj ogłoszenie → zobacz je na liście → wypromuj → kup premium) bez
ani jednej linijki serwera.

**Monetyzacja doszyta przez nadpisanie funkcji** — cofnięte 17.09.2026.
`go`, `renderPlayers` i `submitAd` były podmieniane w sekcji monetyzacji
zamiast przepisywania oryginałów. Przy rozdzielaniu plików to by się rozsypało
albo zaczęło działać losowo w zależności od kolejności ładowania, więc
monetyzacja wchodzi teraz przez trzy zwykłe wywołania.

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

## Sposób prowadzenia projektu

- Użytkownik jest adminem i testerem, Claude pisze kod (frontend i backend).
- Projekt ma iść przez wiele sesji, więc stan musi być zapisany poza rozmową:
  repo git + notatki w `docs/` + `CLAUDE.md` dla kolejnych sesji.
- Kontener, w którym to powstaje, jest ulotny — repo trzeba wynosić na zewnątrz
  (paczka do pobrania albo własny remote na GitHubie).
