"use strict";

/* =========================================================
   11b. PREMIUM
========================================================= */
const PLANS = [
  {
    id: "free", name: "Darmowe", price: "0 zł", per: "zawsze", days: 0, best: false,
    perks: [["Przeglądanie bazy graczy", 1], ["5 darmowych wiadomości / dzień", 1],
            ["2 własne ogłoszenia", 1], ["Pełny kontakt bez limitu", 0],
            ["Bez reklam pełnoekranowych", 0]],
    cta: "Używasz teraz"
  },
  {
    id: "month", name: "Premium", price: "19,99 zł", per: "miesięcznie", days: 30, best: false,
    perks: [["Nielimitowany kontakt i wiadomości", 1], ["Ogłoszenia nad resztą wyników", 1],
            ["Do 10 ogłoszeń", 1],
            ["Bez reklam pełnoekranowych", 1], ["Własny kolor awatara", 1]],
    cta: "Kup na miesiąc"
  },
  {
    id: "pro", name: "Pro / Clan", price: "39,99 zł", per: "miesięcznie", days: 30, best: true,
    perks: [["Wszystko z Premium", 1], ["Do 20 ogłoszeń + klan", 1],
            ["Sponsored slot 24 h / tydzień", 1], ["Statystyki wyświetleń", 1],
            ["Priorytet w ekipach", 1], ["Badge PRO i brak reklam", 1]],
    cta: "Weź Pro"
  },
  {
    id: "year", name: "Premium na rok", price: "149 zł", per: "rocznie", days: 365, best: false,
    save: "Oszczędzasz 91 zł wobec płatności co miesiąc",
    perks: [["Wszystko z planu Premium", 1], ["Cena zamrożona na 12 miesięcy", 1],
            ["Priorytet w zgłoszeniach do ekip", 1], ["Statystyki wyświetleń ogłoszenia", 1],
            ["Bez odnawiania co miesiąc", 1], ["Rezygnacja w każdej chwili", 1]],
    cta: "Kup na rok"
  }
];

function dateStr(ts) { return new Date(ts).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" }); }

function renderPremium() {
  const st = $("#premStatus");
  st.innerHTML = "";
  if (isPrem()) {
    const plan = PLANS.find(p => p.id === PREM.plan);
    const box = el("div", "prem-banner");
    box.innerHTML = `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <span class="badge-prem">PREMIUM</span><b>${plan ? plan.name : "Premium"} jest aktywne</b></div>
      <p class="note">Ważne do ${dateStr(PREM.until)}. Twoje ogłoszenia są wyróżniane od ${dateStr(PREM.since)}.</p>`;
    const off = el("button", "btn sm ghost", "Zrezygnuj");
    off.style.marginTop = "14px";
    off.onclick = cancelPrem;
    box.append(off);
    st.append(box);
  }

  const box = $("#plans");
  box.innerHTML = "";
  PLANS.forEach(p => {
    const c = el("div", "plan" + (p.best ? " best" : ""));
    c.append(el("h3", null, p.name));
    const pr = el("div", "price");
    pr.append(document.createTextNode(p.price), el("small", null, " / " + p.per));
    c.append(pr);
    if (p.save) c.append(el("div", "save", p.save));
    const ul = el("ul");
    p.perks.forEach(([t, ok]) => ul.append(el("li", ok ? "" : "no", t)));
    c.append(ul);

    let btn;
    if (p.id === "free") {
      btn = el("button", "btn ghost", isPrem() ? "Plan podstawowy" : "Używasz teraz");
      btn.disabled = true;
      btn.style.opacity = ".6";
    } else if (isPrem() && PREM.plan === p.id) {
      btn = el("button", "btn ghost", "Aktywne");
      btn.disabled = true;
      btn.style.opacity = ".6";
    } else {
      btn = el("button", "btn gold", p.cta);
      btn.onclick = () => checkout(p);
    }
    c.append(btn);
    box.append(c);
  });

  const faq = [
    ["Czy mogę zrezygnować w każdej chwili?", "Tak. Anulujesz subskrypcję w Ustawieniach — dostęp Premium działa do końca opłaconego okresu."],
    ["Co dostaję w Premium?", "Ogłoszenia nad resztą wyników, złota ramka i odznaka, wyższy limit ogłoszeń i nielimitowany kontakt."],
    ["Czy bez Premium widzę wszystkich graczy?", "Tak. Przeglądanie i filtry są dostępne dla każdego. Premium ułatwia kontakt i wyróżnia Twoje ogłoszenia."],
    ["Jak działa płatność?", "Płatność kartą jest szyfrowana. Po potwierdzeniu Premium aktywuje się od razu."]
  ];
  $("#faq").innerHTML = faq.map(([q, a]) =>
    `<div style="padding:12px 0;border-bottom:1px solid var(--line)"><b style="font-size:14px">${q}</b>
     <p class="note" style="margin-top:6px">${a}</p></div>`).join("");
}

function checkout(plan) {
  openModal(`<h3 style="margin-bottom:4px">${plan.name}</h3>
    <p class="note" style="margin-bottom:16px">${plan.price} / ${plan.per} · dostęp na ${plan.days} dni</p>
    <div class="demo-note" style="margin-bottom:14px">Płatność jest szyfrowana. Upewnij się, że dane karty są poprawne.</div>
    <div class="pay">
      <div class="field"><label for="cName">Imię i nazwisko na karcie</label><input type="text" id="cName" placeholder="Jan Kowalski" autocomplete="off"></div>
      <div class="field"><label for="cNum">Numer karty</label><input type="text" id="cNum" inputmode="numeric" placeholder="4242 4242 4242 4242" autocomplete="off"></div>
      <div class="row">
        <div class="field"><label for="cExp">Ważna do</label><input type="text" id="cExp" inputmode="numeric" placeholder="12/29" autocomplete="off"></div>
        <div class="field"><label for="cCvc">CVC</label><input type="text" id="cCvc" inputmode="numeric" placeholder="123" autocomplete="off"></div>
      </div>
      <button class="btn gold" id="cPay">Zapłać ${plan.price}</button>
      <button class="btn ghost sm" id="cFill">Wypełnij przykładowe dane</button>
    </div>`);

  const num = $("#cNum"), exp = $("#cExp"), cvc = $("#cCvc");
  num.oninput = () => {
    num.value = num.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  };
  exp.oninput = () => {
    let v = exp.value.replace(/\D/g, "").slice(0, 4);
    exp.value = v.length > 2 ? v.slice(0, 2) + "/" + v.slice(2) : v;
  };
  cvc.oninput = () => cvc.value = cvc.value.replace(/\D/g, "").slice(0, 4);

  $("#cFill").onclick = () => {
    $("#cName").value = "Jan Testowy";
    num.value = "4242 4242 4242 4242";
    exp.value = "12/29";
    cvc.value = "123";
  };
  $("#cPay").onclick = () => {
    if ($("#cName").value.trim().length < 3) return toast("Wpisz imię i nazwisko");
    if (num.value.replace(/\s/g, "").length < 12) return toast("Numer karty jest za krótki");
    if (!/^\d{2}\/\d{2}$/.test(exp.value)) return toast("Data ważności w formacie MM/RR");
    if (cvc.value.length < 3) return toast("Wpisz kod CVC");
    processPay(plan);
  };
}

function processPay(plan) {
  $("#modalBox").innerHTML = `<div class="spin"></div>
    <p style="text-align:center;color:var(--txt-dim)">Przetwarzanie płatności…</p>`;
  setTimeout(() => {
    PREM = { active: true, plan: plan.id, since: Date.now(), until: Date.now() + plan.days * 24 * HOUR };
    save(KEY.prem, PREM);
    $("#modalBox").innerHTML = `<div style="text-align:center">
      <div style="font-size:40px;line-height:1">◈</div>
      <h3 style="margin:10px 0 6px">Premium aktywne</h3>
      <p class="note">${plan.name} działa do ${dateStr(PREM.until)}. Twoje ogłoszenia są już wyróżnione.</p>
      <p class="note" style="margin-top:10px">Premium zostało aktywowane na Twoim koncie.</p></div>`;
    const ok = el("button", "btn gold", "Zobacz moje ogłoszenia");
    const row = el("div");
    row.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;margin-top:18px;justify-content:center";
    ok.onclick = () => { $("#modal").classList.remove("on"); go("mine"); };
    const close = el("button", "btn", "Zamknij");
    close.onclick = () => $("#modal").classList.remove("on");
    row.append(ok, close);
    $("#modalBox").append(row);
    refreshPrem();
    toast("Premium aktywowane");
  }, 1300);
}

function cancelPrem() {
  openModal(`<h3 style="margin-bottom:8px">Zrezygnować z Premium?</h3>
    <p class="note">Wyróżnienie ogłoszeń i odznaka znikną od razu, a limit ogłoszeń wróci do 2.</p>
    <button class="btn pri" id="offYes" style="margin-top:16px">Tak, rezygnuję</button>`);
  $("#offYes").onclick = () => {
    PREM = { active: false, plan: null, until: 0, since: 0 };
    save(KEY.prem, PREM);
    $("#modal").classList.remove("on");
    refreshPrem();
    toast("Premium wyłączone");
  };
}

function refreshPrem() {
  updateBadges();
  renderPremium();
  renderPlayers(true);
  renderMine();
  renderHome();
  renderSettingsPrem();
}

function renderSettingsPrem() {
  const authBox = $("#setAuth");
  if (authBox) {
    authBox.innerHTML = "";
    if (isLoggedIn()) {
      const u = currentUser();
      authBox.append(el("p", "note", "Zalogowany jako: " + (u ? u.nick : SESSION.nick) + (u && u.email ? " · " + u.email : "")));
      const out = el("button", "btn ghost sm", "Wyloguj");
      out.style.marginTop = "8px";
      out.onclick = doLogout;
      authBox.append(out);
    } else {
      authBox.append(el("p", "note", "Zaloguj się, żeby zarządzać ogłoszeniami, monetami i Premium."));
      const b = el("button", "btn pri sm", "Zaloguj / Załóż konto");
      b.style.marginTop = "8px";
      b.onclick = openAuthModal;
      authBox.append(b);
    }
  }
  const box = $("#setPrem");
  if (!box) return;
  box.innerHTML = "";
  if (isPrem()) {
    const line = el("p", "note", "Premium aktywne do " + dateStr(PREM.until) + ".");
    const b = el("button", "btn ghost sm", "Zrezygnuj z Premium");
    b.style.marginTop = "10px";
    b.onclick = cancelPrem;
    box.append(line, b);
    const f = el("div", "field");
    f.style.marginTop = "16px";
    f.innerHTML = `<label>Kolor awatara</label>`;
    const shuffle = el("button", "btn sm", "Wylosuj nowy awatar");
    shuffle.onclick = () => {
      PREF.avaShift = String(Date.now() % 9973);
      save(KEY.pref, PREF);
      renderMine(); renderPlayers(true);
      toast("Awatar zmieniony");
    };
    f.append(shuffle);
    box.append(f);
  } else {
    const line = el("p", "note", "Plan podstawowy: 2 ogłoszenia, bez wyróżnienia.");
    const b = el("button", "btn gold sm", "Zobacz Premium");
    b.style.marginTop = "10px";
    b.onclick = () => go("premium");
    box.append(line, b);
  }
}

