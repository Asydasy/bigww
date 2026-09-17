# Kolejne kroki

Uporządkowane od rzeczy, które da się zrobić w jednej sesji, do tych, które są
osobnym etapem projektu.

## 0. Zrobione

- [x] Rozdzielić `index.html` na `css/style.css` i pliki w `js/`.
- [x] Backend: konta, sesje, katalog gier, CRUD ogłoszeń z filtrami, limitami
      i obserwowaniem, migracje, seed, `docker-compose.yml`.
- [x] Warstwa `DATA` z trybem serwerowym i lokalnym — **przywrócona po tym, jak
      scalenie równoległej wersji frontu (commit `c247099`) zostawiło z niej
      dwulinijkowe zaślepki.**
- [x] `docker compose up` stawia całość zaraz po sklonowaniu repozytorium:
      migracje i seed lecą same, front i API siedzą pod jednym adresem.
- [x] Ranga i dni tygodnia w bazie (migracja `004`) razem z filtrami `?rank=`
      i `?day=`.
- [x] Konta przez serwer w trybie API (e-mail z hasłem, Discord OAuth), konta
      lokalne tylko dla trybu bez backendu.
- [x] „Szukam teraz” zapisywane w bazie, nie tylko w przeglądarce.
- [x] Test przeklikujący front w obu trybach jako część repo
      (`server/test/front.e2e.mjs`, `npm run test:front`).
- [x] „Usuń wszystkie dane” kasuje też skrzynkę, powiadomienia, blokady,
      zgłoszenia, oceny, zestawy filtrów i udziały w giveawayach.
- [x] Regulamin i polityka prywatności jako widok w serwisie.
- [x] Rzeczy konta przeniesione z menu bocznego do rozwijanego menu pod awatarem.
- [x] **Czat ogólny na serwerze** — jeden pokój, panel w menu bocznym, historia
      w bazie (migracja `005`), odpytywanie co 5 s, limity i kasowanie własnych
      wiadomości.

## 1. Poprawki, każda na jedną sesję

- [ ] **Obsłużyć przepełnienie localStorage.** `rawSave()` w `js/state.js` łyka
      błąd po cichu (`catch (e) {}`). Ma pokazywać toast „Brak miejsca — usuń
      stare ogłoszenie albo plik” i nie udawać, że zapisał.
- [ ] **Ograniczyć wielkość wrzucanego pliku** (np. 2 MB) i skalować obrazy
      przed zapisem jako data URL.
- [ ] **Naprawić sprzeczność w liczbie darmowych wiadomości**: `FREE_MSG_LIMIT`
      to 10, a plan Darmowy w `js/view-premium.js` obiecuje 5.
- [ ] **Dopisać `inboxUnreadCount()`** albo wyciąć wywołanie z `updateBadges()`
      (`js/monetization.js`, linia 514) — dziś odznaka pokazuje liczbę wątków,
      nie nieprzeczytanych.
- [ ] **Walidacja formularza ogłoszenia** po stronie frontu — serwer sprawdza
      swoje, ale użytkownik powinien wiedzieć przed wysłaniem.
- [ ] **Usunąć opakowania funkcji z `monetization.js`** (`go`, `renderPlayers`,
      `submitAd`) i zastąpić je zwykłymi wywołaniami.

## 2. Dokończyć spinanie z backendem

- [ ] **Filtrowanie po stronie serwera.** Dziś front ściąga do 480 ogłoszeń
      (`MAX_ADS` w `js/data-source.js`) i filtruje u siebie. Endpoint ma już
      komplet filtrów — trzeba przepiąć `renderPlayers()` na zapytania
      i zrobić go asynchronicznym. Zrobić to, zanim ogłoszeń będzie więcej
      niż jedno pobranie.
- [ ] **Ekipy i transmisje w bazie** — jedyne części, które zostały na danych
      demo także w trybie serwerowym. Nowa migracja, `server/src/routes/teams.js`,
      przepięcie `js/view-teams-live.js` na `DATA`.
- [ ] **Pliki z ogłoszeń na serwerze.** Dziś data URL zostaje w przeglądarce
      autora, więc nikt inny go nie zobaczy. Do decyzji: upload do katalogu czy
      tylko odsyłacze do klipów.
- [ ] **Odświeżanie trybu bez przeładowania strony.** Uruchomienie backendu przy
      otwartej stronie wymaga dziś odświeżenia.
- [ ] **Usunąć martwy kod kont lokalnych z trybu serwerowego** albo wyraźnie go
      oznaczyć: udawana weryfikacja e-maila, SMS i „Google” działają tylko bez
      backendu, a kod siedzi w tym samym pliku.

## 2b. Czat — czego mu brakuje

- [ ] **Moderacja czatu.** Dziś każdy zalogowany pisze do wszystkich i nikt nie
      może tego zatrzymać. Minimum: rola admina, kasowanie cudzej wiadomości,
      wyciszenie konta na czas. To jest pierwsza rzecz do zrobienia, gdy wejdą
      obcy ludzie — nie po pierwszym trollu.
- [ ] **Blokada w czacie działająca razem z `bigww_blocked_v2`** — dziś blokada
      gracza chowa jego ogłoszenia, ale nie jego wiadomości na czacie.
- [ ] **WebSocket zamiast odpytywania** — dopiero gdy będzie ruch, który to
      uzasadni. Przy kilku osobach zapytanie co 5 s jest tańsze niż utrzymywanie
      połączeń.
- [x] **Kto jest online** — licznik „N aktywnych" przy nagłówku czatu, liczony
      z `users.last_seen_at` (okno 5 minut). Nazwany inaczej niż licznik na
      Starcie, bo mierzy co innego.
- [ ] **Pokazać aktywność na karcie gracza** — „widziany 5 min temu" obok
      nicku, z tej samej kolumny `last_seen_at`.
- [ ] **Pokoje tematyczne albo per gra**, jeśli jeden pokój zrobi się za głośny.

## 3. Backend — drugi etap

- [ ] **Portfel monet po stronie serwera**: wydawanie, doładowania, historia
      operacji. Dopóki saldo siedzi w przeglądarce, monety nie znaczą nic —
      każdy wpisze sobie dowolny balans w konsoli.
- [ ] **Premium w bazie** i sprawdzanie go po stronie serwera (limit ogłoszeń
      już tam jest, reszta nie).
- [ ] **Odblokowywanie kontaktu za monety** — tabela `unlocks` i sprawdzanie
      w `publicAd()`. Dziś kontakt widzi każdy zalogowany.
- [ ] **Prywatne wiadomości 1:1 na serwerze.** Czat ogólny już działa, ale
      skrzynka z karty gracza dalej zapisuje się tylko u nadawcy — to jedyna
      funkcja, która wprost kłamie użytkownikowi. Można ją oprzeć na tej samej
      tabeli co czat (kolumna `to_user_id`) albo zrobić osobną.
- [ ] **Moderacja**: zgłoszenia i blokady w bazie, kolejka do przejrzenia.
      Dziś zapisują się u zgłaszającego, więc nikt ich nie widzi.
- [ ] **Giveawaye w bazie**, jeśli mają być prawdziwe — losowanie po stronie
      serwera, inaczej to tylko ozdoba.
- [ ] **Hosting** i domena.

## 4. Testy (naturalny wkład użytkownika — tester manualny)

- [ ] Spisać scenariusze testowe dla przepływów: rejestracja, logowanie,
      onboarding, dodanie ogłoszenia, filtrowanie, zakup premium, wydanie
      monet, dzienny reset zadań — osobno dla trybu serwerowego i lokalnego.
- [ ] Sprawdzić zachowanie przy wyczyszczonym localStorage i przy pełnym.
- [ ] Sprawdzić motyw jasny na wszystkich 15 widokach — to najczęstsze miejsce
      na przeoczone kolory.
- [ ] Rozszerzyć `server/test/front.e2e.mjs` o edycję ogłoszenia, limit kont
      darmowych i przełączanie języka.
- [ ] Zdecydować, czy błędy prowadzić w Redmine (jak w pracy), czy w issues
      repozytorium.

## 5. Zanim wpuścimy prawdziwych ludzi

- [x] Regulamin i polityka prywatności — dokumenty są w serwisie.
- [ ] **Przejrzenie dokumentów przez prawnika** — są wzorcowe, nie są poradą.
- [ ] **Zgoda na regulamin przy rejestracji** (checkbox plus zapis daty zgody
      w bazie).
- [ ] **Usuwanie konta** — `DELETE /api/auth/me` plus przycisk w ustawieniach.
      Prawo do bycia zapomnianym nie jest opcjonalne.
- [ ] Minimalny wiek i jego weryfikacja — ogłoszenia dopuszczają od 13 lat,
      co przy serwisie kojarzącym ludzi wymaga przemyślenia.
- [ ] Prawdziwa bramka płatnicza (Przelewy24 / Stripe) i obsługa zwrotów.
- [ ] `JWT_SECRET` inny niż testowy, hasło do bazy inne niż `bigww`, HTTPS,
      `secure` na ciasteczku (kod robi to przy `NODE_ENV=production`).
      Serwer wypisuje ostrzeżenie, gdy chodzi na kluczu testowym — na produkcji
      brak klucza jest błędem i serwer nie wstanie.
- [ ] Problem pustego serwisu: skąd pierwszych stu użytkowników. Bez tego
      reszta nie ma znaczenia.
