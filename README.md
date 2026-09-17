# BigWW

Serwis do szukania ludzi do wspólnego grania (nazwa robocza wcześniej: „Ekipa”).
Model wzorowany na ePal / Tinder: ogłoszenie gracza + filtry + kontakt, plus
warstwa monetyzacji (premium, monety, sklep, reklamy).

Stan na 2026-09-17: **działający prototyp front-endowy**, rozdzielony na pliki.
Brak backendu, brak bazy, brak kont użytkowników — wszystko trzyma się w
localStorage przeglądarki.

## Jak uruchomić

Otworzyć `index.html` w przeglądarce. Nic więcej nie jest potrzebne — żadnego
serwera, builda ani zależności npm. Fonty (Space Grotesk, Inter) ładują się z
Google Fonts; bez internetu strona działa, tylko na fontach systemowych.

## Co jest w repo

```
index.html            markup — 11 widoków i modale
css/style.css         style
js/                   17 plików: dane, stan, widoki, monetyzacja, api, start
server/               backend — Fastify + PostgreSQL + Kysely
docker-compose.yml    baza i serwer jednym poleceniem
docs/STAN.md          co jest zrobione, co nie działa, znane ograniczenia
docs/ARCHITEKTURA.md  układ plików frontu, kolejność ładowania, model danych
docs/DECYZJE.md       podjęte decyzje projektowe i dlaczego
docs/TODO.md          kolejne kroki, uporządkowane
CHANGELOG.md          co zmieniło się w której wersji
CLAUDE.md             instrukcja dla Claude'a w kolejnych sesjach
```

Co gdzie siedzi w `js/` — tabela w `docs/ARCHITEKTURA.md`.
Backend i lista endpointów — `server/README.md`.

## Backend

```
cp server/.env.example server/.env      # i wpisz własny JWT_SECRET
docker compose up
docker compose exec api npm run migrate
docker compose exec api npm run seed
```

Sprawdzenie: http://localhost:3000/api/health

**Front jeszcze z niego nie korzysta** — strona działa na danych demo.
`js/api.js` jest gotową warstwą do przepięcia widoków na serwer.

## Podział ról

- Użytkownik: admin serwisu, testuje (tester manualny z zawodu).
- Claude: kod — backend i frontend.

## Ważne

To jest **prototyp demonstracyjny**. Płatności są udawane (nie ma bramki),
gracze są generowani proceduralnie, „live” to statyczne kafelki. Nic nie wychodzi
poza przeglądarkę. Przed jakimkolwiek pokazaniem tego na zewnątrz trzeba to
powiedzieć wprost — w kilku miejscach interfejsu jest to już napisane.
