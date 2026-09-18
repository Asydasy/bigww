# Instrukcja dla Groka — projekt BigWW

Przeczytaj to **całe**, zanim dotkniesz jednego pliku. Nie streszczaj mi tego
z powrotem, tylko się tego trzymaj.

Nad tym repo pracują dwa modele. Ty jesteś drugim. `CLAUDE.md` opisuje projekt
i zasady ogólne — obowiązują też ciebie. Ten plik jest węższy i mówi to, czego
`CLAUDE.md` nie musi mówić drugiej stronie: **czego konkretnie nie wolno**,
bo już raz przez to przeszliśmy i trzeba było scalać ręcznie.

## Zasada zero

**Twoja praca wraca do repozytorium przez `git`, nie przez zip.** Nie wysyłasz
„pełnej paczki do wgrania". Paczka nie ma historii, nie da się jej zrewidować
i nie widać w niej, co skasowałeś po drodze. Robisz commity z opisem po polsku.
Jeden commit = jedna skończona zmiana w zachowaniu.

## Czego NIE ruszasz

Trzymaj się obszaru, o który cię proszono. Poniższe zostawiasz w spokoju,
chyba że dostaniesz wyraźne polecenie akurat do tego:

1. **Czat ogólny** — `js/chat.js`, `server/src/routes/chat.js`,
   `server/migrations/005_chat.sql`. Działa. Nie dotykaj.
2. **Warstwa `DATA`** — `js/data-source.js`. Dokładasz metody, nie przepisujesz
   pliku. Każda nowa metoda ma **obie ścieżki**: serwerową i lokalną.
3. **Migracje** — plików w `server/migrations/` **nigdy nie edytujesz**. Runner
   pamięta, co już poszło. Zmiana schematu = nowy plik z kolejnym numerem.
4. **`server/src/plugins/auth.js`** i kolejność rejestracji w `src/server.js`.
5. **Cudze pliki w trakcie sesji** — patrz `WSPOLPRACA.md`.

## Czego NIE robisz — lista z życia

To nie są hipotezy. Każda z tych rzeczy przyszła w paczce i każdą trzeba było
cofać ręcznie.

### 1. Nie wyłączaj funkcji, żeby coś działało

Nie było: `if (false && view === "live")`, `for (let i = 0; i < 0; i++)`,
`return MINE.concat(PLAYERS.filter(() => false))`, gołe `return;` na początku
funkcji, `AUTH_REQUIRED_VIEWS = new Set()`.

Jeśli coś ma zniknąć — **usuń to w całości i osobnym commitem**, razem
z widokiem, danymi, tłumaczeniami i wpisem w `CHANGELOG.md`. Jeśli ma zostać —
zostaw działające. Kod zablokowany na `false` to najgorszy z trzech światów:
nie działa, nie da się go znaleźć i wygląda na celowy.

### 2. Nie zakładaj kont za użytkownika

Nie było: `ensureGuestAccount()` tworzące konto `guest_…` przy starcie
i `doLogin()`, w którym dowolny nick bez hasła zakładał konto.

Konto zakłada backend, po haśle. Jeśli potrzebujesz kilku kont do testów —
zarejestruj je normalnie przez `/api/auth/register` w teście, a nie przyciskiem
w interfejsie produkcyjnym.

### 3. Nie ufaj przeglądarce w kwestii tego, kim jest użytkownik

Nie było: `POST /api/dm` przyjmujące `fromId` i `fromNick` z ciała żądania.
To znaczyło, że każdy mógł napisać jako ktokolwiek — jednym `curl`-em.

**Nadawcę bierzesz z sesji** (`request.currentUser`), zawsze. Przeglądarka
podaje najwyżej, DO KOGO pisze. Ta sama zasada dotyczy pieniędzy, limitów
i uprawnień.

### 4. Nie trzymaj danych w plikach JSON obok serwera

Nie było: `server/data/dms.json`. Kontener się odtwarza i dane znikają,
a dwa procesy nadpisują sobie plik nawzajem.

Baza to PostgreSQL. Nowa tabela = nowa migracja + wpis w
`server/src/db-schema.d.ts` (nie generuje się sam).

### 5. Nie kładź przezroczystej płyty na całą stronę

Nie było: `#imRoot { position: fixed; inset: 0; pointer-events: auto !important }`.
Efekt: **nie działało nic** — ani logowanie, ani menu, ani karty. Nie widać
tego na zrzucie ekranu, bo warstwa jest niewidzialna.

Element rozciągnięty na całe okno ma `pointer-events: none`. Kliknięcia łapią
dopiero jego dzieci.

### 6. Nie rozwiązuj problemów przez `!important` i `try/catch`

Nie było: `style.setProperty("display", "flex", "important")` zamiast poprawki
w CSS, `try { … } catch (e) {}` dookoła każdego wywołania i
`if (typeof X === "function")` przed funkcją, która zawsze istnieje.

To nie jest ostrożność, to zagłuszanie błędów. Jeśli funkcji może nie być —
napisz w komentarzu, kiedy. Jeśli zawsze jest — wołaj ją wprost. Pusty `catch`
zjada dokładnie ten wyjątek, który miałby ci powiedzieć, co jest nie tak.

### 7. Nie usuwaj cudzej pracy przy okazji

Nie było: `006_presence.sql` przysłane jako pusty plik i skasowany
`server/test/front.e2e.mjs`.

Przed wysłaniem zmian zrób `git status` i `git diff --stat`. Jeśli coś ci
zniknęło, a nie miałeś tego usuwać — przywróć, zanim wyślesz.

### 8. Nie podmieniaj tekstów prawnych przy okazji innej zmiany

Regulamin i polityka prywatności to `js/view-terms.js`. Zmiana zdania
o płatnościach albo o tym, gdzie trzymane są dane, to **decyzja**, nie
poprawka stylistyczna. Osobny commit, wpis w `docs/DECYZJE.md`.

## Co robisz zawsze

1. **`git pull` na starcie sesji.** Repo idzie do przodu między rozmowami.
2. **Cudzy tekst przez `textContent`.** Nick, wiadomość, opis ogłoszenia,
   nazwa ekipy. `innerHTML` w takim miejscu to XSS. Wyjątek: HTML, który sam
   napisałeś, bez wstawek ze zmiennych.
3. **`cd server && npm test`** po każdej zmianie w `server/`.
   Nowy endpoint = nowy test. Dziś jest 47, ma nie spaść.
4. **`cd server && npm run test:front`** po każdej zmianie we froncie.
   Wymaga działającego serwera i Playwrighta:
   `npm i -D playwright && npx playwright install chromium`.
   Test przeklikuje **oba tryby** — serwerowy i lokalny po odcięciu API.
5. **Kolejność skryptów w `index.html`.** Nie ma modułów ES, wszystko żyje
   globalnie. Nowy plik wstawiasz we właściwe miejsce listy (`util.js` przed
   `data-demo.js`, `i18n.js` przed `state.js`, `api.js` przed `data-source.js`,
   `monetization.js` po widokach, `main.js` przedostatni, `boot.js` ostatni).
6. **Wpis do `CHANGELOG.md`** na koniec sesji, najnowsze na górze, po polsku,
   o **zachowaniu**, nie o plikach.
7. **Aktualizacja `docs/STAN.md`** — sekcje „Co DZIAŁA", „Czego NIE MA"
   i „Znane błędy" czyta następna sesja jako pierwsze.
8. **Bez nowych zależności we froncie.** Zero bibliotek, zero CDN-ów, zero
   builda. Jedyny wyjątek jest już w kodzie (CDN Steama jako **zapasowe**
   źródło okładek, z plikiem lokalnym przed nim) i nie jest zaproszeniem
   do kolejnych.
9. **Pliki mediów nie wchodzą do repo.** `img/games/` i `audio/` są
   w `.gitignore`. Kod ma działać, kiedy ich nie ma.

## Jak pisać do użytkownika

Po polsku. Konkretnie: nazwy funkcji, numery linii, nazwy plików. Bez planów
i opisów metody — on chce wiedzieć, co się zmieniło i co ma przeklikać.

Jest testerem manualnym, więc **napisz mu wprost, czego szukać**: „sprawdź, czy
po wylogowaniu da się wrócić na Start", a nie „poprawiono obsługę sesji".

Jeśli czegoś nie zrobiłeś albo nie działa — powiedz to pierwszym zdaniem.
Nie pakuj tego w zdanie o tym, co się udało.
