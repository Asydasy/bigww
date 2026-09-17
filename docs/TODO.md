# Kolejne kroki

Uporządkowane od rzeczy, które da się zrobić w jednej sesji, do tych, które są
osobnym etapem projektu.

## 0. Zrobione

- [x] Rozdzielić `index.html` na `css/style.css` i pliki w `js/`.
- [x] Usunąć nadpisywanie funkcji `go`, `renderPlayers`, `submitAd`.
- [x] Wybrać stos backendu i sposób logowania.
- [x] Postawić backend: konta, sesje, katalog gier, CRUD ogłoszeń z filtrami,
      limitami i obserwowaniem. 24 testy przechodzą.
- [x] `docker-compose.yml`, migracje z runnerem, seed gier z `js/data-games.js`.
- [x] `js/api.js` i `js/data-source.js` — warstwa `DATA` z trybem serwerowym
      i demo; widoki graczy, ogłoszeń, moich ogłoszeń, obserwowanych i bazy gier
      przepięte na nią.
- [x] Ekran logowania i rejestracji plus panel konta w menu bocznym.
- [x] Scalenie równoległej pracy: godziny grania od–do, edycja ogłoszenia,
      siatka/lista, chipy filtrów, eksport i import danych.
- [x] Wycięcie udawanych funkcji w trybie serwerowym.

## 1. Dokończyć spinanie frontu z backendem

- [ ] **Przełącznik „szukam teraz" na serwerze.** Dziś ustawia się tylko przy
      dodawaniu ogłoszenia (`lookingNow`), a przycisk w interfejsie zmienia
      wyłącznie `PREF.looking` w przeglądarce.
- [ ] **Ekipy i transmisje w bazie** — jako jedyne zostały na danych demo nawet
      w trybie serwerowym.
- [ ] **Odświeżanie trybu bez przeładowania strony.** Teraz uruchomienie
      backendu przy otwartej stronie wymaga odświeżenia.
- [ ] **Test przeklikujący front jako część repo.** Sprawdzał oba tryby i
      wyłapał dwa błędy, ale mieszka w katalogu tymczasowym.

## 1b. Zaległości po scaleniu

- [ ] **Ekipy w bazie** — dziś pokazują „wkrótce" w trybie serwerowym.
- [ ] **Transmisje live** — to samo.
- [ ] **Portfel monet na serwerze**, a po nim przywrócenie Sklepu i Premium
      (razem z prawdziwą bramką płatniczą — bez niej zostają schowane).

## 1c. Do rozstrzygnięcia

- [ ] **Wielojęzyczność PL/EN.** Gotowe tłumaczenia (~156 kluczy) są w
      równoległej wersji frontu. Jeśli wchodzimy, to atrybutami `data-i18n`
      w markupie, a nie jedną funkcją przepisującą interfejs.

## 2. Poprawki w prototypie (po jednej sesji każda)

- [ ] **Obsłużyć przepełnienie localStorage.** `save()` w `js/state.js` łyka
      błąd po cichu. Ma pokazywać toast „Brak miejsca — usuń stare ogłoszenie
      albo plik" i nie udawać, że zapisał.
- [ ] **Ograniczyć wielkość wrzucanego pliku** (np. 2 MB) i skalować obrazy
      przed zapisem jako data URL.
- [ ] **Walidacja formularza ogłoszenia** po stronie frontu — serwer już to
      sprawdza, ale użytkownik powinien wiedzieć przed wysłaniem.
- [ ] **Zgłoś / zablokuj** na karcie gracza.
- [ ] Zaktualizować `docs/ARCHITEKTURA.md` i `CHANGELOG.md` po tych zmianach.

## 3. Testy (naturalny wkład użytkownika — tester manualny)

- [ ] Spisać scenariusze testowe dla przepływów: rejestracja, logowanie,
      onboarding, dodanie ogłoszenia, filtrowanie, zakup premium, wydanie
      monet, dzienny reset zadań.
- [ ] Sprawdzić zachowanie przy wyczyszczonym localStorage i przy pełnym.
- [ ] Sprawdzić motyw jasny na wszystkich 11 widokach — to najczęstsze miejsce
      na przeoczone kolory.
- [ ] Zdecydować, czy błędy prowadzić w Redmine (jak w pracy), czy w issues
      repozytorium.

## 4. Backend — drugi etap

- [ ] **Portfel monet po stronie serwera**: wydawanie, doładowania, historia
      operacji. Dopóki saldo siedzi w przeglądarce, monety nie znaczą nic.
- [ ] **Odblokowywanie kontaktu za monety** — tabela `unlocks` i sprawdzanie
      w `publicAd()`. Dziś kontakt widzi właściciel i premium.
- [ ] **Ekipy i transmisje w bazie** — teraz istnieją tylko we froncie.
- [ ] **Wiadomości między użytkownikami.** Do przemyślenia razem z decyzją,
      czy w ogóle chcemy je u siebie, czy zostajemy przy pokazywaniu Discorda.
- [ ] **Model kontaktu** — decyzja wciąż otwarta.
- [ ] **Hosting** i domena.

## 5. Zanim wpuścimy prawdziwych ludzi

- [x] Regulamin i polityka prywatności — dokumenty są w serwisie.
- [ ] **Przejrzenie dokumentów przez prawnika** — są wzorcowe, nie są poradą.
- [ ] **Zgoda na regulamin przy rejestracji** (checkbox plus zapis daty zgody
      w bazie).
- [ ] **Usuwanie konta** — `DELETE /api/auth/me` plus przycisk w ustawieniach.
      Prawo do bycia zapomnianym nie jest opcjonalne.
- [ ] Minimalny wiek i jego weryfikacja — ogłoszenia dopuszczają od 13 lat,
      co przy serwisie kojarzącym ludzi wymaga przemyślenia.
- [ ] Moderacja: zgłoszenia, blokowanie, kolejka do przejrzenia.
- [ ] Prawdziwa bramka płatnicza (Przelewy24 / Stripe) i obsługa zwrotów.
- [ ] `JWT_SECRET` i hasło do bazy inne niż przykładowe, HTTPS, `secure` na
      ciasteczku (kod już to robi przy `NODE_ENV=production`).
- [ ] Problem pustego serwisu: skąd pierwszych stu użytkowników. Bez tego
      reszta nie ma znaczenia.
