"use strict";

/* BigWW - Karty gracza/gry/ekipy, profil, kontakt, modale, media */

/* =========================================================
   6. KARTY
========================================================= */
function playerCard(p) {
  const c = el("article", "card");

  const isPremCard = p.mine ? isPrem() : !!p.prem;
  const boosted = p.boosted || isBoosted(p.id);
  if (isPremCard) c.classList.add("prem");
  if (boosted) c.classList.add("boosted");

  const top = el("div", "p-top");
  const av = el("div", "ava");
  av.style.backgroundImage = avatarArt(p.nick, p.mine ? PREF.avaShift : "");
  const info = el("div");
  const nick = el("div", "p-nick");
  const dot = el("span", "status-dot " + (p.status === "on" ? "s-on" : p.status === "idle" ? "s-idle" : "s-off"));
  dot.title = p.status === "on" ? "online" : p.status === "idle" ? "zaraz wraca" : "offline";
  const nickText = el("span", "nick-link", p.nick);
  nickText.onclick = e => { e.stopPropagation(); openProfile(p); };
  nick.append(dot, nickText);
  if (boosted) nick.append(el("span", "badge-boost", "PROMO"));
  if (isPremCard) nick.append(el("span", "badge-prem", "PREMIUM"));
  if (p.mine) nick.append(el("span", "tag acc", "Twoje"));
  if (p.mine && PREF.looking) nick.append(el("span", "tag acc", "szukam teraz"));
  const meta = el("div", "p-meta", `${p.age} lat · ${p.region} · ${p.lang}`);
  info.append(nick, meta);
  top.append(av, info);
  av.style.cursor = "pointer";
  av.onclick = () => openProfile(p);

  const gameRow = el("div", "p-game");
  const gname = el("b", null, p.game);
  const gmeta = el("span", null, `${PLAT_LABEL[p.plat] || p.plat} · ${p.hours ? nf(p.hours) + " h" : "nowy"}`);
  gameRow.append(gname, gmeta);

  const desc = el("p", "p-desc", p.desc);

  const tags = el("div", "tags");
  [p.style, p.time, p.mic].forEach(t => tags.append(el("span", "tag acc", t)));
  (p.tags || []).forEach(t => tags.append(el("span", "tag", t)));
  if (p.clipUrl || p.fileData) tags.append(el("span", "tag", p.fileType && p.fileType.startsWith("video") ? "🎬 klip" : p.clipUrl ? "▶ wideo" : "🖼 screen"));

  const foot = el("div", "p-foot");
  const msg = el("button", "btn sm pri", canSeeContact(p) ? "Napisz" : "🔒 Kontakt");
  msg.onclick = () => showContact(p);
  const star = el("button", "btn sm", DATA.isSaved(p.id) ? "★ Obserwujesz" : "☆ Obserwuj");
  star.onclick = async () => {
    star.disabled = true;
    try {
      const on = await toggleSave(p.id);
      star.textContent = on ? "★ Obserwujesz" : "☆ Obserwuj";
    } catch (e) {
      if (e.status === 401) requireLogin("obserwować graczy");
      else toast(e.message || "Nie udało się zapisać");
    }
    star.disabled = false;
  };
  const when = el("span", "note", ago(p.added));
  foot.append(msg, star, el("span", "spacer"), when);
  if (!p.mine && !isPrem()) {
    const left = msgsLeft();
    if (left < FREE_MSG_LIMIT) {
      const lim = el("div", "msg-limit");
      lim.style.width = "100%";
      lim.style.marginTop = "6px";
      lim.textContent = left > 0 ? "Darmowe wiadomości dziś: " + left + "/" + FREE_MSG_LIMIT : "Limit darmowych wiadomości wyczerpany — Premium lub monety";
      foot.append(lim);
    }
  }

  c.append(top, gameRow, desc, tags);
  const mediaEl = mediaThumb(p);
  if (mediaEl) c.append(mediaEl);
  c.append(foot);

  if (p.mine) {
    const row = el("div");
    row.style.display = "flex";
    row.style.gap = "8px";
    row.style.marginTop = "10px";
    row.style.flexWrap = "wrap";
    const prom = el("button", "btn sm gold", isBoosted(p.id) ? "Wypromowane" : "Wypromuj (WW)");
    prom.onclick = () => {
      go("shop");
      setTimeout(() => document.getElementById("boostPanel")?.scrollIntoView({ behavior: "smooth" }), 100);
    };
    const del = el("button", "btn sm ghost", "Usuń");
    del.onclick = async () => {
      del.disabled = true;
      try {
        await DATA.deleteAd(p.id);
      } catch (e) {
        del.disabled = false;
        toast(e.message || "Nie udało się usunąć");
        return;
      }
      toast("Ogłoszenie usunięte");
      renderMine(); renderPlayers(true); updateBadges();
    };
    row.append(prom, del);
    c.append(row);
  }
  return c;
}

function gameCard(g) {
  const count = DATA.adsForGame(g.name);
  const b = el("button", "gcard");
  const cover = el("div", "cover");
  cover.style.backgroundImage = coverArt(g);
  cover.append(el("span", null, g.name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase()));
  const body = el("div", "body");
  body.append(el("div", "gname", g.name));
  const meta = el("div", "gmeta");
  meta.append(el("span", null, `${g.genre} · ${g.mode}`), el("span", "cnt", graczy(count)));
  body.append(meta);
  b.append(cover, body);
  b.onclick = () => {
    $("#fGame").value = g.name;
    $("#pSearch").value = "";
    go("players");
    renderPlayers(true);
    toast("Filtruję po: " + g.name);
  };
  return b;
}

function teamCard(t) {
  const c = el("article", "card");
  const top = el("div", "p-top");
  const av = el("div", "ava");
  av.style.backgroundImage = avatarArt(t.name + t.game);
  const info = el("div");
  info.append(el("div", "p-nick", t.name), el("div", "p-meta", `${t.game} · ${t.region}`));
  top.append(av, info);

  const slots = el("div", "slots");
  for (let i = 0; i < t.size; i++) slots.append(el("div", "slot" + (i < t.filled ? " f" : "")));

  const line = el("div", "p-meta");
  line.style.marginTop = "8px";
  line.textContent = `${t.filled}/${t.size} miejsc zajętych · brakuje ${t.size - t.filled}`;

  const desc = el("p", "p-desc", t.desc);
  const tags = el("div", "tags");
  [t.style, t.time, t.minAge ? "od " + t.minAge + " lat" : "każdy wiek"].forEach(x => tags.append(el("span", "tag acc", x)));

  const foot = el("div", "p-foot");
  const join = el("button", "btn sm pri", "Dołącz do ekipy");
  join.onclick = () => openModal(`<h3 style="margin-bottom:12px">${t.name}</h3>
    <div class="kv"><span>Gra</span><b>${t.game}</b></div>
    <div class="kv"><span>Skład</span><b>${t.filled}/${t.size}</b></div>
    <div class="kv"><span>Region</span><b>${t.region}</b></div>
    <div class="kv"><span>Styl</span><b>${t.style}</b></div>
    <p class="note" style="margin-top:14px">To baza demonstracyjna, więc zgłoszenie nigdzie nie wychodzi. W prawdziwej wersji tutaj poszłaby wiadomość do lidera ekipy.</p>`);
  foot.append(join, el("span", "spacer"), el("span", "note", ago(t.added)));

  c.append(top, slots, line, desc, tags, foot);
  return c;
}

let countCache = null;
function countFor(gameName) {
  if (!countCache) {
    countCache = {};
    allPlayers().forEach(p => countCache[p.game] = (countCache[p.game] || 0) + 1);
  }
  return countCache[gameName] || 0;
}

function contactStr(p) {
  return p.contact || "discord: " + p.nick.toLowerCase() + "#" + (1000 + (p.nick.length * 137) % 8999);
}

function parseClipEmbed(url) {
  if (!url) return null;
  const u = url.trim();
  let m = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/i);
  if (m) return { type: "youtube", id: m[1], embed: "https://www.youtube.com/embed/" + m[1] };
  m = u.match(/twitch\.tv\/([\w]+)/i);
  if (m) return { type: "twitch", id: m[1], embed: "https://player.twitch.tv/?channel=" + m[1] + "&parent=" + location.hostname + "&muted=true" };
  m = u.match(/medal\.tv\/(?:games\/[\w-]+\/clips\/|clips\/)([\w-]+)/i);
  if (m) return { type: "medal", id: m[1], embed: u };
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(u)) return { type: "video", id: u, embed: u };
  return { type: "link", id: u, embed: null };
}

function mediaThumb(p) {
  if (!p.clipUrl && !p.fileData) return null;
  const wrap = el("div", "media-thumb");
  if (p.fileData && p.fileType && p.fileType.startsWith("image")) {
    const img = el("img");
    img.src = p.fileData;
    img.alt = "screen";
    wrap.append(img);
    wrap.append(el("span", "mlabel", "screen"));
  } else if (p.fileData && p.fileType && p.fileType.startsWith("video")) {
    const v = document.createElement("video");
    v.src = p.fileData;
    v.muted = true;
    wrap.append(v);
    wrap.append(el("div", "play", "▶"));
    wrap.append(el("span", "mlabel", "klip"));
  } else if (p.clipUrl) {
    const parsed = parseClipEmbed(p.clipUrl);
    wrap.style.background = "linear-gradient(135deg,#1a1a2e,#16213e)";
    wrap.append(el("div", "play", "▶"));
    wrap.append(el("span", "mlabel", parsed ? parsed.type : "wideo"));
  }
  wrap.onclick = e => { e.stopPropagation(); openMediaPlayer(p); };
  return wrap;
}

function openMediaPlayer(p) {
  let body = `<h3 style="margin-bottom:10px">${p.nick} — media</h3>`;
  if (p.fileData && p.fileType && p.fileType.startsWith("image")) {
    body += `<img src="${p.fileData}" style="max-width:100%;border-radius:12px" alt="screen">`;
  } else if (p.fileData && p.fileType && p.fileType.startsWith("video")) {
    body += `<div class="embed-box"><video src="${p.fileData}" controls autoplay style="width:100%;height:100%;object-fit:contain"></video></div>`;
  } else if (p.clipUrl) {
    const parsed = parseClipEmbed(p.clipUrl);
    if (parsed && parsed.type === "youtube") {
      body += `<div class="embed-box"><iframe src="${parsed.embed}?autoplay=1" allowfullscreen allow="autoplay;encrypted-media"></iframe></div>`;
    } else if (parsed && parsed.type === "twitch") {
      body += `<div class="embed-box"><iframe src="${parsed.embed}" allowfullscreen></iframe></div>`;
    } else if (parsed && parsed.type === "video") {
      body += `<div class="embed-box"><video src="${parsed.embed}" controls autoplay></video></div>`;
    } else {
      body += `<p class="note">Link: <a href="${p.clipUrl}" target="_blank" rel="noopener" style="color:var(--acc)">${p.clipUrl}</a></p>
        <p class="note" style="margin-top:8px">Nie udało się osadzić odtwarzacza — otwórz link w nowej karcie.</p>`;
    }
  }
  openModal(body);
}

function openProfile(p) {
  const unlocked = canSeeContact(p);
  const contact = contactStr(p);
  const statusLab = p.status === "on" ? "online" : p.status === "idle" ? "zaraz wraca" : "offline";
  openModal(`
    <div class="profile-ava" id="profAva"></div>
    <h3 style="text-align:center;margin-bottom:4px">${p.nick}</h3>
    <p class="note" style="text-align:center;margin-bottom:14px">${statusLab} · ${p.age} lat · ${p.lang}</p>
    <div class="kv"><span>Gra</span><b>${p.game}</b></div>
    <div class="kv"><span>Platforma</span><b>${PLAT_LABEL[p.plat] || p.plat}</b></div>
    <div class="kv"><span>Region</span><b>${p.region}</b></div>
    <div class="kv"><span>Styl</span><b>${p.style}</b></div>
    <div class="kv"><span>Pora</span><b>${p.time}</b></div>
    <div class="kv"><span>Mikrofon</span><b>${(p.mic || "").replace("Mikrofon: ", "")}</b></div>
    <div class="kv"><span>Godziny</span><b>${p.hours ? nf(p.hours) + " h" : "nowy"}</b></div>
    <div class="kv"><span>Ocena</span><b>${p.rating} / 5</b></div>
    <div class="kv"><span>Kontakt</span><b class="${unlocked ? "" : "blur-contact"}">${contact}</b></div>
    <p class="p-desc" style="margin-top:12px">${p.desc || ""}</p>
    <div class="tags" style="margin-top:10px" id="profTags"></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px">
      <button class="btn pri sm" id="profMsg">${unlocked ? "Napisz" : "🔒 Odblokuj kontakt"}</button>
      <button class="btn sm" id="profStar">${SAVED.includes(p.id) ? "★ Obserwujesz" : "☆ Obserwuj"}</button>
      ${p.game ? `<button class="btn sm ghost" id="profGame">Filtruj: ${p.game.length > 18 ? p.game.slice(0, 16) + "…" : p.game}</button>` : ""}
    </div>`);
  const avEl = $("#profAva");
  if (avEl) avEl.style.backgroundImage = avatarArt(p.nick, p.mine ? PREF.avaShift : "");
  const tagBox = $("#profTags");
  if (tagBox) {
    [p.style, p.time, p.mic].filter(Boolean).forEach(t => tagBox.append(el("span", "tag acc", t)));
    (p.tags || []).forEach(t => tagBox.append(el("span", "tag", t)));
  }
  if (p.clipUrl || p.fileData) {
    const mb = el("button", "btn sm", "▶ Obejrzyj media");
    mb.style.marginTop = "10px";
    mb.onclick = () => { $("#modal").classList.remove("on"); openMediaPlayer(p); };
    $("#modalBox").insertBefore(mb, $("#profMsg")?.parentElement || null);
  }
  $("#profMsg").onclick = () => { $("#modal").classList.remove("on"); showContact(p); };
  $("#profStar").onclick = () => {
    toggleSave(p.id);
    $("#profStar").textContent = SAVED.includes(p.id) ? "★ Obserwujesz" : "☆ Obserwuj";
  };
  const pg = $("#profGame");
  if (pg) pg.onclick = () => {
    $("#modal").classList.remove("on");
    $("#fGame").value = p.game;
    go("players");
    renderPlayers(true);
    toast("Filtr: " + p.game);
  };
}

function showContact(p) {
  const unlocked = canSeeContact(p);
  const contact = contactStr(p);
  const left = msgsLeft();

  if (unlocked) {
    // still consume free message quota for non-prem if they "write"
    if (!isPrem() && !p.mine) {
      resetMsgDay();
      if (MSG.used >= FREE_MSG_LIMIT) {
        // already unlocked but out of free msgs — charge coins or push premium
        openModal(`<h3 style="margin-bottom:6px">${p.nick}</h3>
          <p class="note" style="margin-bottom:12px">Limit darmowych wiadomości wyczerpany (${FREE_MSG_LIMIT}/dzień).</p>
          <div class="kv"><span>Kontakt</span><b class="blur-contact">${contact}</b></div>
          <p class="note" style="margin-top:12px">Odblokuj na stałe za ${MSG_COST} WW albo weź Premium (nielimitowane).</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">
            <button class="btn gold" id="payMsg">Zapłać ${MSG_COST} WW</button>
            <button class="btn pri" id="goPremMsg">Weź Premium</button>
          </div>`);
        $("#payMsg").onclick = () => {
          if (COINS.bal < MSG_COST) { toast("Za mało monet"); return; }
          addCoins(-MSG_COST, "Wiadomość odblokowana");
          MSG.used = 0; // reset visual for this action
          save(KEY.msg, MSG);
          if (!UNLOCKS.includes(p.id)) { UNLOCKS.push(p.id); save(KEY.unlocks, UNLOCKS); }
          $("#modal").classList.remove("on");
          showContact(p);
        };
        $("#goPremMsg").onclick = () => { $("#modal").classList.remove("on"); go("premium"); };
        return;
      }
      MSG.used++;
      save(KEY.msg, MSG);
      progressQuest("msg");
    }
    openModal(`<h3 style="margin-bottom:6px">${p.nick}</h3>
      <p class="note" style="margin-bottom:14px">${p.game} · ${p.region}</p>
      <div class="kv"><span>Kontakt</span><b>${contact}</b></div>
      <div class="kv"><span>Kiedy gra</span><b>${p.time}</b></div>
      <div class="kv"><span>Mikrofon</span><b>${p.mic.replace("Mikrofon: ", "")}</b></div>
      <div class="kv"><span>Ocena ekip</span><b>${p.rating} / 5</b></div>
      <p class="note" style="margin-top:14px">Profile w tej wersji są generowane lokalnie — wiadomość nie zostanie nigdzie wysłana.</p>
      ${!isPrem() ? `<p class="msg-limit" style="margin-top:8px">Pozostało darmowych wiadomości: ${msgsLeft()}/${FREE_MSG_LIMIT}</p>` : ""}`);
    return;
  }

  // locked contact
  openModal(`<h3 style="margin-bottom:6px">${p.nick}</h3>
    <p class="note" style="margin-bottom:14px">${p.game} · ${p.region}</p>
    <div class="kv"><span>Kontakt</span><b class="blur-contact">${contact}</b></div>
    <div class="kv"><span>Kiedy gra</span><b>${p.time}</b></div>
    <div class="kv"><span>Mikrofon</span><b>${p.mic.replace("Mikrofon: ", "")}</b></div>
    <p class="note" style="margin-top:14px">Kontakt jest zablokowany. Odblokuj jednorazowo za monety albo weź Premium i pisz bez limitu.</p>
    <div class="lock-row">
      <button class="btn gold" id="unlockOne">Odblokuj za ${UNLOCK_CONTACT_COST} WW</button>
      <button class="btn pri" id="unlockPrem">Premium = nielimitowane</button>
    </div>
    <p class="lock-hint">Darmowe wiadomości dziś: ${left}/${FREE_MSG_LIMIT} (po odblokowaniu)</p>`);
  $("#unlockOne").onclick = () => {
    const cred = Number(localStorage.getItem("bigww_unlock_cred") || 0);
    if (cred > 0) {
      localStorage.setItem("bigww_unlock_cred", String(cred - 1));
      toast("Użyto kredytu odblokowania (" + (cred - 1) + " zostało)");
    } else {
      if (COINS.bal < UNLOCK_CONTACT_COST) { toast("Za mało monet — kup pakiet lub obejrzyj reklamę"); go("shop"); return; }
      addCoins(-UNLOCK_CONTACT_COST, "Kontakt odblokowany");
    }
    if (!UNLOCKS.includes(p.id)) { UNLOCKS.push(p.id); save(KEY.unlocks, UNLOCKS); }
    progressQuest("unlock");
    $("#modal").classList.remove("on");
    showContact(p);
    renderPlayers(false);
  };
  $("#unlockPrem").onclick = () => { $("#modal").classList.remove("on"); go("premium"); };
}

function openModal(html) {
  $("#modalBox").innerHTML = html;
  const close = el("button", "btn sm ghost", "Zamknij");
  close.style.marginTop = "16px";
  close.onclick = () => $("#modal").classList.remove("on");
  $("#modalBox").append(close);
  $("#modal").classList.add("on");
}
$("#modal").onclick = e => { if (e.target.id === "modal") $("#modal").classList.remove("on"); };
document.addEventListener("keydown", e => { if (e.key === "Escape") $("#modal").classList.remove("on"); });

async function toggleSave(id) {
  const on = await DATA.toggleSave(id);
  toast(on ? "Dodano do obserwowanych" : "Usunięto z obserwowanych");
  updateBadges();
  return on;
}
