# Kolejne kroki

Uporządkowane od rzeczy, które da się zrobić w jednej sesji, do tych, które są
osobnym etapem projektu.

## 1. Poprawki w prototypie (po jednej sesji każda)

- [ ] **Obsłużyć przepełnienie localStorage.** `save()` w linii 1339 łyka błąd
      po cichu. Ma pokazywać toast „Brak miejsca — usuń stare ogłoszenie albo
      plik” i nie udawać, że zapisał.
- [ ] **Ograniczyć wielkość wrzucanego pliku** (np. 2 MB) i skalować obrazy
      przed zapisem jako data URL.
- [ ] **Walidacja formularza ogłoszenia**: nick niepusty, gra wybrana, wiek
      13-80, kontakt w rozpoznawalnym formacie. Teraz da się opublikować pustkę.
- [ ] **Edycja własnego ogłoszenia.** Jest usuwanie i promowanie, nie ma zmiany
      treści — trzeba skasować i dodać od nowa.
- [ ] **Zgłoś / zablokuj** na karcie gracza — nawet jako atrapa, żeby przepływ
      moderacji był widoczny w demo.
- [ ] Odświeżyć numery linii w `docs/ARCHITEKTURA.md` po tych zmianach.

## 2. Testy (naturalny wkład użytkownika — tester manualny)

- [ ] Spisać scenariusze testowe dla przepływów: onboarding, dodanie ogłoszenia,
      filtrowanie, zakup premium, wydanie monet, dzienny reset zadań.
- [ ] Sprawdzić zachowanie przy wyczyszczonym localStorage i przy pełnym.
- [ ] Sprawdzić motyw jasny na wszystkich 11 widokach — to najczęstsze miejsce
      na przeoczone kolory.
- [ ] Zdecydować, czy błędy prowadzić w Redmine (jak w pracy), czy w issues
      repozytorium.

## 3. Decyzje do podjęcia przed backendem

- [ ] **Stos technologiczny.** Propozycja: Node + Fastify/Express + PostgreSQL,
      bo jest najbliżej tego, co już jest w JS. Alternatywa z gotowym logowaniem
      i bazą: Supabase — mniej kodu na start, mniej kontroli później.
- [ ] **Logowanie**: e-mail + hasło czy od razu Discord OAuth? Discord jest
      naturalny dla graczy i daje gotowy kontakt, ale wiąże projekt z jedną
      platformą.
- [ ] **Model kontaktu.** Czy pokazujemy cudzy Discord (jak teraz), czy budujemy
      wewnętrzne wiadomości? Wewnętrzne = więcej pracy, ale to jedyne miejsce,
      gdzie monetyzacja wiadomości ma sens i gdzie da się moderować.
- [ ] **Hosting** i domena.

## 4. Backend — pierwszy etap

- [ ] Schemat bazy: `users`, `ads` (ogłoszenia), `games`, `teams`, `saves`,
      `messages`, `payments`, `coins_ledger`.
- [ ] Rejestracja, logowanie, sesja.
- [ ] CRUD ogłoszeń z prawdziwym limitem na konto.
- [ ] Endpoint listy graczy z filtrami i paginacją po stronie serwera
      (teraz cała lista jest w pamięci przeglądarki).
- [ ] Przepięcie frontu z localStorage na API — widok po widoku, zaczynając od
      graczy i ogłoszeń.

## 5. Zanim wpuścimy prawdziwych ludzi

- [ ] Regulamin i polityka prywatności, zgoda na przetwarzanie danych.
- [ ] Minimalny wiek i jego weryfikacja — w ogłoszeniach jest pole od 13 lat,
      co przy serwisie kojarzącym ludzi wymaga przemyślenia.
- [ ] Moderacja: zgłoszenia, blokowanie, kolejka do przejrzenia.
- [ ] Prawdziwa bramka płatnicza (Przelewy24 / Stripe) i obsługa zwrotów.
- [ ] Problem pustego serwisu: skąd pierwszych stu użytkowników. Bez tego
      reszta nie ma znaczenia.
