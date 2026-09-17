"use strict";

/* BigWW - Onboarding przy pierwszym wejsciu */

/* =========================================================
   13b. ONBOARDING
========================================================= */
const OB_STEPS = [
  { title: "Witaj w BigWW", body: "Tu znajdziesz ludzi do wspólnego grania — bez losowego matchmakingu i bez trzech Discordów naraz.", cta: "Dalej" },
  { title: "Wybierz grę i filtruj", body: "Ustaw grę, region i porę. Filtry zapisują się same, więc wracasz dokładnie tam, gdzie skończyłeś.", cta: "Dalej" },
  { title: "Dodaj ogłoszenie", body: "Napisz, w co grasz i czego szukasz. Im konkretniej, tym szybciej ktoś odpisze.", cta: "Dalej" },
  { title: "Szukam teraz", body: "Włącz status „Szukam teraz”, a Twoje ogłoszenia wskoczą wyżej przy sortowaniu online. Gotowe — powodzenia!", cta: "Zaczynam" }
];
let obStep = 0;
function renderOnboard() {
  const s = OB_STEPS[obStep];
  $("#obContent").innerHTML = `<h2>${s.title}</h2><p class="note" style="margin-top:8px;line-height:1.6">${s.body}</p>`;
  $("#obNext").textContent = s.cta;
  const steps = $("#obSteps");
  steps.innerHTML = "";
  OB_STEPS.forEach((_, i) => {
    const sp = el("span");
    if (i === obStep) sp.classList.add("on");
    steps.append(sp);
  });
}
function finishOnboard() {
  PREF.onboarded = true;
  save(KEY.pref, PREF);
  $("#onboard").classList.remove("on");
}
function startOnboard() {
  if (PREF.onboarded) return;
  obStep = 0;
  renderOnboard();
  $("#onboard").classList.add("on");
  $("#obNext").onclick = () => {
    if (obStep >= OB_STEPS.length - 1) {
      finishOnboard();
      go("add");
      return;
    }
    obStep++;
    renderOnboard();
  };
  $("#obSkip").onclick = finishOnboard;
}
