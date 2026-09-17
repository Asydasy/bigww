"use strict";

/* BigWW - Widoki: ekipy oraz transmisje live */

/* =========================================================
   9. EKIPY
========================================================= */
function renderTeams() {
  const toks = tokens($("#tSearch").value.trim());
  const list = TEAMS.filter(t => {
    if (!toks.length) return true;
    return searchScore([
      { text: norm(t.name), w: 10 },
      { text: norm(t.game), w: 9 },
      { text: norm(t.style), w: 5 },
      { text: norm(t.region), w: 4 },
      { text: norm(t.time), w: 3 },
      { text: norm(t.desc), w: 2 }
    ], toks) > 0;
  }).sort((a, b) => {
    if (toks.length) {
      const sa = searchScore([{ text: norm(a.name), w: 10 }, { text: norm(a.game), w: 9 }], toks);
      const sb = searchScore([{ text: norm(b.name), w: 10 }, { text: norm(b.game), w: 9 }], toks);
      if (sb !== sa) return sb - sa;
    }
    return b.added - a.added;
  });
  $("#tCount").textContent = `${list.length} ekip z wolnymi miejscami`;
  const box = $("#teamList");
  box.innerHTML = "";
  if (!list.length) {
    box.innerHTML = `<div class="empty" style="grid-column:1/-1"><h3>Żadna ekipa nie pasuje</h3><p>Spróbuj innej nazwy albo gry.</p></div>`;
    return;
  }
  const frag = document.createDocumentFragment();
  list.forEach(t => frag.append(teamCard(t)));
  box.append(frag);
}
$("#tSearch").addEventListener("input", renderTeams);

/* =========================================================
   9b. LIVE
========================================================= */
function liveCard(s) {
  const allowed = canWatchLive(s.id);
  const c = el("article", "card live-card");
  const badge = el("span", "live-badge", "LIVE");
  const prev = el("div", "live-preview" + (allowed ? "" : " locked"));
  prev.style.backgroundImage = s.thumb;
  if (!allowed) {
    const lock = el("div", "live-lock-overlay");
    lock.innerHTML = `<div style="font-size:22px;margin-bottom:6px">🔒</div>
      <b style="color:#fff">Odblokuj stream</b>
      <div class="note" style="color:#ccc;margin-top:4px">Premium lub ${LIVE_TICKET_COST} WW</div>`;
    c.append(lock);
  } else {
    prev.append(el("div", "play", "▶"));
  }
  const body = el("div");
  body.style.padding = "12px 0 0";
  body.append(el("div", "p-nick", s.nick));
  body.append(el("div", "p-meta", s.game + " · " + (PLAT_LABEL[s.plat] || s.plat)));
  body.append(el("p", "p-desc", s.title));
  const foot = el("div", "p-foot");
  foot.append(el("span", "live-viewers", "👁 " + nf(s.viewers) + " · " + ago(s.started)));
  foot.append(el("span", "spacer"));
  const btn = el("button", "btn sm " + (allowed ? "pri" : "gold"), allowed ? "Oglądaj" : "Odblokuj");
  btn.onclick = () => openLive(s);
  foot.append(btn);
  body.append(foot);
  c.append(badge, prev, body);
  c.style.cursor = "pointer";
  c.onclick = e => { if (!e.target.closest("button")) openLive(s); };
  return c;
}

function openLive(s) {
  if (!canWatchLive(s.id)) {
    openModal(`<h3 style="margin-bottom:8px">🔒 Stream zablokowany</h3>
      <p class="note">${s.nick} · ${s.game}</p>
      <p class="note" style="margin-top:10px">Oglądanie Live jest płatne. Wybierz opcję:</p>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:16px">
        <button class="btn gold" id="liveTicket">Bilet na ten stream · ${LIVE_TICKET_COST} WW</button>
        <button class="btn pri" id="livePassBtn">Karnet 24 h na wszystkie Live · 80 WW</button>
        <button class="btn" id="livePrem">Weź Premium (nielimitowane Live)</button>
      </div>
      <p class="note" style="margin-top:12px">Demo — monety są lokalne, nic nie jest pobierane z karty.</p>`);
    $("#liveTicket").onclick = () => {
      if (COINS.bal < LIVE_TICKET_COST) { toast("Za mało monet — kup pakiet w Sklepie"); go("shop"); return; }
      addCoins(-LIVE_TICKET_COST, "Bilet Live");
      LIVETICKETS.push(s.id);
      save(KEY.liveTickets, LIVETICKETS);
      $("#modal").classList.remove("on");
      openLive(s);
      renderLives();
    };
    $("#livePassBtn").onclick = () => {
      if (COINS.bal < 80) { toast("Za mało monet"); go("shop"); return; }
      addCoins(-80, "Karnet Live 24 h");
      LIVEPASS = { until: Date.now() + 24 * HOUR };
      save(KEY.livePass, LIVEPASS);
      $("#modal").classList.remove("on");
      openLive(s);
      renderLives();
    };
    $("#livePrem").onclick = () => { $("#modal").classList.remove("on"); go("premium"); };
    return;
  }
  // unlocked — fake player with animated gradient
  openModal(`<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
      <span class="live-badge">LIVE</span>
      <h3 style="margin:0">${s.nick}</h3>
    </div>
    <p class="note">${s.game} · ${s.title}</p>
    <div class="embed-box" style="background:linear-gradient(120deg,#1a1a2e,#0f3460,#e94560);display:grid;place-items:center">
      <div style="position:absolute;inset:0;display:grid;place-items:center;color:#fff;text-align:center;padding:20px">
        <div>
          <div style="font-size:40px;margin-bottom:8px">📡</div>
          <b>Stream demo</b>
          <p style="opacity:.8;margin-top:6px;font-size:13px">W prawdziwej wersji tutaj byłby odtwarzacz Twitch/YouTube Live.<br>Widzów: ${nf(s.viewers)}</p>
        </div>
      </div>
    </div>
    <div class="kv" style="margin-top:12px"><span>Region</span><b>${s.region}</b></div>
    <div class="kv"><span>Platforma</span><b>${PLAT_LABEL[s.plat] || s.plat}</b></div>
    <button class="btn pri sm" id="liveMsg" style="margin-top:12px">Napisz do streamera</button>`);
  $("#liveMsg").onclick = () => {
    const pl = allPlayers().find(p => p.id === s.playerId) || { id: s.playerId, nick: s.nick, game: s.game, region: s.region, time: "Wieczorami", mic: "Mikrofon: tak", rating: "4.5", status: "on", tags: [], desc: s.title, age: 20, lang: "PL", plat: s.plat, hours: 100, added: Date.now() };
    $("#modal").classList.remove("on");
    showContact(pl);
  };
}

function renderLives() {
  const toks = tokens(($("#lSearch") && $("#lSearch").value) || "");
  const sort = ($("#lSort") && $("#lSort").value) || "viewers";
  let list = LIVES.filter(s => {
    if (!toks.length) return true;
    return searchScore([
      { text: norm(s.nick), w: 10 },
      { text: norm(s.game), w: 9 },
      { text: norm(s.title), w: 6 },
      { text: norm(s.region), w: 3 }
    ], toks) > 0;
  });
  if (toks.length) {
    list.sort((a, b) => {
      const sa = searchScore([{ text: norm(a.nick), w: 10 }, { text: norm(a.game), w: 9 }, { text: norm(a.title), w: 6 }], toks);
      const sb = searchScore([{ text: norm(b.nick), w: 10 }, { text: norm(b.game), w: 9 }, { text: norm(b.title), w: 6 }], toks);
      return sb - sa || b.viewers - a.viewers;
    });
  } else if (sort === "viewers") list.sort((a, b) => b.viewers - a.viewers);
  else list.sort((a, b) => b.started - a.started);
  const box = $("#liveList");
  if (!box) return;
  box.innerHTML = "";
  $("#lCount").textContent = list.length + " streamów na żywo";
  const hint = $("#lAccessHint");
  if (hint) {
    if (isPrem()) hint.textContent = "Premium: pełny dostęp";
    else if (LIVEPASS.until > Date.now()) hint.textContent = "Karnet aktywny do " + new Date(LIVEPASS.until).toLocaleString("pl-PL");
    else hint.textContent = "Darmowy podgląd zablokowany — odblokuj bilet lub Premium";
  }
  const frag = document.createDocumentFragment();
  list.forEach(s => frag.append(liveCard(s)));
  box.append(frag);
}
if ($("#lSearch")) $("#lSearch").addEventListener("input", renderLives);
if ($("#lSort")) $("#lSort").addEventListener("change", renderLives);
