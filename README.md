# BigWW

Serwis do szukania ludzi do wspólnego grania (nazwa robocza wcześniej: „Ekipa”).
Model wzorowany na ePal / Tinder: ogłoszenie gracza + filtry + kontakt, plus
warstwa monetyzacji (premium, monety, sklep, reklamy).

Stan na 2026-09-17: **działający prototyp front-endowy w jednym pliku HTML**.
Brak backendu, brak bazy, brak kont użytkowników — wszystko trzyma się w
localStorage przeglądarki.

## Jak uruchomić

Otworzyć `index.html` w przeglądarce. Nic więcej nie jest potrzebne — żadnego
serwera, builda ani zależności npm. Fonty (Space Grotesk, Inter) ładują się z
Google Fonts; bez internetu strona działa, tylko na fontach systemowych.

## Co jest w repo

```
index.html            cały prototyp (HTML + CSS + JS, 3449 linii)
docs/STAN.md          co jest zrobione, co nie działa, znane ograniczenia
docs/ARCHITEKTURA.md  mapa kodu — gdzie co siedzi, numery linii, model danych
docs/DECYZJE.md       podjęte decyzje projektowe i dlaczego
docs/TODO.md          kolejne kroki, uporządkowane
CLAUDE.md             instrukcja dla Claude'a w kolejnych sesjach
```

## Podział ról

- Użytkownik: admin serwisu, testuje (tester manualny z zawodu).
- Claude: kod — backend i frontend.

## Ważne

To jest **prototyp demonstracyjny**. Płatności są udawane (nie ma bramki),
gracze są generowani proceduralnie, „live” to statyczne kafelki. Nic nie wychodzi
poza przeglądarkę. Przed jakimkolwiek pokazaniem tego na zewnątrz trzeba to
powiedzieć wprost — w kilku miejscach interfejsu jest to już napisane.
