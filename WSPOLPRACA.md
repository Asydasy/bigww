# Praca we dwójkę nad BigWW

Ustalenia, żeby dwie osoby nie przepisywały sobie nawzajem tych samych plików.
Przeczytaj przed pierwszą zmianą.

Każda strona pracuje z innym modelem. Zasady dla nich: `CLAUDE.md` i `GROK.md`
— ten drugi jest węższy i wypisuje wprost, co już raz poszło nie tak.

## Wejście dla nowej osoby

```
git clone https://github.com/Asydasy/bigww.git
cd bigww
docker compose up -d
cd server && npm run covers && cd ..   # okładki gier, opcjonalne
```

To wszystko — migracje i seed lecą przy starcie kontenera, front i API siedzą
pod http://localhost:3000. Własny `JWT_SECRET` i dane Discorda wpisujesz
w `server/.env` (wzór: `server/.env.example`); bez tego pliku serwer wstaje na
kluczu testowym i mówi o tym w logu.

**Każdy ma własną bazę.** Nie współdzielimy Postgresa przy pracy — konta i
ogłoszenia, które dodajesz u siebie, widzisz tylko Ty. Wspólną instancję
odpalamy tylko wtedy, gdy chcemy razem coś obejrzeć (tunel, patrz niżej).

## Zasada podstawowa: `main` jest nietykalny

Nikt nie commituje bezpośrednio na `main`. Każda zmiana ma własną gałąź:

```
git checkout main
git pull
git checkout -b edycja-ogloszenia       # nazwa mówi, co robisz
... praca ...
git add -A
git commit -m "Edycja ogloszenia z poziomu moich ogloszen"
git push -u origin edycja-ogloszenia
```

Potem na GitHubie **Compare & pull request**, druga osoba czyta i zatwierdza.
Po scaleniu obaj robią u siebie:

```
git checkout main
git pull
git branch -d edycja-ogloszenia
```

Przy dwóch osobach pull request wygląda na biurokrację. Jest jedyną rzeczą,
która ratuje przed sytuacją, w której obaj macie „działającą wersję" i nikt nie
wie, która jest prawdziwa.

## Podział obszarów

Konflikty biorą się z dwóch osób w jednym pliku. Umawiamy się, kto co bierze,
zanim ktokolwiek zacznie pisać.

**Pliki bezpieczne — zwykle rusza je jedna osoba:**

| obszar | pliki |
|---|---|
| lista graczy i filtry | `js/view-players.js` |
| dodawanie i moje ogłoszenia | `js/view-add.js` |
| baza gier | `js/view-games.js` |
| ekipy i transmisje | `js/view-teams-live.js` |
| strona startowa | `js/view-home.js` |
| premium i płatności | `js/view-premium.js` |
| ustawienia | `js/view-settings.js` |
| giveawaye | `js/view-giveaways.js` |
| regulamin i prywatność | `js/view-terms.js` |
| monety, sklep, zadania, odznaki | `js/monetization.js` |
| logowanie, konto, menu konta | `js/auth-ui.js` |
| tłumaczenia | `js/i18n.js` |
| trasy API | `server/src/routes/*.js` — po jednym pliku na osobę |

**Pliki wspólne — uprzedź drugiego, zanim wejdziesz:**

`index.html`, `css/style.css`, `js/util.js`, `js/cards.js`, `js/state.js`,
`js/data-source.js`, `js/api.js`, `js/nav.js`, `js/main.js`, `js/boot.js`,
`server/src/server.js`, `server/src/config.js`, `server/src/shape.js`,
`server/src/db-schema.d.ts`, `CHANGELOG.md`.

`js/data-source.js` i `js/api.js` to warstwa, przez którą przechodzi każdy
zapis danych — zmiana tam dotyka obu trybów naraz i obu osób.

W tych plikach schodzą się wszyscy i to tam powstają konflikty.

**Migracje bazy** (`server/migrations/`) mają numery w nazwie. Jeśli obaj
dodacie `003_`, po scaleniu jedna nie wykona się u tego, kto miał już swoją
trójkę. Umawiajcie się na numer albo trzymajcie migracje w jednej parze rąk.

## Przykład dobrego podziału

Z bieżącego `docs/TODO.md`:

- **Osoba A** — edycja ogłoszenia: `js/view-add.js` plus `PATCH` w
  `server/src/routes/ads.js`.
- **Osoba B** — ekipy w bazie: nowa migracja, nowy `server/src/routes/teams.js`,
  `js/view-teams-live.js`.

Stykają się tylko na `js/cards.js` (przycisk na karcie) — i to jest ten moment,
w którym jedno zdanie na Discordzie oszczędza godzinę odkręcania.

## Czego nauczyło nas pierwsze scalenie

17.09.2026 dwie osoby pracowały równolegle nad tymi samymi plikami frontu, bez
wspólnej gałęzi. Druga wersja powstała na kodzie sprzed czterech commitów, więc
`git merge` nie wchodził w grę — zmiany trzeba było przenosić ręcznie, plik po
pliku, i porównywać zamiary, a nie tylko linijki. Zajęło to więcej niż napisanie
tych funkcji od zera.

Trzy wnioski:

1. **Zacznij od `git pull`**, zawsze, nawet gdy „to tylko drobna zmiana".
2. **Powiedz, co bierzesz**, zanim otworzysz edytor. Jedno zdanie wystarczy.
3. **Nie buduj równolegle tej samej funkcji.** Powstały wtedy dwa systemy kont —
   jeden na localStorage, drugi na backendzie. Jeden trzeba było wyrzucić.

## Czego nauczyło nas drugie scalenie

18.09.2026 druga strona przysłała **zip zamiast gałęzi**. Nowe rzeczy w nim były
dobre (tło, radio, okładki, prywatne wiadomości), ale przy okazji:

- wróciło konto gościa zakładane automatem, którego nie dało się wylogować,
- `#imRoot` z `pointer-events: auto` na całe okno unieruchomił **całą stronę**,
- logowanie straciło hasła (dowolny nick zakładał konto),
- generator demo ustawiony na zero graczy, wymóg logowania wyłączony,
  onboarding za gołym `return;`, Live za `if (false)`,
- migracja `006_presence.sql` przyszła pusta, a `front.e2e.mjs` zniknął.

Nic z tego nie było widać w zipie — trzeba było porównać drzewo z repo plik po
pliku. Wnioski:

4. **Zmiany wracają przez gałąź i pull request, nie przez archiwum.** Zip nie
   ma historii i nie widać w nim, co skasowano po drodze.
5. **Wyłączenie funkcji to usunięcie funkcji.** `if (false)`, pętla do zera
   i gołe `return;` wyglądają jak celowe i przeżywają scalenie niezauważone.
   Jeśli coś ma wypaść — wypada w całości, osobnym commitem.
6. **Przed wysłaniem zmian zrób `git status` i `git diff --stat`.** Pusty plik
   migracji i skasowany test to nie są rzeczy, które ktoś wyłapie na oko.

## Gdy już dojdzie do konfliktu

```
git checkout main
git pull
git checkout moja-galaz
git rebase main
```

Git pokaże pliki z konfliktem. W środku znajdziesz `<<<<<<<`, `=======`
i `>>>>>>>` — zostawiasz wersję docelową, kasujesz znaczniki, potem:

```
git add <plik>
git rebase --continue
```

Jeśli się pogubisz, `git rebase --abort` cofa wszystko do stanu sprzed i nic
nie tracisz.

## Praca z Claude'em w dwie osoby

Claude nie ma dostępu do repozytorium — oddaje zmiany jako paczkę (`.bundle`),
którą trzeba wciągnąć i wypchnąć. Przy dwóch osobach oznacza to dwie rzeczy:

1. **Kto dostaje paczkę, ten ją od razu wypycha.** Inaczej drugi pracuje na
   starym kodzie i konflikt gotowy.
2. **Nie zlecajcie Claude'owi tego samego pliku w dwóch sesjach naraz.** Dwie
   sesje nic o sobie nie wiedzą i potrafią przepisać ten sam plik w dwie różne
   strony. Obowiązuje tabela podziału wyżej.

Zanim poprosisz o zmianę, powiedz Claude'owi, nad czym pracuje druga osoba —
wtedy trzyma się swojego obszaru.

## Zanim wystawisz pull request

- `cd server && npm test` — 26 testów API przechodzi.
- `cd server && npm run test:front` — przeklikanie obu trybów. Wymaga
  działającego serwera i Playwrighta (`npm i -D playwright && npx playwright
  install chromium`). Test dopisuje do bazy jedno konto i jedno ogłoszenie.
- Po zmianie w `server/migrations/` puść `npm run migrate` na obu bazach:
  roboczej i testowej.
- Dopisz wpis do `CHANGELOG.md`.
- Zaktualizuj `docs/STAN.md`, jeśli zmieniło się, co działa.

## Wspólne oglądanie jednej wersji

Gdy chcecie obejrzeć to samo w tym samym momencie, jeden hostuje:

```
docker compose up -d
cloudflared tunnel --url http://localhost:3000
```

i wysyła drugiemu link kończący się na `.trycloudflare.com`. Wtedy obaj
patrzycie na **jedną bazę** — tę u hostującego. Do oglądania i testowania
we dwójkę, nie do pracy nad kodem.
