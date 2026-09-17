# BigWW

Serwis do szukania ludzi do wspólnego grania (nazwa robocza wcześniej: „Ekipa”).
Model wzorowany na ePal / Tinder: ogłoszenie gracza + filtry + kontakt, plus
warstwa monetyzacji (premium, monety, sklep, reklamy).

Stan na 2026-09-18: **front spięty z backendem**. Ogłoszenia, katalog gier,
konta i obserwowani idą z PostgreSQL; monety, premium, skrzynka, powiadomienia
i giveawaye siedzą jeszcze w przeglądarce. Bez backendu ta sama strona działa
na danych z generatora.

## Jak uruchomić

```
git clone https://github.com/Asydasy/bigww.git
cd bigww
docker compose up
```

Potem http://localhost:3000. Kontener sam zakłada tabele, wgrywa katalog gier
i serwuje front razem z API — żadnych plików do kopiowania po drodze.

Bez Dockera (Node 22+ i PostgreSQL 16):

```
cd server
npm install
cp .env.example .env      # popraw DATABASE_URL i wpisz własny JWT_SECRET
npm run migrate
npm run seed
npm run dev
```

Sam front, bez niczego: otwórz `index.html` w przeglądarce. Strona sprawdzi, czy
backend odpowiada, i jak nie — pokaże pełną aplikację na danych demo. Aktywny
tryb widać w stopce menu bocznego: zielone „● serwer” albo żółte „● lokalnie”.

## Co jest w repo

```
index.html            markup — 15 widoków i modale
css/style.css         style
js/                   24 pliki: dane, stan, warstwa DATA, widoki, konto, start
img/games/            okładki gier pobierane skryptem (poza repozytorium)
server/               backend — Fastify + PostgreSQL + Kysely
docker-compose.yml    baza, migracje, seed i serwer jednym poleceniem
docs/STAN.md          co jest zrobione, co nie działa, znane błędy
docs/ARCHITEKTURA.md  układ plików frontu, dwa tryby, model danych
docs/DECYZJE.md       podjęte decyzje projektowe i dlaczego
docs/TODO.md          kolejne kroki, uporządkowane
CHANGELOG.md          co zmieniło się w której wersji
WSPOLPRACA.md         praca we dwójkę: gałęzie, podział plików, konflikty
CLAUDE.md             instrukcja dla Claude'a w kolejnych sesjach
```

Co gdzie siedzi w `js/` — tabela w `docs/ARCHITEKTURA.md`.
Backend i lista endpointów — `server/README.md`.

## Testy

```
cd server
npm test              # 26 testów API (osobna baza z .env.test)
npm run test:front    # przeklikanie frontu w obu trybach (wymaga Playwrighta)
```

Do testu frontu potrzebny jest działający serwer oraz
`npm i -D playwright && npx playwright install chromium`.

## Okładki gier

Kafelki gier mają domyślnie grafikę generowaną z nazwy. Żeby wstawić prawdziwe
okładki ze Steama:

```
cd server
npm run covers
```

Pobiera je raz do `img/games/` (katalog jest poza repozytorium) i zapisuje spis
`img/games/index.js`. Gry spoza Steama — Fortnite, Genshin, tytuły konsolowe
i mobilne — zostają przy grafice generowanej i to jest w porządku. Skrypt
wypisuje na końcu, czego nie znalazł.

## Podział ról

- Admin serwisu i testowanie.
- Druga osoba pisząca kod — zasady w `WSPOLPRACA.md`.
- Claude: kod — backend i frontend.

## Ważne

Konta i ogłoszenia są prawdziwe, ale **płatności są udawane** — Sklep i Premium
pokazują „Zapłać 19,99 zł" i fałszywy sukces, bo nie ma bramki płatniczej.
**Monety, skrzynka, powiadomienia i giveawaye siedzą w przeglądarce**, więc
wiadomość wysłana z karty gracza nigdzie nie leci, a saldo monet każdy może
sobie zmienić w konsoli. **Ekipy i transmisje live to nadal dane z generatora**,
nawet gdy reszta strony chodzi na serwerze.

Zanim ktokolwiek obcy to zobaczy, te rzeczy muszą zniknąć albo zostać wyraźnie
oznaczone — razem ze zgodą na regulamin przy rejestracji i możliwością usunięcia
konta. Lista blokerów jest w `docs/TODO.md`.
