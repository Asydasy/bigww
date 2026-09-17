# Backend BigWW

Node + Fastify + PostgreSQL, zapytania przez Kysely. Sesje w ciasteczku
httpOnly, logowanie e-mailem z hasłem albo przez Discorda.

## Uruchomienie przez Dockera (zalecane)

```
cp server/.env.example server/.env      # i wpisz własny JWT_SECRET
docker compose up
docker compose exec api npm run migrate
docker compose exec api npm run seed
```

Serwer stoi na http://localhost:3000, baza na porcie 5432.
Sprawdzenie, czy żyje: http://localhost:3000/api/health

Własny `JWT_SECRET` wygenerujesz tak:
```
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Uruchomienie bez Dockera

Potrzebny Node 22+ i działający PostgreSQL 16.

```
cd server
npm install
cp .env.example .env     # popraw DATABASE_URL pod swoją bazę
npm run migrate
npm run seed
npm run dev
```

## Okładki gier

```
npm run covers            # pobiera brakujące
npm run covers -- --force # pobiera wszystko od nowa
```

Ściąga ze Steama listę gier, dopasowuje do niej nasze 205 tytułów po
znormalizowanej nazwie i pobiera poziomy nagłówek (460x215) do `img/games/`.
Zapisuje też `img/games/index.json` — front czyta ten jeden spis zamiast pytać
o każdy obrazek z osobna. Numery gier, których nie udało się dopasować, można
dopisać ręcznie w `RECZNE_NUMERY` w `src/covers.js`.

Skrypt nie dotyka bazy — czyta tylko `js/data-games.js`.

## Testy

```
cd server
cp .env.example .env.test    # w .env.test wskaż OSOBNĄ bazę, np. bigww_test
npm test
```

Testy czyszczą tabele `ads`, `users` i `saves` przed startem — dlatego mają iść
na osobną bazę, nie na tę, w której klikasz.

## Endpointy

Wszystko pod `/api`. Ciało i odpowiedzi w JSON-ie.

| metoda | ścieżka | kto może | co robi |
|---|---|---|---|
| GET | `/health` | każdy | sprawdza, czy serwer i baza odpowiadają |
| POST | `/auth/register` | każdy | zakłada konto (e-mail, hasło min. 8 znaków, nazwa) |
| POST | `/auth/login` | każdy | loguje i ustawia ciasteczko sesji |
| POST | `/auth/logout` | każdy | kasuje ciasteczko |
| GET | `/auth/me` | każdy | zwraca zalogowanego albo `null` |
| GET | `/auth/discord` | każdy | przekierowanie do logowania Discordem |
| GET | `/auth/discord/callback` | Discord | odbiera logowanie i wraca na front |
| GET | `/games` | każdy | katalog gier; `?q=`, `?genre=`, `?withCounts=true` |
| GET | `/games/genres` | każdy | lista gatunków |
| GET | `/ads` | każdy | lista ogłoszeń z filtrami i stronicowaniem |
| GET | `/ads/:id` | każdy | jedno ogłoszenie |
| GET | `/ads/mine` | zalogowany | moje ogłoszenia + limit konta |
| GET | `/ads/saved` | zalogowany | obserwowane ogłoszenia |
| POST | `/ads` | zalogowany | dodaje ogłoszenie (pilnuje limitu) |
| PATCH | `/ads/:id` | właściciel | zmienia tylko przysłane pola |
| DELETE | `/ads/:id` | właściciel | usuwa |
| POST | `/ads/:id/save` | zalogowany | obserwuje |
| DELETE | `/ads/:id/save` | zalogowany | przestaje obserwować |

Filtry listy ogłoszeń: `game`, `gameId`, `region`, `plat`, `style`, `time`,
`hourFrom` i `hourTo` (okno godzinowe), `mic`, `lookingNow`, `lang`, `tag`,
`newHours`, `q`, `page`, `perPage` (domyślnie 24, maks. 60).
Sortowanie: najpierw wypromowane, potem konta premium, potem „szukam teraz",
na końcu po dacie — tak samo jak we froncie.

## Decyzje warte zapamiętania

**Nazwy kolumn.** W bazie jest `time_of_day` i `descr`, bo `time` i `desc` to
słowa zastrzeżone w SQL. API zamienia je z powrotem na `time` i `desc`, żeby
front nie musiał nic zmieniać — robi to `src/shape.js`.

**Wyszukiwanie bez ogonków.** Funkcja `bigww_norm()` w bazie zdejmuje polskie
znaki i wielkość liter, a kolumna `ads.search_text` (pilnowana wyzwalaczem)
trzyma gotową do szukania treść z indeksem trigramowym. Dzięki temu „rankedow"
znajduje „rankedów", dokładnie jak `norm()` we froncie.

**Hasła.** scrypt z wbudowanego modułu `crypto` Node'a, bez zewnętrznej
biblioteki. Zapis: `scrypt$sól$hash`. Porównanie przez `timingSafeEqual`.

**Sesja.** JWT w ciasteczku `httpOnly` — JavaScript strony go nie odczyta, więc
udany XSS nie wynosi cudzej sesji. Ważność 30 dni.

**Handler błędów jest rejestrowany przed trasami.** Odwrotna kolejność sprawia,
że Fastify zostawia trasom domyślny handler, który wysyła klientowi wewnętrzny
komunikat błędu (np. nazwę brakującej funkcji w bazie). Nie przestawiać.

**Godziny grania.** Ogłoszenie ma `hour_from` i `hour_to` (0-23), zakres może
przechodzić przez północ. Nachodzenie liczy `bigww_hours_overlap()` — ta sama
logika co `hoursOverlap()` we froncie. Ogłoszenie bez godzin pasuje do każdego
filtru.

**Kontakt widzi każdy zalogowany.** Płatne odblokowywanie za monety wróci razem
z prawdziwą bramką płatniczą — do tego czasu blokowanie kontaktu za walutę,
której nie da się kupić, zamykałoby serwis w jego najważniejszym miejscu.

**Monety i premium są w bazie**, nie w przeglądarce. Front ma je tylko
wyświetlać. Portfel i płatności to jeszcze nie jest zrobione — kolumny są,
logiki wydawania nie ma.

## Czego tu jeszcze nie ma

- Portfela monet po stronie serwera (wydawanie, doładowania, historia).
- Odblokowywania kontaktu za monety.
- Ekip i transmisji live (są tylko we froncie, na danych demo).
- Wiadomości między użytkownikami.
- Prawdziwych płatności.
- Moderacji i zgłoszeń.
