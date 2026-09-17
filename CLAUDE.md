# Instrukcja dla Claude'a — projekt BigWW

Przeczytaj to na początku sesji, zanim cokolwiek zmienisz w kodzie.

## Co to jest

BigWW — serwis do szukania ludzi do wspólnego grania. Prototyp front-endowy
w jednym pliku `index.html` (3449 linii, HTML + CSS + waniliowy JS, zero
zależności). Stan trzymany w localStorage. Backendu nie ma.

Pełny obraz: `docs/STAN.md` (co działa, czego nie ma),
`docs/ARCHITEKTURA.md` (mapa kodu i numery linii),
`docs/DECYZJE.md` (dlaczego tak), `docs/TODO.md` (co dalej).

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

1. **Numery linii w `docs/ARCHITEKTURA.md` starzeją się natychmiast.** Po każdej
   większej zmianie w `index.html` odśwież tę tabelę — to jedyna nawigacja po
   pliku tej wielkości.
2. **Uważaj na nadpisania.** Funkcje `go`, `renderPlayers` i `submitAd` są
   zdefiniowane raz w swoich sekcjach i **podmieniane ponownie** w okolicach
   linii 3300-3350 przez warstwę monetyzacji. Edycja tej pierwszej wersji nic
   nie da.
3. **Dwa klucze localStorage są poza obiektem `KEY`**: `bigww_extra_slot`
   i `bigww_unlock_cred`. Dodając kasowanie danych albo migrację, obsłuż je.
4. **Nie dodawaj zależności zewnętrznych** (bibliotek, CDN-ów, obrazków) bez
   wyraźnej zgody — jednoplikowość i brak builda to świadoma decyzja.
5. **Nie zaciągaj fontów ani skryptów do nowych funkcji.** Grafika powstaje jako
   generowany SVG (patrz `avatarArt`, `coverArt`).
6. **Commituj po każdej skończonej zmianie**, z opisem po polsku mówiącym, co
   się zmieniło w zachowaniu, nie tylko w plikach.
7. **Aktualizuj `docs/STAN.md`** — sekcja „Co DZIAŁA” i „Czego NIE MA” to
   pierwsza rzecz, którą czyta następna sesja.

## Uwaga o środowisku

To repo powstaje w ulotnym kontenerze — po zakończeniu sesji znika. Na koniec
każdej sesji z istotnymi zmianami spakuj repo (`git bundle` + archiwum) i wyślij
użytkownikowi plik do pobrania albo wypchnij na jego remote, jeśli taki będzie.
Nie zakładaj, że katalog roboczy przetrwa do następnej rozmowy.
