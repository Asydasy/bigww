"use strict";

/* BigWW - Monety WW, sklep, zadania, battle pass, reklamy, polecenia */

/* =========================================================
   12b. MONETYZACJA MAX — monety, limity, interstitial, BP, pakiety
========================================================= */
const AD_REWARD = 15;
const AD_COOLDOWN_MS = 45000;
const DAILY_AD_CAP = 12;
const REF_BONUS = 50;
const BOOST_OPTS = [
  { hours: 6, cost: 25, label: "6 godzin" },
  { hours: 24, cost: 60, label: "24 godziny" },
  { hours: 72, cost: 140, label: "3 dni" }
];
const SHOP_ITEMS = [
  { id: "boost6", name: "Wypromowanie 6 h", desc: "Jedno ogłoszenie na górze wyników", cost: 25, ico: "⬆" },
  { id: "boost24", name: "Wypromowanie 24 h", desc: "Cały dzień na szczycie listy", cost: 60, ico: "⬆" },
  { id: "extra_ad", name: "Dodatkowy slot ogłoszenia", desc: "Tymczasowo +1 do limitu (7 dni)", cost: 80, ico: "＋" },
  { id: "avatar", name: "Nowy awatar", desc: "Wylosuj unikalny kolor i wzór", cost: 10, ico: "◈" },
  { id: "unlock_5", name: "Pakiet 5 kontaktów", desc: "Odblokuj 5 kontaktów naraz", cost: 70, ico: "🔓" }
];
const COIN_PACKS = [
  { id: "p100", coins: 100, price: "9,99 zł", bonus: 0, hot: false },
  { id: "p500", coins: 500, price: "39,99 zł", bonus: 100, hot: true },
  { id: "p1500", coins: 1500, price: "99 zł", bonus: 500, hot: false },
  { id: "pStarter", coins: 200, price: "14,99 zł", bonus: 50, hot: true, label: "Start + Premium 3 dni" }
];
const BP_REWARDS = [
  { lvl: 1, reward: 10, label: "10 WW" },
  { lvl: 2, reward: 15, label: "15 WW" },
  { lvl: 3, reward: 0, label: "Boost 6h", boost: 6 },
  { lvl: 4, reward: 25, label: "25 WW" },
  { lvl: 5, reward: 0, label: "Boost 24h", boost: 24 },
  { lvl: 6, reward: 40, label: "40 WW" },
  { lvl: 7, reward: 50, label: "50 WW" },
  { lvl: 8, reward: 0, label: "Slot +1", slot: true },
  { lvl: 9, reward: 80, label: "80 WW" },
  { lvl: 10, reward: 150, label: "150 WW + PROMO" }
];
const QUEST_DEFS = [
  { id: "ad", ico: "▶", name: "Obejrzyj 2 reklamy", need: 2, reward: 10 },
  { id: "msg", ico: "✉", name: "Napisz do 1 gracza", need: 1, reward: 8 },
  { id: "boost", ico: "⬆", name: "Wypromuj ogłoszenie", need: 1, reward: 15 },
  { id: "post", ico: "＋", name: "Dodaj / edytuj ogłoszenie", need: 1, reward: 12 }
];

function resetDailyIfNeeded() {
  const t = todayKey();
  if (ADLOG.day !== t) {
    ADLOG.day = t;
    ADLOG.daily = 0;
    save(KEY.adlog, ADLOG);
  }
  if (QUESTS.day !== t) {
    QUESTS.day = t;
    QUESTS.done = {};
    save(KEY.quests, QUESTS);
  }
}

function addCoins(n, reason) {
  COINS.bal += n;
  if (n > 0) COINS.earned += n;
  else COINS.spent += -n;
  save(KEY.coins, COINS);
  updateCoinUI();
  if (reason) toast(reason);
}

function updateCoinUI() {
  const n = COINS.bal;
  if ($("#coinNum")) $("#coinNum").textContent = nf(n);
  if ($("#shopCoinBig")) $("#shopCoinBig").textContent = nf(n);
  if ($("#nb-coins")) $("#nb-coins").textContent = n > 0 ? nf(n) : "";
}

function addXP(amount) {
  BP.xp += amount;
  while (BP.xp >= BP_XP_PER_LEVEL && BP.level < BP_MAX) {
    BP.xp -= BP_XP_PER_LEVEL;
    BP.level++;
    toast("Battle Pass: poziom " + BP.level + "!");
  }
  if (BP.level >= BP_MAX) BP.xp = Math.min(BP.xp, BP_XP_PER_LEVEL - 1);
  save(KEY.bp, BP);
}

function progressQuest(id) {
  resetDailyIfNeeded();
  const q = QUEST_DEFS.find(x => x.id === id);
  if (!q) return;
  const cur = QUESTS.done[id] || { prog: 0, claimed: false };
  if (cur.claimed) return;
  cur.prog = Math.min(q.need, (cur.prog || 0) + 1);
  QUESTS.done[id] = cur;
  save(KEY.quests, QUESTS);
  if (cur.prog >= q.need && !cur.claimed) {
    // auto-ready to claim in UI
  }
}

function claimQuest(id) {
  resetDailyIfNeeded();
  const q = QUEST_DEFS.find(x => x.id === id);
  const cur = QUESTS.done[id] || { prog: 0, claimed: false };
  if (cur.claimed || cur.prog < q.need) return;
  cur.claimed = true;
  QUESTS.done[id] = cur;
  save(KEY.quests, QUESTS);
  addCoins(q.reward, "+" + q.reward + " WW za zadanie");
  addXP(25);
  renderShop();
}

function canWatchAd() {
  resetDailyIfNeeded();
  if (ADLOG.daily >= DAILY_AD_CAP) return "Dzienny limit reklam wyczerpany (" + DAILY_AD_CAP + "). Wróć jutro.";
  const left = AD_COOLDOWN_MS - (Date.now() - ADLOG.lastWatch);
  if (left > 0) return "Poczekaj jeszcze " + Math.ceil(left / 1000) + " s";
  return null;
}

function watchAd() {
  const err = canWatchAd();
  if (err) { toast(err); return; }

  openModal(`<h3 style="margin-bottom:8px">Reklama za nagrodę</h3>
    <p class="note">Obejrzyj krótką reklamę partnera, żeby dostać ${AD_REWARD} WW. To symulacja — nic nie jest wysyłane.</p>
    <div class="ad-sim" id="adSim">
      <div style="font-size:13px;color:var(--txt-faint)">Reklama · sponsorowane</div>
      <div class="ad-title" style="margin:10px 0 4px">🔥 Gamingowa klawiatura mechaniczna</div>
      <div class="ad-sub">Oferta partnera BigWW</div>
      <div class="timer" id="adTimer">5</div>
      <p class="note">Nie zamykaj okna, aż timer dojdzie do zera.</p>
    </div>`);

  let sec = 5;
  const timer = $("#adTimer");
  const tick = setInterval(() => {
    sec--;
    if (timer) timer.textContent = sec;
    if (sec <= 0) {
      clearInterval(tick);
      ADLOG.lastWatch = Date.now();
      ADLOG.daily = (ADLOG.daily || 0) + 1;
      save(KEY.adlog, ADLOG);
      addCoins(AD_REWARD, "+" + AD_REWARD + " WW za obejrzenie reklamy");
      addXP(15);
      progressQuest("ad");
      $("#modalBox").innerHTML = `<div style="text-align:center">
        <div style="font-size:36px">◎</div>
        <h3 style="margin:10px 0 6px">+${AD_REWARD} WW</h3>
        <p class="note">Monety dodane do salda. Możesz obejrzeć kolejną za chwilę.</p>
        <p class="note" style="margin-top:8px">Dziś: ${ADLOG.daily}/${DAILY_AD_CAP} reklam</p></div>`;
      const ok = el("button", "btn pri", "Zamknij");
      ok.style.marginTop = "16px";
      ok.onclick = () => $("#modal").classList.remove("on");
      $("#modalBox").append(ok);
      renderShop();
    }
  }, 1000);
}

function buyBoost(adId, hours, cost) {
  if (COINS.bal < cost) { toast("Za mało monet WW"); return; }
  if (!MINE.find(m => m.id === adId)) { toast("Ogłoszenie nie istnieje"); return; }
  addCoins(-cost);
  const until = Math.max(BOOSTS[adId] || 0, Date.now()) + hours * HOUR;
  BOOSTS[adId] = until;
  save(KEY.boosts, BOOSTS);
  progressQuest("boost");
  addXP(20);
  toast("Ogłoszenie wypromowane na " + hours + " h");
  renderMine();
  renderPlayers(true);
  renderShop();
  renderHome();
}

function applyReferral() {
  const code = ($("#refInput").value || "").trim().toUpperCase();
  if (!code) { toast("Wpisz kod"); return; }
  if (code === REF.code) { toast("Nie możesz użyć własnego kodu"); return; }
  if (REF.applied) { toast("Kod polecający możesz użyć tylko raz"); return; }
  if (REF.used.includes(code)) { toast("Ten kod już był użyty"); return; }
  if (!/^BIG-[A-Z0-9]{4}$/.test(code)) {
    toast("Nieprawidłowy format kodu (np. BIG-AB12)");
    return;
  }
  REF.applied = true;
  REF.used.push(code);
  REF.count += 1;
  REF.earned += REF_BONUS;
  save(KEY.ref, REF);
  addCoins(REF_BONUS, "+" + REF_BONUS + " WW za kod polecający");
  addXP(30);
  $("#refStatus").textContent = "Kod aktywowany! Otrzymałeś " + REF_BONUS + " WW.";
  renderShop();
}

function buyCoinPack(pack) {
  openModal(`<h3 style="margin-bottom:4px">Pakiet ${pack.coins + (pack.bonus || 0)} WW</h3>
    <p class="note" style="margin-bottom:16px">${pack.price} · demonstracyjna płatność</p>
    <div class="demo-note" style="margin-bottom:14px">Wersja demonstracyjna. Formularz nie łączy się z operatorem — wpisz dowolne dane testowe.</div>
    <div class="pay">
      <div class="field"><label>Imię i nazwisko</label><input type="text" id="pkName" placeholder="Jan Kowalski" autocomplete="off"></div>
      <div class="field"><label>Numer karty</label><input type="text" id="pkNum" inputmode="numeric" placeholder="4242 4242 4242 4242" autocomplete="off"></div>
      <div class="row">
        <div class="field"><label>Ważna do</label><input type="text" id="pkExp" placeholder="12/29" autocomplete="off"></div>
        <div class="field"><label>CVC</label><input type="text" id="pkCvc" placeholder="123" autocomplete="off"></div>
      </div>
      <button class="btn gold" id="pkPay">Zapłać ${pack.price}</button>
      <button class="btn ghost sm" id="pkFill">Dane testowe</button>
    </div>`);
  const num = $("#pkNum"), exp = $("#pkExp"), cvc = $("#pkCvc");
  num.oninput = () => { num.value = num.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim(); };
  exp.oninput = () => { let v = exp.value.replace(/\D/g, "").slice(0, 4); exp.value = v.length > 2 ? v.slice(0, 2) + "/" + v.slice(2) : v; };
  cvc.oninput = () => cvc.value = cvc.value.replace(/\D/g, "").slice(0, 4);
  $("#pkFill").onclick = () => { $("#pkName").value = "Jan Testowy"; num.value = "4242 4242 4242 4242"; exp.value = "12/29"; cvc.value = "123"; };
  $("#pkPay").onclick = () => {
    if ($("#pkName").value.trim().length < 3) return toast("Wpisz imię");
    if (num.value.replace(/\s/g, "").length < 12) return toast("Numer karty za krótki");
    $("#modalBox").innerHTML = `<div class="spin"></div><p style="text-align:center;color:var(--txt-dim)">Przetwarzanie…</p>`;
    setTimeout(() => {
      const total = pack.coins + (pack.bonus || 0);
      addCoins(total, "+" + total + " WW z pakietu");
      if (pack.id === "pStarter" && !isPrem()) {
        PREM = { active: true, plan: "month", since: Date.now(), until: Date.now() + 3 * 24 * HOUR };
        save(KEY.prem, PREM);
        refreshPrem();
        toast("Premium na 3 dni aktywowane");
      }
      $("#modalBox").innerHTML = `<div style="text-align:center">
        <div style="font-size:40px">◎</div>
        <h3 style="margin:10px 0 6px">+${total} WW</h3>
        <p class="note">Żadna płatność nie została pobrana — to demo.</p></div>`;
      const ok = el("button", "btn gold", "Zamknij");
      ok.style.marginTop = "16px";
      ok.onclick = () => $("#modal").classList.remove("on");
      $("#modalBox").append(ok);
      renderShop();
    }, 1100);
  };
}

function claimBpLevel(lvl) {
  if (BP.level < lvl) return;
  if ((BP.claimed || []).includes(lvl)) return;
  const r = BP_REWARDS.find(x => x.lvl === lvl);
  if (!r) return;
  BP.claimed = BP.claimed || [];
  BP.claimed.push(lvl);
  save(KEY.bp, BP);
  if (r.reward) addCoins(r.reward, "+" + r.reward + " WW z Battle Pass");
  if (r.boost && MINE.length) {
    const id = MINE[0].id;
    BOOSTS[id] = Math.max(BOOSTS[id] || 0, Date.now()) + r.boost * HOUR;
    save(KEY.boosts, BOOSTS);
    toast("Boost " + r.boost + " h z Battle Pass");
  }
  if (r.slot) {
    localStorage.setItem("bigww_extra_slot", String(Date.now() + 7 * 24 * HOUR));
    toast("+1 slot ogłoszenia na 7 dni");
  }
  if (lvl === 10) addCoins(0); // already gave 150
  renderShop();
  renderMine();
}

function renderShop() {
  cleanBoosts();
  resetDailyIfNeeded();
  updateCoinUI();
  if ($("#refCode")) $("#refCode").textContent = REF.code;
  if ($("#refCount")) $("#refCount").textContent = REF.count;
  if ($("#refEarned")) $("#refEarned").textContent = REF.earned + " WW";
  if ($("#refStatus") && REF.applied) $("#refStatus").textContent = "Kod polecający już wykorzystany.";

  // packs
  const pg = $("#packGrid");
  if (pg) {
    pg.innerHTML = "";
    COIN_PACKS.forEach(p => {
      const d = el("div", "pack" + (p.hot ? " hot" : ""));
      const total = p.coins + (p.bonus || 0);
      d.innerHTML = `<div class="amt">${total} WW</div>
        <div class="plab">${p.bonus ? p.coins + " + " + p.bonus + " bonus" : (p.label || "Pakiet monet")}</div>
        <div class="pprice">${p.price}</div>`;
      d.onclick = () => buyCoinPack(p);
      pg.append(d);
    });
  }

  // battle pass
  if ($("#bpLevelLab")) $("#bpLevelLab").textContent = "Poziom " + BP.level + " · " + BP.xp + "/" + BP_XP_PER_LEVEL + " XP";
  const track = $("#bpTrack");
  if (track) {
    track.innerHTML = "";
    BP_REWARDS.forEach(r => {
      const n = el("div", "bp-node");
      n.textContent = r.lvl;
      n.title = r.label;
      if ((BP.claimed || []).includes(r.lvl)) n.classList.add("done");
      else if (BP.level >= r.lvl) {
        n.classList.add("claim");
        n.textContent = "✓";
        n.onclick = () => claimBpLevel(r.lvl);
      }
      track.append(n);
    });
  }
  if ($("#bpBuyLevels")) {
    $("#bpBuyLevels").onclick = () => {
      openModal(`<h3 style="margin-bottom:8px">Dokup poziomy Battle Pass</h3>
        <p class="note">1 poziom = 40 WW. Od razu odblokowujesz nagrodę.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">
          <button class="btn gold" id="bp1">+1 poziom (40 WW)</button>
          <button class="btn gold" id="bp5">+5 poziomów (180 WW)</button>
        </div>`);
      $("#bp1").onclick = () => {
        if (COINS.bal < 40) return toast("Za mało monet");
        if (BP.level >= BP_MAX) return toast("Maksymalny poziom");
        addCoins(-40);
        BP.level++;
        BP.xp = 0;
        save(KEY.bp, BP);
        toast("Poziom " + BP.level);
        $("#modal").classList.remove("on");
        renderShop();
      };
      $("#bp5").onclick = () => {
        if (COINS.bal < 180) return toast("Za mało monet");
        addCoins(-180);
        BP.level = Math.min(BP_MAX, BP.level + 5);
        BP.xp = 0;
        save(KEY.bp, BP);
        toast("Poziom " + BP.level);
        $("#modal").classList.remove("on");
        renderShop();
      };
    };
  }

  // quests
  const qp = $("#questPanel");
  if (qp) {
    qp.innerHTML = "";
    QUEST_DEFS.forEach(q => {
      const cur = QUESTS.done[q.id] || { prog: 0, claimed: false };
      const row = el("div", "quest");
      row.append(el("div", "qico", q.ico));
      const info = el("div", "qinfo");
      info.append(el("div", null, q.name));
      info.append(el("div", "qprog", Math.min(cur.prog, q.need) + "/" + q.need + " · nagroda " + q.reward + " WW"));
      row.append(info);
      if (cur.claimed) {
        row.append(el("span", "note", "Odebrane"));
      } else if (cur.prog >= q.need) {
        const b = el("button", "btn sm gold", "Odbierz");
        b.onclick = () => claimQuest(q.id);
        row.append(b);
      } else {
        row.append(el("span", "note", "W toku"));
      }
      qp.append(row);
    });
  }

  // earn cards
  const eg = $("#earnGrid");
  if (eg) {
    eg.innerHTML = "";
    const cards = [
      { title: "Reklama za nagrodę", reward: "+" + AD_REWARD + " WW", desc: "Obejrzyj 5-sekundową reklamę. Limit " + DAILY_AD_CAP + "/dzień.", action: "Obejrzyj", fn: watchAd },
      { title: "Program polecający", reward: "+" + REF_BONUS + " WW", desc: "Za każdego znajomego z Twoim kodem.", action: "Zobacz kod", fn: () => document.getElementById("refCode")?.scrollIntoView({ behavior: "smooth" }) },
      { title: "Codzienna aktywność", reward: "+5 WW", desc: "Bonus za pierwsze logowanie dnia.", action: "Odbierz", fn: claimDaily }
    ];
    cards.forEach(c => {
      const card = el("div", "earn-card");
      card.append(el("h4", null, c.title));
      card.append(el("div", "reward", c.reward));
      card.append(el("p", "note", c.desc));
      const b = el("button", "btn sm", c.action);
      b.onclick = c.fn;
      card.append(b);
      eg.append(card);
    });
  }

  // boost list
  const bl = $("#boostList");
  if (bl) {
    bl.innerHTML = "";
    if (!MINE.length) {
      bl.innerHTML = `<p class="note">Nie masz jeszcze ogłoszeń. <a data-go="add" style="color:var(--acc);cursor:pointer">Dodaj jedno</a>, żeby je wypromować.</p>`;
    } else {
      MINE.forEach(p => {
        const row = el("div", "shop-item");
        const info = el("div", "info");
        info.append(el("div", null, p.nick + " · " + p.game));
        const until = BOOSTS[p.id];
        if (until && until > Date.now()) {
          info.append(el("div", "note", "Wypromowane do " + new Date(until).toLocaleString("pl-PL")));
        } else {
          info.append(el("div", "note", "Brak aktywnej promocji"));
        }
        row.append(el("div", "ico", "⬆"), info);
        const actions = el("div");
        actions.style.display = "flex";
        actions.style.gap = "6px";
        actions.style.flexWrap = "wrap";
        BOOST_OPTS.forEach(o => {
          const b = el("button", "btn sm", o.label + " · " + o.cost + " WW");
          b.onclick = () => buyBoost(p.id, o.hours, o.cost);
          actions.append(b);
        });
        row.append(actions);
        bl.append(row);
      });
    }
  }

  // coin shop
  const cs = $("#coinShop");
  if (cs) {
    cs.innerHTML = "";
    SHOP_ITEMS.forEach(it => {
      const row = el("div", "shop-item");
      row.append(el("div", "ico", it.ico));
      const info = el("div", "info");
      info.append(el("div", null, it.name));
      info.append(el("div", "note", it.desc));
      row.append(info);
      const price = el("div", "price", it.cost + " WW");
      const buy = el("button", "btn sm", "Kup");
      buy.onclick = () => shopBuy(it);
      const right = el("div");
      right.style.display = "flex";
      right.style.alignItems = "center";
      right.style.gap = "10px";
      right.append(price, buy);
      row.append(right);
      cs.append(row);
    });
  }
}

function claimDaily() {
  const key = "daily_" + todayKey();
  if (localStorage.getItem(key)) {
    toast("Dzisiejszy bonus już odebrany");
    return;
  }
  localStorage.setItem(key, "1");
  addCoins(5, "+5 WW za dzienną aktywność");
  addXP(10);
  renderShop();
}

function shopBuy(it) {
  if (COINS.bal < it.cost) { toast("Za mało monet WW"); return; }
  if (it.id === "avatar") {
    addCoins(-it.cost);
    PREF.avaShift = String(Date.now() % 9973);
    save(KEY.pref, PREF);
    renderMine(); renderPlayers(true);
    toast("Awatar zmieniony");
    return;
  }
  if (it.id === "extra_ad") {
    addCoins(-it.cost);
    localStorage.setItem("bigww_extra_slot", String(Date.now() + 7 * 24 * HOUR));
    toast("+1 slot ogłoszenia na 7 dni");
    return;
  }
  if (it.id === "unlock_5") {
    addCoins(-it.cost);
    // unlock 5 random locked from recent view — just grant credit
    toast("Pakiet 5 odblokowań — kolejne kontakty tańsze (symulacja)");
    // reduce next unlocks conceptually by adding 5 free unlock credits
    const cred = Number(localStorage.getItem("bigww_unlock_cred") || 0) + 5;
    localStorage.setItem("bigww_unlock_cred", String(cred));
    return;
  }
  if (it.id.startsWith("boost")) {
    if (!MINE.length) { toast("Najpierw dodaj ogłoszenie"); return; }
    const hours = it.id === "boost6" ? 6 : 24;
    buyBoost(MINE[0].id, hours, it.cost);
    return;
  }
}

function updateBadges() {
  $("#nb-players").textContent = nf(allPlayers().length);
  $("#nb-games").textContent = nf(GAMES.length);
  $("#nb-teams").textContent = TEAMS.length;
  if ($("#nb-live")) $("#nb-live").textContent = LIVES.length;
  $("#nb-mine").textContent = MINE.length || "";
  $("#nb-saved").textContent = SAVED.length || "";
  $("#nb-prem").textContent = isPrem() ? (isPro() ? "PRO" : "aktywne") : "";
  updateCoinUI();
}

/* interstitial every N navigations */
const INTER_EVERY = 4;
const INTER_ADS = [
  { title: "Nowa myszka gamingowa −40%", sub: "Oferta partnera · tylko dziś" },
  { title: "Energy drink dla graczy", sub: "Zamów z darmową dostawą" },
  { title: "Kurs aim-botless — popraw celność", sub: "Sponsorowane szkolenie" },
  { title: "Serwer VPS od 12 zł/mies.", sub: "Hostuj swój klan" }
];
function maybeShowInterstitial() {
  if (isPrem()) return;
  NAVCOUNT++;
  save(KEY.navcount, NAVCOUNT);
  if (NAVCOUNT % INTER_EVERY !== 0) return;
  const ad = INTER_ADS[Math.floor(Math.random() * INTER_ADS.length)];
  const box = $("#interstitial");
  if (!box) return;
  $("#interTitle").textContent = ad.title;
  $("#interSub").textContent = ad.sub;
  const skip = $("#interSkip");
  skip.textContent = "Pomiń za 5…";
  skip.classList.remove("ready");
  skip.onclick = null;
  box.classList.add("on");
  let s = 5;
  const t = setInterval(() => {
    s--;
    if (s > 0) skip.textContent = "Pomiń za " + s + "…";
    else {
      clearInterval(t);
      skip.textContent = "Pomiń";
      skip.classList.add("ready");
      skip.onclick = () => box.classList.remove("on");
    }
  }, 1000);
  $("#interCta").onclick = () => {
    box.classList.remove("on");
    toast("To demonstracyjna reklama partnera");
  };
}

// sponsored slot in player list
function sponsoredCard() {
  const c = el("article", "card sponsored-card");
  c.innerHTML = `<span class="sponsored-badge">SPONSOROWANE</span>
    <div class="p-top">
      <div class="ava" style="background:linear-gradient(135deg,#7c5cff,#2ee6a8)"></div>
      <div>
        <div class="p-nick">GameForge Partner</div>
        <div class="p-meta">Oficjalny partner · PC</div>
      </div>
    </div>
    <div class="p-game"><b>Wyróżniona gra sezonu</b><span>Reklama</span></div>
    <p class="p-desc">Dołącz do oficjalnego turnieju i wygraj sprzęt gamingowy. Kliknij, aby zobaczyć szczegóły oferty partnera.</p>
    <div class="p-foot"><button class="btn sm pri" id="sponCta">Zobacz ofertę</button></div>`;
  setTimeout(() => {
    const b = c.querySelector("#sponCta");
    if (b) b.onclick = () => openModal(`<h3>Oferta sponsora</h3><p class="note" style="margin-top:10px">Demonstracyjny slot reklamowy na górze listy. W prawdziwym serwisie sprzedawany wydawcom gier i sklepom.</p>`);
  }, 0);
  return c;
}

/** Wstawia kartę sponsorowaną na górę listy graczy. Wołane z renderPlayers(). */
function addSponsoredSlot() {
  const box = $("#playerList");
  if (box && box.children.length && !box.querySelector(".sponsored-card")) {
    box.insertBefore(sponsoredCard(), box.firstChild);
  }
}

// ad banner clicks
document.addEventListener("click", e => {
  const ad = e.target.closest(".ad-banner");
  if (ad) {
    openModal(`<h3 style="margin-bottom:8px">Reklama partnera</h3>
      <p class="note">To demonstracyjny baner reklamowy. W prawdziwym serwisie tutaj otworzyłby się landing partnera lub sieć reklamowa.</p>
      <p class="note" style="margin-top:10px">Żadne dane nie są wysyłane — wszystko działa lokalnie w przeglądarce.</p>
      <button class="btn pri" id="adClose" style="margin-top:16px">Zamknij</button>`);
    $("#adClose").onclick = () => $("#modal").classList.remove("on");
  }
});
