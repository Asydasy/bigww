# Instrukcja dla Claude'a — projekt BigWW

Przeczytaj to na początku sesji, zanim cokolwiek zmienisz w kodzie.

## Co to jest

BigWW — serwis do szukania ludzi do wspólnego grania. Dwie części:

**Front** (katalog główny): `index.html` + `css/style.css` + 17 plików w `js/`,
waniliowy JS, zero zależności, stan w localStorage, dane z generatora demo.

**Backend** (`server/`): Node + Fastify + PostgreSQL, zapytania przez Kysely,
logowanie e-mailem z hasłem i przez Discorda. `docker compose up`, `npm test`.

**Najważniejsze: te dwie części jeszcze ze sobą nie rozmawiają.** `js/api.js`
jest gotową warstwą, ale żaden widok z niej nie korzysta. Przepięcie widoków
to pierwszy punkt w `docs/TODO.md`.

Pełny obraz: `docs/STAN.md` (co działa, czego nie ma),
`docs/ARCHITEKTURA.md` (front), `server/README.md` (backend i endpointy),
`docs/DECYZJE.md` (dlaczego tak), `docs/TODO.md` (co dalej),
`CHANGELOG.md` (co się zmieniło).

## Podział ról

Użytkownik jest adminem serwisu i testuje (na co dzień tester manualny).
Ty piszesz kod — frontend i backend. Nie odsyłaj go do pisania kodu samemu.

## Jak pisać do użytkownika

- Po polsku.
- Konkretnie: konkretne zmiany, liczby, nazwy funkcji i numery linii zamiast
  opisów metody i planów ogólnych.
- Gdy coś rozpisujesz, rozpisz do końca — woli pełne rozpiski niż zasady ogólne.
- Bez zapisu matematycznego w dolarach (LaTeX) — nie wyświetla mu się poprawnie.

## Zasady pracy w tym repo

1. **Na koniec każdej sesji dopisz wpis do `CHANGELOG.md`** — najnowsze na
   górze, po polsku, mówiąc co zmieniło się w *zachowaniu*, a nie tylko w
   plikach. To wyraźna prośba użytkownika, nie opcja.
2. **Kolejność skryptów w `index.html` ma znaczenie.** Nie ma modułów ES,
   wszystko żyje w zasięgu globalnym. Nowy plik dopisz w odpowiednim miejscu
   listy (po tym, z czego korzysta, przed tym, co go używa), a `js/main.js`
   zostaw na końcu.
3. **Nie przywracaj nadpisywania funkcji.** `go`, `renderPlayers` i `submitAd`
   miały kiedyś podmieniane wersje; teraz monetyzacja wchodzi przez trzy zwykłe
   wywołania opisane w `docs/ARCHITEKTURA.md`. Nowe punkty wejścia rób tak samo.
4. **Dwa klucze localStorage są poza obiektem `KEY`**: `bigww_extra_slot`
   i `bigww_unlock_cred`. Dodając kasowanie danych albo migrację, obsłuż je.
5. **Nie dodawaj zależności zewnętrznych do frontu** (bibliotek, CDN-ów,
   obrazków) bez wyraźnej zgody — brak builda to świadoma decyzja. Grafika
   powstaje jako generowany SVG (patrz `avatarArt`, `coverArt`).
6. **Commituj po każdej skończonej zmianie**, z opisem po polsku mówiącym, co
   się zmieniło w zachowaniu, nie tylko w plikach.
7. **Aktualizuj `docs/STAN.md`** — sekcja „Co DZIAŁA” i „Czego NIE MA” to
   pierwsza rzecz, którą czyta następna sesja.
8. **Refaktor to refaktor.** Przy przenoszeniu kodu nie poprawiaj przy okazji
   zachowania, nawet gdy widzisz błąd — zapisz go w `docs/TODO.md` i napraw
   osobnym commitem. Użytkownik testuje ręcznie i musi wiedzieć, czego szukać.

## Zasady dla backendu

9. **Po każdej zmianie w `server/` puść `npm test`.** Testy idą na osobnej
   bazie z `.env.test` i wykryły już dwa realne błędy. Nowy endpoint = nowy test.
10. **Handler błędów w `src/server.js` musi być rejestrowany PRZED trasami.**
    Odwrotna kolejność zostawia trasom domyślny handler Fastify, który wysyła
    klientowi wewnętrzne komunikaty błędów. To nie jest kosmetyka.
11. **Zmiana schematu = nowy plik w `server/migrations/`**, nigdy edycja
    istniejącego (runner pamięta, co już poszło). Zaktualizuj też
    `server/src/db-schema.d.ts` — nie generuje się sam.
12. **Wszystko, co szuka po tekście, przepuszczaj przez `bigww_norm()`.**
    Front zdejmuje polskie znaki od zawsze; baza musi robić to samo, inaczej
    ten sam wpisany tekst daje inne wyniki w obu miejscach.
13. **Nie przenoś pieniędzy ani limitów do przeglądarki.** Monety, premium i
    limit ogłoszeń liczy serwer; front je tylko wyświetla.

## Uwaga o środowisku

To repo powstaje w ulotnym kontenerze — po zakończeniu sesji znika. Na koniec
każdej sesji z istotnymi zmianami spakuj repo (`git bundle` + archiwum) i wyślij
użytkownikowi plik do pobrania albo wypchnij na jego remote, jeśli taki będzie.
Nie zakładaj, że katalog roboczy przetrwa do następnej rozmowy.
