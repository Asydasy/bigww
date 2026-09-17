# Stan projektu — 2026-09-17

## Krótko

**Front i backend są spięte.** Ta sama strona działa w dwóch trybach,
rozpoznawanych przy starcie:

- **serwer** — backend odpowiada: ogłoszenia z bazy, konta, logowanie,
  filtrowanie i wyszukiwanie po stronie PostgreSQL. W stopce menu widać
  zielone „● serwer".
- **demo** — backendu nie ma: dane z generatora i localStorage, jak w
  pierwotnym prototypie. `index.html` otwarty z dysku dalej pokazuje pełną
  aplikację. W stopce widać żółte „● demo".

Widoki nie wiedzą, który tryb jest aktywny — pytają warstwę `DATA`
(`js/data-source.js`), a ona decyduje, skąd wziąć dane.

**Front**: `index.html` + `css/style.css` + 19 plików w `js/`, waniliowy
JavaScript, zero zależności.
**Backend**: `server/`, Node + Fastify + PostgreSQL, zapytania przez Kysely,
25 przechodzących testów. Stawia się przez `docker compose up`.

**Uwaga:** Premium, Sklep, monety, Ekipy i transmisje działają w obu trybach, ale
są demonstracyjne — płatności nic nie pobierają, a ekipy i streamy pochodzą
z generatora. Przy płatnościach jest o tym informacja w interfejsie.

## Co DZIAŁA

**Gość kontra zalogowany (tylko w trybie serwerowym)**
Niezalogowany widzi Start, Szukaj graczy, Bazę gier, Ekipy, Live i Ustawienia.
Dodaj ogłoszenie, Moje ogłoszenia, Obserwowani, Premium, Sklep i saldo monet WW
pojawiają się po zalogowaniu. Próba wejścia na zablokowany widok otwiera okno
logowania. W trybie demo wszystko jest widoczne, bo kont tam nie ma.

**Nawigacja i widoki (11 ekranów)**
Start, Gracze, Gry, Ekipy, Live, Dodaj ogłoszenie, Moje ogłoszenia, Obserwowani,
Premium, Sklep, Ustawienia. Sidebar na desktopie, dolny pasek na telefonie,
skrót `/` ustawia kursor w wyszukiwarce graczy.

**Dane demo (generowane przy każdym załadowaniu, deterministycznie z seeda)**
- 205 gier z gatunkiem, trybem, platformami i popularnością 1-5
- 720 wygenerowanych graczy (nick, wiek, region, gra, platforma, styl, pora
  grania, mikrofon, język, godziny, ocena, tagi, opis)
- 80 ekip z liczbą wolnych miejsc
- 36 transmisji „live"
- awatary i okładki gier rysowane jako SVG z hasza nicku/nazwy — brak plików
  graficznych w repo, nic się nie ściąga z sieci

**Ogłoszenia**
Formularz z podglądem na żywo, limit 320 znaków w opisie, do 4 tagów, klip z
YouTube/Twitch/Medal (parsowany na embed) albo plik z dysku (zostaje jako
data URL w localStorage). Własne ogłoszenia lądują na górze listy graczy.

**Filtry i wyszukiwarka**
Filtrowanie po grze, regionie, platformie, stylu, **godzinach grania od–do**
(z obsługą zakresów przez północ) i mikrofonie. Aktywne filtry pokazują się jako
chipy z krzyżykiem. Nad wynikami przełącznik siatka / lista, zapamiętywany.
Wyszukiwarka tokenowa z AND i scoringiem trafności, ignoruje polskie znaki
diakrytyczne. Filtry zapisują się w localStorage. Paginacja po 24 wyniki.

**Tryb „Szukam teraz"**
Przełącznik, który podbija własne karty przy sortowaniu po aktywności; pasek
statusu na Starcie i na liście graczy.

**Monetyzacja (cała udawana, bez bramki płatniczej)**
- Plany: Darmowy 0 zł, Premium 19,99 zł/mies., Pro/Clan 39,99 zł/mies.,
  Premium na rok 149 zł. Limit ogłoszeń: 3 free (4 z dokupionym slotem),
  10 premium, 20 pro.
- Monety WW: start 40. Odblokowanie kontaktu 15 WW (3 darmowe dziennie),
  wiadomość 6 WW, bilet na jednego streama 35 WW, przepustka na live 80 WW.
- Sklep: boost 6 h 25 WW, boost 24 h 60 WW, dodatkowy slot na 7 dni 80 WW,
  nowy awatar 10 WW, pakiet 5 kontaktów 70 WW.
- Pakiety monet za złotówki: 100 za 9,99 zł; 500+100 bonus za 39,99 zł;
  1500+500 za 99 zł; starter 200+50 z premium na 3 dni za 14,99 zł.
- Reklamy z nagrodą, dzienne zadania (2 reklamy → 10 WW, wiadomość → 8 WW,
  boost → 15 WW, ogłoszenie → 12 WW), battle pass 10 poziomów po 100 XP,
  program polecający z kodem BIG-XXXX, interstitial co kilka przejść nawigacji.
- Darmowe wiadomości: 10 dziennie, potem za monety albo premium.

**Regulamin i polityka prywatności**
Dostępne z odsyłaczy w stopce menu, także dla niezalogowanych. Dokumenty
wzorcowe pod prawo polskie — wymagają przejrzenia przez prawnika.

**Ustawienia**
Motyw ciemny/jasny (zapisywany), region domyślny, zmiana awatara, kasowanie
wszystkich danych lokalnych.

## Co DZIAŁA po stronie serwera

Szczegóły i lista endpointów: `server/README.md`.

- Konta: rejestracja e-mailem z hasłem (scrypt), logowanie, wylogowanie,
  sesja w ciasteczku httpOnly ważna 30 dni.
- Logowanie przez Discorda — gotowe, wymaga tylko wpisania `DISCORD_CLIENT_ID`
  i `DISCORD_CLIENT_SECRET` w `server/.env`. Konto z tym samym potwierdzonym
  adresem jest dopinane do istniejącego, a nie dublowane.
- Katalog 205 gier w bazie, wypełniany seedem z `js/data-games.js`.
- Ogłoszenia: dodawanie, edycja, usuwanie, obserwowanie, lista z filtrami
  (gra, region, platforma, styl, godziny od–do, mikrofon, „szukam teraz"),
  wyszukiwarką odporną na polskie znaki i stronicowaniem.
- Limit ogłoszeń na konto liczony po stronie serwera: 3 / 10 / 20.
- Kontakt widzi każdy zalogowany; niezalogowany dostaje `contactLocked`.
- Filtr godzin liczony przez `bigww_hours_overlap()` w bazie.
- 25 testów (`npm test` w `server/`) i ograniczenie liczby prób logowania.

## Czego NIE MA

- **Prawdziwych użytkowników.** Baza startuje pusta — ogłoszenia pojawiają się
  dopiero wtedy, gdy ktoś je doda. W trybie demo dalej widać 720 wygenerowanych
  profili.
- **Portfela monet po stronie serwera.** Kolumna `coins` jest, logiki
  wydawania nie ma — front dalej trzyma saldo w przeglądarce, więc każdy może
  je sobie zmienić w konsoli.
- **Wysyłania wiadomości.** Przycisk „Napisz" pokazuje kontakt albo modal —
  nic nigdzie nie leci.
- **Płatności.** Checkout to modal z opóźnieniem i komunikatem sukcesu.
- **Ekip i transmisji w bazie.** Istnieją tylko we froncie, na danych demo —
  także wtedy, gdy reszta strony chodzi na serwerze.
- **Live.** Kafelki i licznik widzów są statyczne, nie ma odtwarzacza strumienia.
- **Moderacji, zgłoszeń, blokowania.** Nie ma nawet zalążka.
- **Zgody na regulamin przy rejestracji i usuwania konta.** Same dokumenty już
  są (Regulamin i Polityka prywatności w stopce menu), ale nikt ich nie
  akceptuje przy zakładaniu konta, a backend nie ma `DELETE /api/auth/me`.
  Prawo do bycia zapomnianym nie jest opcjonalne.
- **Testów frontu w repozytorium.** Backend ma 25 testów uruchamianych przez
  `npm test`. Front był sprawdzany testem przeklikującym oba tryby, ale ten
  test nie jest jeszcze częścią repo.

## Znane ograniczenia i pułapki techniczne

1. **localStorage ma ~5 MB.** Pliki wrzucane do ogłoszenia idą jako data URL,
   więc jeden film z telefonu potrafi zapchać limit. `save()` w `state.js` łyka
   wyjątek po cichu (`catch (e) {}`) — dane po prostu się nie zapisują i nikt
   się nie dowiaduje. To pierwszy realny bug do naprawienia.
2. **Tryb rozpoznawany jest raz, przy starcie.** Uruchomienie backendu przy
   otwartej stronie nie przełącza jej na serwer — trzeba odświeżyć. Tak samo
   przy otwarciu `index.html` z dysku obok działającego serwera: przeglądarka
   zablokuje zapytanie zasadą CORS i strona wejdzie w tryb demo. Żeby pracować
   na serwerze, otwieraj http://localhost:3000 przy `SERVE_STATIC=1`.
3. **Dane demo są generowane od nowa przy każdym odświeżeniu** z `Date.now()`
   w polach `added`, więc „dodane 3 h temu" zmienia się między wejściami.
4. **Kolejność skryptów w `index.html` ma znaczenie** — wszystko żyje w zasięgu
   globalnym. Nowy plik dopisujemy w odpowiednim miejscu listy, nie na końcu.
   `data-source.js` musi być po `api.js` i `state.js`, a `main.js` ostatni.
5. **Kilka wartości siedzi poza obiektem `KEY`**: `bigww_extra_slot` i
   `bigww_unlock_cred` są czytane bezpośrednio z localStorage. Przy czyszczeniu
   danych trzeba je kasować osobno (kod to robi, ale łatwo przeoczyć).
6. **Brak walidacji formularza** poza `maxlength` i `min/max` na wieku.
7. **Klipy z Twitcha wymagają parametru `parent`** przy embedzie — na
   `file://` to nie zadziała, potrzebny jest serwowany host.
8. **Monety i premium są po stronie klienta.** Każdy może otworzyć konsolę i
   wpisać sobie dowolny balans. Dziś bez znaczenia, przy prawdziwych
   płatnościach krytyczne — musi trafić do bazy.

## Decyzje

- Backend: **Node + Fastify + PostgreSQL w Dockerze**, zapytania przez
  **Kysely** (zamiast Prismy — powód w `CHANGELOG.md` i `docs/DECYZJE.md`).
- Logowanie: **Discord OAuth oraz e-mail z hasłem** (obie drogi, obie gotowe).

Kolejność dalszych prac: `docs/TODO.md`.
