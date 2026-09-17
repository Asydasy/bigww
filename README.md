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
js/                   19 plików: dane, stan, warstwa DATA, widoki, konto, start
server/               backend — Fastify + PostgreSQL + Kysely
docker-compose.yml    baza i serwer jednym poleceniem
docs/STAN.md          co jest zrobione, co nie działa, znane ograniczenia
docs/ARCHITEKTURA.md  układ plików frontu, kolejność ładowania, model danych
docs/DECYZJE.md       podjęte decyzje projektowe i dlaczego
docs/TODO.md          kolejne kroki, uporządkowane
CHANGELOG.md          co zmieniło się w której wersji
WSPOLPRACA.md         praca we dwójkę: gałęzie, podział plików, konflikty
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

Najwygodniej ustawić w `server/.env` **`SERVE_STATIC=1`** — wtedy backend oddaje
też pliki frontu i całość siedzi pod jednym adresem http://localhost:3000,
bez kłopotów z CORS-em.

Strona sama sprawdza przy starcie, czy backend odpowiada. Jeśli tak — chodzi na
prawdziwych kontach i ogłoszeniach z bazy. Jeśli nie — wraca do danych demo,
więc `index.html` otwarty z dysku dalej pokazuje pełną aplikację. Aktywny tryb
widać w stopce menu bocznego.

## Podział ról

- Admin serwisu i testowanie.
- Druga osoba pisząca kod — zasady w `WSPOLPRACA.md`.
- Claude: kod — backend i frontend.

## Ważne

Konta i ogłoszenia są prawdziwe, ale **płatności są udawane** — Sklep i Premium
pokazują „Zapłać 19,99 zł" i fałszywy sukces, bo nie ma bramki płatniczej.
**Ekipy i transmisje live to nadal dane z generatora**, nawet gdy reszta strony
chodzi na serwerze.

Zanim ktokolwiek obcy to zobaczy, obie te rzeczy muszą zniknąć albo zostać
wyraźnie oznaczone — razem z regulaminem, polityką prywatności i możliwością
usunięcia konta. Lista blokerów jest w `docs/TODO.md`.
