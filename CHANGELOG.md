# Changelog

Format: najnowsze na górze. Każdy wpis mówi, co zmieniło się w **zachowaniu**,
a nie tylko w plikach.

## [0.2.0] — 2026-09-17

### Zmienione
- **Rozdzielony jeden plik `index.html` (3449 linii) na strukturę katalogów.**
  CSS poszedł do `css/style.css`, JavaScript do 16 plików w `js/` podzielonych
  wg odpowiedzialności. `index.html` to teraz sam markup (436 linii) plus lista
  skryptów. Zachowanie aplikacji bez zmian — to czysta reorganizacja.
- **Usunięte nadpisywanie funkcji.** `go`, `renderPlayers` i `submitAd` były
  definiowane, a potem podmieniane przez warstwę monetyzacji. Teraz logika jest
  wpięta wprost w oryginały: `go()` woła `maybeShowInterstitial()`,
  `renderPlayers()` woła `addSponsoredSlot()`, `submitAd()` woła
  `progressQuest("post")`.

### Naprawione
- Liczba gier w bazie to 205, nie 204 — poprawione w dokumentacji.

### Sprawdzone
- Smoke test w headless Chromium: wszystkie 11 widoków renderuje się bez błędów
  w konsoli, wyszukiwarka zwraca 12 wyników dla „valorant", dodanie ogłoszenia
  trafia do `MINE` i na listę.

### Uwaga
- Ładowanie fontów z Google Fonts to jedyna zewnętrzna zależność. Bez internetu
  strona działa na fontach systemowych.

## [0.1.0] — 2026-09-17

### Dodane
- Prototyp BigWW w jednym pliku HTML: 11 widoków, 205 gier, generator 720
  graczy / 80 ekip / 36 transmisji, filtry i wyszukiwarka, formularz ogłoszenia
  z podglądem, motyw ciemny i jasny.
- Warstwa monetyzacji: premium (4 plany), monety WW, sklep, reklamy z nagrodą,
  dzienne zadania, battle pass, program polecający.
- Repozytorium git z notatkami: `README.md`, `CLAUDE.md`, `docs/STAN.md`,
  `docs/ARCHITEKTURA.md`, `docs/DECYZJE.md`, `docs/TODO.md`.
