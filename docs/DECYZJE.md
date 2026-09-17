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

**Monetyzacja doszyta przez nadpisanie funkcji.** `go`, `renderPlayers`
i `submitAd` są podmieniane w sekcji monetyzacji zamiast przepisywania
oryginałów. To skrót, nie wzorzec — przy przepisywaniu na backend do usunięcia.

## Sposób prowadzenia projektu

- Użytkownik jest adminem i testerem, Claude pisze kod (frontend i backend).
- Projekt ma iść przez wiele sesji, więc stan musi być zapisany poza rozmową:
  repo git + notatki w `docs/` + `CLAUDE.md` dla kolejnych sesji.
- Kontener, w którym to powstaje, jest ulotny — repo trzeba wynosić na zewnątrz
  (paczka do pobrania albo własny remote na GitHubie).
