# Stan projektu — 2026-09-17

## Krótko

Front-end rozdzielony na `index.html` + `css/style.css` + 16 plików w `js/`.
Waniliowy JavaScript, zero zależności, stan w localStorage. Backendu jeszcze
nie ma — jest zdecydowany stos (Node + Fastify + PostgreSQL w Dockerze,
Prisma) i logowanie przez Discorda oraz przez e-mail z hasłem.

Prototyp jest kompletny wizualnie i klikalny od początku do końca: da się
przejść onboarding, dodać ogłoszenie, przefiltrować graczy, „kupić" premium,
zarobić monety i wydać je w sklepie. Wszystko lokalnie.

## Co DZIAŁA

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
Filtrowanie po grze, regionie, platformie, stylu, porze grania, mikrofonie.
Wyszukiwarka tokenowa z AND i scoringiem trafności, ignoruje polskie znaki
diakrytyczne. Filtry zapisują się w localStorage. Paginacja po 24 wyniki.

**Tryb „Szukam teraz"**
Przełącznik, który podbija własne karty przy sortowaniu po aktywności; pasek
statusu na Starcie i na liście graczy.

**Monetyzacja (cała udawana, bez bramki płatniczej)**
- Plany: Darmowy 0 zł, Premium 19,99 zł/mies., Pro/Clan 39,99 zł/mies.,
  Premium na rok 149 zł. Limit ogłoszeń: 2 free (3 z dokupionym slotem),
  10 premium, 20 pro.
- Monety WW: start 40. Odblokowanie kontaktu 20 WW, wiadomość 8 WW, bilet na
  jednego streama 35 WW, przepustka na wszystkie live 80 WW.
- Sklep: boost 6 h 25 WW, boost 24 h 60 WW, dodatkowy slot na 7 dni 80 WW,
  nowy awatar 10 WW, pakiet 5 kontaktów 70 WW.
- Pakiety monet za złotówki: 100 za 9,99 zł; 500+100 bonus za 39,99 zł;
  1500+500 za 99 zł; starter 200+50 z premium na 3 dni za 14,99 zł.
- Reklamy z nagrodą, dzienne zadania (2 reklamy → 10 WW, wiadomość → 8 WW,
  boost → 15 WW, ogłoszenie → 12 WW), battle pass 10 poziomów po 100 XP,
  program polecający z kodem BIG-XXXX, interstitial co kilka przejść nawigacji.
- Darmowe wiadomości: 5 dziennie, potem za monety albo premium.

**Ustawienia**
Motyw ciemny/jasny (zapisywany), region domyślny, zmiana awatara, kasowanie
wszystkich danych lokalnych.

## Czego NIE MA

- **Backendu.** Zero. Żadnego API, serwera, bazy, kont, logowania, sesji.
- **Prawdziwych użytkowników.** Wszyscy „gracze" to generator. Dwie osoby
  otwierające stronę nie widzą się nawzajem.
- **Wysyłania wiadomości.** Przycisk „Napisz" pokazuje kontakt albo modal —
  nic nigdzie nie leci.
- **Płatności.** Checkout to modal z opóźnieniem i komunikatem sukcesu.
- **Live.** Kafelki i licznik widzów są statyczne, nie ma odtwarzacza strumienia.
- **Moderacji, zgłoszeń, blokowania.** Nie ma nawet zalążka.
- **RODO / regulaminu / polityki prywatności.** Przy prawdziwych użytkownikach
  to jest warunek startu, nie „potem".
- **Testów automatycznych.** Jest tylko ręczny smoke test przeklikujący widoki.

## Znane ograniczenia i pułapki techniczne

1. **localStorage ma ~5 MB.** Pliki wrzucane do ogłoszenia idą jako data URL,
   więc jeden film z telefonu potrafi zapchać limit. `save()` w `state.js` łyka
   wyjątek po cichu (`catch (e) {}`) — dane po prostu się nie zapisują i nikt
   się nie dowiaduje. To pierwszy realny bug do naprawienia.
2. **Dane demo są generowane od nowa przy każdym odświeżeniu** z `Date.now()`
   w polach `added`, więc „dodane 3 h temu" zmienia się między wejściami.
3. **Kolejność skryptów w `index.html` ma znaczenie** — wszystko żyje w zasięgu
   globalnym. Nowy plik dopisujemy w odpowiednim miejscu listy, nie na końcu.
4. **Kilka wartości siedzi poza obiektem `KEY`**: `bigww_extra_slot` i
   `bigww_unlock_cred` są czytane bezpośrednio z localStorage. Przy czyszczeniu
   danych trzeba je kasować osobno (kod to robi, ale łatwo przeoczyć).
5. **Brak walidacji formularza** poza `maxlength` i `min/max` na wieku.
6. **Karta sponsorowana pokazuje się także przy zerowej liczbie wyników** —
   nad komunikatem „Brak dokładnych wyników". Zachowanie odziedziczone po
   pierwszej wersji, świadomie zostawione przy rozdzielaniu plików, żeby refaktor
   nic nie zmieniał. Do poprawy osobno.
7. **Klipy z Twitcha wymagają parametru `parent`** przy embedzie — na
   `file://` to nie zadziała, potrzebny jest serwowany host.
8. **Monety i premium są po stronie klienta.** Każdy może otworzyć konsolę i
   wpisać sobie dowolny balans. Dziś bez znaczenia, przy prawdziwych
   płatnościach krytyczne — musi trafić do bazy.

## Podjęte decyzje czekające na realizację

- Backend: **Node + Fastify + PostgreSQL w Dockerze, Prisma jako ORM**.
- Logowanie: **Discord OAuth oraz e-mail z hasłem** (obie drogi).

Szczegóły i kolejność prac: `docs/TODO.md`.
