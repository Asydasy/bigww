# Instrukcja dla Claude'a — projekt BigWW

Przeczytaj to na początku sesji, zanim cokolwiek zmienisz w kodzie.

## Co to jest

BigWW — serwis do szukania ludzi do wspólnego grania. Dwie części:

**Front** (katalog główny): `index.html` + `css/style.css` + 24 pliki w `js/`,
waniliowy JS, zero zależności. Wersja w `js/boot.js` (`APP_VERSION`).

**Backend** (`server/`): Node + Fastify + PostgreSQL, zapytania przez Kysely,
logowanie e-mailem z hasłem i przez Discorda. `docker compose up`, `npm test`.

Front i backend są spięte przez warstwę `DATA` (`js/data-source.js`), która
przy starcie pyta `/api/health` i działa w trybie `api` albo `local`:

- **`api`** — ogłoszenia, gry, konta i obserwowani z bazy,
- **`local`** — generator demo i localStorage (strona otwarta z dysku).

Podział: **serwer trzyma ogłoszenia, gry, konta i obserwowanych**;
**przeglądarka trzyma monety, premium, skrzynkę, powiadomienia, giveawaye,
oceny, blokady i ustawienia** — tego backend jeszcze nie ma.

Uruchomienie całości: `docker compose up`, potem http://localhost:3000.
Nic więcej nie trzeba — migracje i seed lecą same.

Pracę we dwójkę opisuje `WSPOLPRACA.md` (gałęzie, podział plików, konflikty).

Pełny obraz: `docs/STAN.md` (co działa, czego nie ma, znane błędy),
`docs/ARCHITEKTURA.md` (front), `server/README.md` (backend i endpointy),
`docs/DECYZJE.md` (dlaczego tak), `docs/TODO.md` (co dalej),
`CHANGELOG.md` (co się zmieniło).

## Podział ról

Użytkownik jest adminem serwisu i testuje (na co dzień tester manualny).
Ty piszesz kod — frontend i backend. Nie odsyłaj go do pisania kodu samemu.

**Nad projektem pracują dwie osoby piszące kod.** Zanim ruszysz plik z listy
„wspólnych" w `WSPOLPRACA.md`, zapytaj, czy nie siedzi w nim druga osoba.
Trzymaj się obszaru, o który prosi użytkownik — dwie równoległe sesje potrafią
przepisać ten sam plik w dwie różne strony. **Zacznij sesję od `git pull`**:
repozytorium potrafi pójść do przodu między jedną rozmową a drugą.

## Jak pisać do użytkownika

- Po polsku.
- Konkretnie: konkretne zmiany, liczby, nazwy funkcji i numery linii zamiast
  opisów metody i planów ogólnych.
- Gdy coś rozpisujesz, rozpisz do końca — woli pełne rozpiski niż zasady ogólne.
- Bez zapisu matematycznego w dolarach (LaTeX) — nie wyświetla mu się poprawnie.

## Zasady pracy w tym repo

1. **Na koniec każdej sesji dopisz wpis do `CHANGELOG.md`** — najnowsze na
   górze, po polsku, mówiąc co zmieniło się w *zachowaniu*, a nie tylko
   w plikach. To wyraźna prośba użytkownika, nie opcja.
2. **Kolejność skryptów w `index.html` ma znaczenie.** Nie ma modułów ES,
   wszystko żyje w zasięgu globalnym. Nowy plik dopisz w odpowiednim miejscu
   listy: `util.js` przed `data-demo.js`, `i18n.js` przed `state.js`,
   `api.js` przed `data-source.js`, `monetization.js` po widokach,
   `main.js` przedostatni, `boot.js` ostatni.
3. **Nie dokładaj kolejnych opakowań funkcji.** Koniec `monetization.js`
   podmienia `go`, `renderPlayers` i `submitAd` (wzorzec wrócił razem ze
   scaleniem frontu). Nowe punkty wejścia rób zwykłym wywołaniem na końcu
   funkcji. Gdy będziesz przepisywać monetyzację — usuń te trzy podmiany.
4. **Klucze localStorage poza obiektem `KEY`**: `bigww_extra_slot`,
   `bigww_unlock_cred`, `bigww_gw_entries`, `bigww_gw_day`, `bigww_cookie_v1`,
   `bigww_migrated_v3`, `bigww_users_v2`, `bigww_session_v2`. Dodając kasowanie
   danych albo migrację, obsłuż je osobno. Reszta idzie przez `resolveKey()`
   i ma przyrostek konta.
5. **Nie dodawaj zależności zewnętrznych do frontu** (bibliotek, CDN-ów,
   obrazków) bez wyraźnej zgody — brak builda to świadoma decyzja. Grafika
   powstaje jako generowany SVG (`avatarArt`, `coverArt`), okładki pobiera się
   raz na dysk skryptem.
6. **Commituj po każdej skończonej zmianie**, z opisem po polsku mówiącym, co
   się zmieniło w zachowaniu, nie tylko w plikach.
7. **Aktualizuj `docs/STAN.md`** — sekcje „Co DZIAŁA", „Czego NIE MA" i „Znane
   błędy" to pierwsza rzecz, którą czyta następna sesja.
8. **Refaktor to refaktor.** Przy przenoszeniu kodu nie poprawiaj przy okazji
   zachowania, nawet gdy widzisz błąd — zapisz go w `docs/TODO.md` i napraw
   osobnym commitem. Użytkownik testuje ręcznie i musi wiedzieć, czego szukać.

## Zasady dla warstwy DATA

9. **Każdy zapis idzie przez `DATA`**, nigdy prosto do `MINE`, `SAVED` ani do
   `API`: `DATA.createAd`, `updateAd`, `deleteAd`, `toggleSave`,
   `setLookingNow`, `login`, `register`, `logout`. Zapis wprost do tablicy
   działa tylko w jednym trybie i po odświeżeniu znika.
10. **Czytanie idzie przez `allPlayers()`, `MINE` i `SAVED`.** W trybie
    serwerowym wypełnia je `DATA`, więc filtry i karty nie muszą nic wiedzieć
    o źródle danych.
11. **Każda nowa metoda w `DATA` ma obie ścieżki** — serwerową i lokalną.
    Jeśli czegoś nie da się zrobić bez backendu, niech ścieżka lokalna rzuci
    błąd ze `status: 401` albo `403`, a widok to obsłuży.
12. **Po zmianach we froncie przeklikaj oba tryby.** Najszybciej:
    `cd server && npm run test:front` (wymaga działającego serwera
    i Playwrighta — `npm i -D playwright && npx playwright install chromium`).
    Test sprawdza rejestrację, dodanie ogłoszenia, przeżycie przeładowania,
    ukryty kontakt u gościa i powrót na dane lokalne po odcięciu API.
13. **Nie licz na `fileData` w trybie serwerowym.** Pliki z dysku zostają
    w przeglądarce autora — serwer ich nie przyjmuje.

## Zasady dla backendu

14. **Po każdej zmianie w `server/` puść `npm test`.** Testy idą na osobnej
    bazie z `.env.test` i wykryły już trzy realne błędy. Nowy endpoint = nowy
    test.
15. **Handler błędów w `src/server.js` musi być rejestrowany PRZED trasami.**
    Odwrotna kolejność zostawia trasom domyślny handler Fastify, który wysyła
    klientowi wewnętrzne komunikaty błędów. To nie jest kosmetyka.
16. **Zmiana schematu = nowy plik w `server/migrations/`**, nigdy edycja
    istniejącego (runner pamięta, co już poszło). Zaktualizuj też
    `server/src/db-schema.d.ts` — nie generuje się sam. Po dodaniu migracji
    puść `npm run migrate` na obu bazach: roboczej i testowej. Brakująca
    kolumna potrafi dać mylący błąd (`rank` bez kolumny to dla Postgresa
    funkcja okienkowa).
17. **Wszystko, co szuka po tekście, przepuszczaj przez `bigww_norm()`.**
    Front zdejmuje polskie znaki od zawsze; baza musi robić to samo.
18. **Nie przenoś pieniędzy ani limitów do przeglądarki.** Limit ogłoszeń liczy
    serwer (`adLimitFor()` w `src/config.js`) i te same liczby są w `adLimit()`
    w `js/state.js` — zmieniasz jedno, zmień drugie.
19. **Serwer ma wstawać bez `.env` poza produkcją.** Nie dokładaj nowych
    wymaganych zmiennych bez wartości domyślnej — inaczej „git clone &&
    docker compose up" przestanie działać.

## Uwaga o środowisku

To repo powstaje w ulotnym kontenerze — po zakończeniu sesji znika. Claude nie
ma prawa zapisu do repozytorium na GitHubie: na koniec sesji z istotnymi
zmianami spakuj je (`git bundle create bigww.bundle main` albo archiwum) i wyślij
użytkownikowi plik do pobrania. Kto dostaje paczkę, ten ją od razu wciąga
i wypycha — inaczej druga osoba pracuje na starym kodzie.
