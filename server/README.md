# Backend BigWW

Node + Fastify + PostgreSQL, zapytania przez Kysely. Sesje w ciasteczku
httpOnly, logowanie e-mailem z hasłem albo przez Discorda.

Front rozmawia z tym backendem przez warstwę `DATA` (`js/data-source.js`):
jeśli `/api/health` odpowiada, ogłoszenia, gry, konta i obserwowani idą z bazy;
jeśli nie — strona wraca na dane lokalne. Przez serwer idzie też czat ogólny.
Monety, premium, prywatna skrzynka, powiadomienia i giveawaye nie przechodzą
przez serwer (patrz „Czego tu jeszcze nie ma").

## Uruchomienie przez Dockera (zalecane)

```
docker compose up
```

To wszystko. Kontener sam robi `npm install`, migracje i seed, a potem stawia
serwer razem z plikami frontu na http://localhost:3000 (baza na 5432).
Sprawdzenie, czy żyje: http://localhost:3000/api/health

Bez pliku `server/.env` serwer wstaje na **kluczu testowym** i wypisuje o tym
ostrzeżenie. Do pracy na poważnie skopiuj wzór i wpisz własny klucz:

```
cp server/.env.example server/.env
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Przy `NODE_ENV=production` brak `JWT_SECRET` albo `DATABASE_URL` jest błędem
i serwer się nie podniesie — tak ma być.

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
Zapisuje też `img/games/index.js` — front wczytuje ten jeden spis zamiast pytać
o każdy obrazek z osobna. To plik JS, a nie JSON, bo przy otwarciu strony
z dysku przeglądarka blokuje `fetch()`, ale `<script src>` przepuszcza. Numery gier, których nie udało się dopasować, można
dopisać ręcznie w `RECZNE_NUMERY` w `src/covers.js`.

Skrypt nie dotyka bazy — czyta tylko `js/data-games.js`.

## Testy

```
cd server
cp .env.example .env.test    # w .env.test wskaż OSOBNĄ bazę, np. bigww_test
npm run migrate              # z DATABASE_URL wskazującym na bazę testową
npm test                     # 38 testów API
```

Testy czyszczą tabele `ads`, `users`, `saves` i `chat_messages` przed startem — dlatego mają iść
na osobną bazę, nie na tę, w której klikasz.

Do tego test przeklikujący front w obu trybach (serwerowym i lokalnym):

```
npm i -D playwright && npx playwright install chromium
npm run test:front           # wymaga działającego serwera
```

Sprawdza rejestrację i logowanie przez API, dodanie ogłoszenia z rangą,
przeżycie przeładowania, obserwowanie, ukryty kontakt u niezalogowanego, czat
ogólny (wysyłka, dotarcie do drugiej przeglądarki przez odpytywanie, kasowanie
własnej wiadomości, wstrzyknięcie `<img onerror>` jako tekst) oraz powrót na
dane lokalne po odcięciu `/api`. Dopisuje do bazy jedno konto, jedno ogłoszenie
i kilka wiadomości.

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
| — | — | — | (filtry niżej, razem z `rank` i `day`) |
| GET | `/ads/:id` | każdy | jedno ogłoszenie |
| GET | `/ads/mine` | zalogowany | moje ogłoszenia + limit konta |
| GET | `/ads/saved` | zalogowany | obserwowane ogłoszenia |
| POST | `/ads` | zalogowany | dodaje ogłoszenie (pilnuje limitu) |
| PATCH | `/ads/:id` | właściciel | zmienia tylko przysłane pola |
| DELETE | `/ads/:id` | właściciel | usuwa |
| POST | `/ads/:id/save` | zalogowany | obserwuje |
| DELETE | `/ads/:id/save` | zalogowany | przestaje obserwować |
| GET | `/chat` | każdy | czat ogólny: `?after=<ms>` daje tylko nowsze, `?limit=` (domyślnie 50, maks. 100) |
| POST | `/chat` | zalogowany | wysyła wiadomość (maks. 300 znaków, 20/min) |
| DELETE | `/chat/:id` | właściciel | kasuje treść własnej wiadomości |
| GET | `/presence` | każdy | ile kont było aktywnych w ostatnich 5 minutach |

Filtry listy ogłoszeń: `game`, `gameId`, `region`, `plat`, `style`, `time`,
`hourFrom` i `hourTo` (okno godzinowe), `mic`, `lookingNow`, `lang`, `tag`,
`rank` (`beginner`/`mid`/`high`/`pro`), `day` (`mon`…`sun`),
`newHours`, `q`, `page`, `perPage` (domyślnie 24, maks. 60).
Ogłoszenie bez zadeklarowanych dni pasuje do każdego filtru `day` — tak samo
jak ogłoszenie bez godzin pasuje do każdego okna godzinowego.
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

**Czat ogólny: czyta każdy, pisze zalogowany.** Jeden pokój dla całego serwisu
(`chat_messages`). Odpowiedź `GET /chat` niesie `serverTime` — front zapisuje
go sobie jako punkt odniesienia do kolejnego pytania, żeby nie zależeć od zegara
przeglądarki — oraz `canWrite`, czyli czy ta sesja może pisać. Nick jest
zapisywany razem z wiadomością, bo historia ma pokazywać, kto pisał wtedy;
zmiana nazwy konta nie przepisuje starych wpisów. Skasowana wiadomość zostaje
w tabeli z `deleted_at`, a jej treść nie wychodzi już z serwera — dzięki temu
odpytywanie po czasie się nie rozjeżdża. Ochrona przed spamem jest po stronie
serwera: 20 wiadomości na minutę z konta i odrzucenie tej samej treści
powtórzonej w ciągu 30 sekund (`429`).

**Licznik aktywnych mierzy co innego niż licznik na Starcie.** `GET /presence`
liczy konta z `last_seen_at` w ostatnich 5 minutach, czyli ile osób jest na
stronie. Licznik na stronie startowej liczy ogłoszenia z włączonym „szukam
teraz", czyli ilu ludzi szuka ekipy. Dwie różne liczby — w interfejsie mają
dwie różne nazwy („aktywnych" kontra „graczy online teraz"), żeby nikt ich nie
mylił. Ślad aktywności zapisuje `plugins/auth.js` przy żądaniu z ważną sesją,
najwyżej raz na minutę na konto; gości nie liczymy, bo bez konta nie ma czego.
Odpowiedź `GET /chat` niesie ten sam licznik, żeby panel czatu nie robił
drugiego zapytania o to samo.

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
- Prywatnych wiadomości 1:1 (czat ogólny działa, skrzynka z karty gracza nie).
- Moderacji czatu: kasowania cudzych wiadomości, wyciszeń, banów.
- Prawdziwych płatności.
- Moderacji i zgłoszeń.
