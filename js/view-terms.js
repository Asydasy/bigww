"use strict";

/* =========================================================
   12a. REGULAMIN I POLITYKA PRYWATNOŚCI (prawo polskie)
========================================================= */
const TERMS_PL = {
  terms: { title: "Regulamin serwisu BigWW", sub: "Warunki korzystania z platformy zgodne z prawem Rzeczypospolitej Polskiej.", html: "" },
  privacy: { title: "Polityka prywatności BigWW", sub: "Informacja o przetwarzaniu danych osobowych (RODO).", html: "" }
};
const TERMS_EN = {
  terms: { title: "BigWW Terms of Service", sub: "Rules for using the platform under Polish law.", html: "" },
  privacy: { title: "BigWW Privacy Policy", sub: "Information on personal data processing (GDPR).", html: "" }
};

function buildTermsHtml() {
  TERMS_PL.terms.html = `
<div class="terms-meta">Wersja z dnia 17 września 2026 r. · Obowiązuje od publikacji w serwisie</div>
<h3>§ 1. Postanowienia ogólne</h3>
<p>1. Niniejszy Regulamin określa zasady korzystania z serwisu internetowego BigWW (dalej: „Serwis”).</p>
<p>2. Serwis umożliwia Użytkownikom publikowanie ogłoszeń o poszukiwaniu osób do wspólnej gry komputerowej oraz przeglądanie takich ogłoszeń (usługa społecznościowa o charakterze informacyjnym).</p>
<p>3. Właścicielem i administratorem Serwisu jest podmiot prowadzący Serwis BigWW (dalej: „Administrator”).</p>
<p>4. Regulamin stanowi regulamin świadczenia usług drogą elektroniczną w rozumieniu ustawy z dnia 18 lipca 2002 r. o świadczeniu usług drogą elektroniczną (Dz.U. 2020 poz. 344 ze zm.).</p>
<p>5. Korzystanie z Serwisu oznacza akceptację niniejszego Regulaminu.</p>
<h3>§ 2. Definicje</h3>
<ul>
<li><b>Użytkownik</b> – osoba fizyczna korzystająca z Serwisu.</li>
<li><b>Konto</b> – indywidualne konto Użytkownika zabezpieczone hasłem.</li>
<li><b>Ogłoszenie</b> – treść opublikowana w celu znalezienia osób do wspólnej gry.</li>
<li><b>Premium</b> – płatna usługa dodatkowa (wyróżnienie, limity).</li>
<li><b>Monety WW</b> – wirtualne jednostki w Serwisie, bez wartości pieniężnej poza Serwisem.</li>
</ul>
<h3>§ 3. Wymagania i wiek</h3>
<p>1. Wymagane jest urządzenie z Internetem i aktualna przeglądarka.</p>
<p>2. Serwis jest przeznaczony dla osób, które ukończyły 13 lat. Osoby poniżej 18 lat korzystają za zgodą przedstawiciela ustawowego, w zakresie dozwolonym prawem.</p>
<p>3. Użytkownik podaje prawdziwe dane w zakresie wymaganym do korzystania z funkcji Serwisu.</p>
<h3>§ 4. Rejestracja i konto</h3>
<p>1. Część funkcji działa bez rejestracji; publikacja ogłoszeń i część funkcji Premium wymaga Konta.</p>
<p>2. Przy rejestracji podaje się nick, adres e-mail oraz hasło. Użytkownik chroni poufność hasła.</p>
<p>3. Zabronione jest zakładanie kont w imieniu osób trzecich bez upoważnienia oraz udostępnianie Konta.</p>
<p>4. Administrator może zawiesić lub usunąć Konto przy naruszeniu Regulaminu, prawa lub działaniu na szkodę innych.</p>
<p>5. Użytkownik może usunąć dane i Konto w ustawieniach Serwisu.</p>
<h3>§ 5. Zasady publikacji treści</h3>
<p>1. Użytkownik odpowiada za treści ogłoszeń, tagi i dane kontaktowe.</p>
<p>2. Zabronione są treści: niezgodne z prawem RP lub UE; pornograficzne lub z udziałem małoletnich (w tym fikcyjne); nawołujące do nienawiści lub przemocy; stalking, doxxing, nękanie; oszustwa, phishing, spam; naruszające dobra osobiste lub prawa autorskie; złośliwe oprogramowanie.</p>
<p>3. Zabronione jest podszywanie się pod inne osoby lub Administratora.</p>
<p>4. Administrator może usuwać treści naruszające Regulamin i ograniczać dostęp.</p>
<p>5. Kontakt między Użytkownikami odbywa się poza Serwisem (np. Discord). Administrator nie odpowiada za prywatną korespondencję.</p>
<h3>§ 6. Usługi płatne</h3>
<p>1. Ceny Premium, monet WW i boostów są podawane przed zakupem.</p>
<p>2. Płatności Premium są realizowane w ramach oferty Serwisu.</p>
<p>3. Monety WW nie są środkiem płatniczym i nie podlegają wymianie na gotówkę.</p>
<p>4. Konsumenci mają prawo odstąpienia od umowy na odległość w terminie 14 dni, z wyjątkami z art. 38 ustawy o prawach konsumenta.</p>
<p>5. Reklamy są oznaczane. Administrator nie odpowiada za strony partnerów zewnętrznych.</p>
<h3>§ 7. Odpowiedzialność</h3>
<p>1. Serwis jest platformą ogłoszeniową. Administrator nie pośredniczy w umowach między Użytkownikami.</p>
<p>2. Administrator nie gwarantuje nieprzerwanej dostępności (konserwacja, awarie, siła wyższa).</p>
<p>3. Administrator nie odpowiada za działania innych Użytkowników, treści przez nich publikowane ani utratę hasła z winy Użytkownika — z zastrzeżeniem odpowiedzialności, której nie można wyłączyć wobec konsumentów.</p>
<h3>§ 8. Własność intelektualna</h3>
<p>1. Nazwa BigWW, interfejs i kod należą do Administratora lub licencjodawców.</p>
<p>2. Publikując ogłoszenie, Użytkownik udziela niewyłącznej licencji na wyświetlanie treści w Serwisie.</p>
<p>3. Nazwy gier należą do ich właścicieli i są używane informacyjnie.</p>
<h3>§ 9. Reklamacje</h3>
<p>1. Reklamacje zgłasza się Administratorowi z opisem problemu i nickiem.</p>
<p>2. Rozpatrzenie w terminie 14 dni.</p>
<p>3. Konsumenci mogą skorzystać z platformy ODR: https://ec.europa.eu/consumers/odr</p>
<h3>§ 10. Dane osobowe</h3>
<p>Zasady określa Polityka prywatności. Przetwarzanie zgodne z RODO oraz polską ustawą o ochronie danych osobowych.</p>
<h3>§ 11. Zmiany Regulaminu</h3>
<p>Administrator może zmienić Regulamin z ważnych przyczyn (prawo, funkcje, bezpieczeństwo). Nowa wersja jest oznaczana w Serwisie.</p>
<h3>§ 12. Prawo właściwe</h3>
<p>1. Stosuje się prawo polskie.</p>
<p>2. Spory rozstrzygają sądy według KPC, z uprawnieniami konsumenta do sądu miejsca zamieszkania.</p>
<p>3. W sprawach nieuregulowanych: Kodeks cywilny, ustawa o świadczeniu usług drogą elektroniczną, ustawa o prawach konsumenta, RODO.</p>`;

  TERMS_PL.privacy.html = `
<div class="terms-meta">Wersja z dnia 17 września 2026 r.</div>
<h3>1. Administrator danych</h3>
<p>Administratorem danych osobowych jest podmiot prowadzący Serwis BigWW. Kontakt w sprawach RODO — kanał wskazany w Serwisie.</p>
<h3>2. Jakie dane przetwarzamy</h3>
<ul>
<li>konto: nick, e-mail, zahashowane hasło, data utworzenia,</li>
<li>ogłoszenia: opis, tagi, kontakt, region, preferencje gry,</li>
<li>dane techniczne: motyw, język, stan Premium/monet w localStorage,</li>
<li>przy płatnościach: dane niezbędne u operatora płatności.</li>
</ul>
<p>Dane konta, ogłoszeń i wiadomości są przechowywane w Serwisie. Ustawienia, monety i powiadomienia zostają w przeglądarce.</p>
<h3>3. Cele i podstawy (RODO)</h3>
<ul>
<li>art. 6 ust. 1 lit. b — wykonanie umowy o świadczenie usług drogą elektroniczną,</li>
<li>art. 6 ust. 1 lit. f — prawnie uzasadniony interes (bezpieczeństwo, nadużycia),</li>
<li>art. 6 ust. 1 lit. c — obowiązki prawne,</li>
<li>art. 6 ust. 1 lit. a — zgoda, gdy wymagana.</li>
</ul>
<h3>4. Okres przechowywania</h3>
<p>Przez okres posiadania konta oraz do usunięcia przez Użytkownika lub Administratora; dane w przeglądarce — do wyczyszczenia localStorage.</p>
<h3>5. Odbiorcy</h3>
<p>Hosting, operatorzy płatności (gdy dotyczy). Ogłoszenia są widoczne dla innych Użytkowników; kontakt — po odblokowaniu zgodnie z regułami Serwisu.</p>
<h3>6. Prawa Użytkownika</h3>
<p>Dostęp, sprostowanie, usunięcie, ograniczenie, przenoszenie, sprzeciw, skarga do Prezesa UODO (ul. Stawki 2, 00-193 Warszawa). W ustawieniach dostępny eksport i usunięcie danych.</p>
<h3>7. Cookies / localStorage</h3>
<p>Serwis używa localStorage do sesji, preferencji i ogłoszeń.</p>
<h3>8. Bezpieczeństwo</h3>
<p>Hasła są hashowane. Nie prosimy o hasło poza formularzem logowania.</p>
<h3>9. Zmiany</h3>
<p>Aktualna wersja publikowana w Serwisie z datą wersji.</p>`;

  TERMS_EN.terms.html = `
<div class="terms-meta">Version of 17 September 2026</div>
<h3>§ 1. General</h3>
<p>These Terms govern BigWW under the Polish Act on Providing Services by Electronic Means. Using the Service means acceptance.</p>
<h3>§ 2–5. Account and content</h3>
<p>For users aged 13+. Listings must be lawful. Illegal content, child sexual material (including fictional), hate, harassment, fraud and impersonation are prohibited. User-to-user contact is outside the Service.</p>
<h3>§ 6. Paid features</h3>
<p>Premium and WW coins are priced in the UI. Coins are not legal tender. Polish consumer withdrawal rules (14 days) apply where required.</p>
<h3>§ 7–9. Liability and complaints</h3>
<p>BigWW is a listing platform. Complaints: describe the issue and nick; response within 14 days. ODR: https://ec.europa.eu/consumers/odr</p>
<h3>§ 10–12. Privacy and law</h3>
<p>See the Privacy Policy (GDPR). Polish law applies.</p>`;

  TERMS_EN.privacy.html = `
<div class="terms-meta">Version of 17 September 2026</div>
<h3>Controller and data</h3>
<p>Operator of BigWW. Account data, listings and local technical preferences. The demo mainly stores data in localStorage.</p>
<h3>Legal bases</h3>
<p>GDPR Art. 6(1)(b), (f), (c), (a) as applicable.</p>
<h3>Rights</h3>
<p>Access, rectification, erasure, restriction, portability, objection; complaint to the Polish DPA (UODO). Export and wipe tools are in Settings.</p>`;
}
buildTermsHtml();

function renderTerms(kind) {
  const k = kind === "privacy" ? "privacy" : "terms";
  const pack = (LANG === "en" ? TERMS_EN : TERMS_PL)[k];
  const title = document.getElementById("termsTitle");
  const sub = document.getElementById("termsSub");
  const box = document.getElementById("termsContent");
  if (title) title.textContent = pack.title;
  if (sub) sub.textContent = pack.sub;
  if (box) box.innerHTML = pack.html;
}

