"use strict";

/* =========================================================
   10. DODAWANIE OGŁOSZENIA
========================================================= */
let pickedTags = [];
function buildAdd() {
  const box = $("#aTags");
  TAGS.forEach(t => {
    const b = el("button", "chip", t);
    b.onclick = () => {
      if (pickedTags.includes(t)) pickedTags = pickedTags.filter(x => x !== t);
      else if (pickedTags.length < 4) pickedTags.push(t);
      else return toast("Maksymalnie 4 tagi");
      b.classList.toggle("on");
      preview();
    };
    box.append(b);
  });
  const tplBox = $("#adTemplates");
  if (tplBox) {
    AD_TEMPLATES.forEach(tpl => {
      const b = el("button", "chip", tpl.label);
      b.onclick = () => {
        $("#aDesc").value = tpl.text;
        $("#aLen").textContent = tpl.text.length;
        document.querySelectorAll("#adTemplates .chip").forEach(c => c.classList.remove("on"));
        b.classList.add("on");
        preview();
        toast("Szablon: " + tpl.label);
      };
      tplBox.append(b);
    });
  }
  const dayBox = $("#aDays");
  if (dayBox) {
    dayBox.innerHTML = "";
    WEEK_DAYS.forEach(d => {
      const b = el("button", "chip", d.label);
      b.onclick = () => {
        if (pickedDays.includes(d.id)) pickedDays = pickedDays.filter(x => x !== d.id);
        else pickedDays.push(d.id);
        b.classList.toggle("on");
        preview();
      };
      dayBox.append(b);
    });
  }
  ["#aNick", "#aAge", "#aGame", "#aRegion", "#aPlat", "#aStyle", "#aRank", "#aTimeFrom", "#aTimeTo", "#aMic", "#aDesc", "#aContact", "#aClip"]
    .forEach(s => { const n = $(s); if (n) n.addEventListener("input", preview); });
  $("#aDesc").addEventListener("input", () => $("#aLen").textContent = $("#aDesc").value.length);
  $("#aSubmit").onclick = submitAd;
  $("#aFile").onchange = () => {
    const f = $("#aFile").files && $("#aFile").files[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) { toast("Max 8 MB"); $("#aFile").value = ""; return; }
    const reader = new FileReader();
    reader.onload = () => {
      pendingMedia.fileData = reader.result;
      pendingMedia.fileType = f.type;
      const prev = $("#aFilePrev");
      prev.innerHTML = "";
      if (f.type.startsWith("image")) {
        const img = el("img");
        img.src = reader.result;
        img.style.cssText = "max-width:100%;max-height:120px;border-radius:10px";
        prev.append(img);
      } else {
        prev.textContent = "Wideo: " + f.name + " (" + Math.round(f.size / 1024) + " KB)";
      }
      preview();
    };
    reader.readAsDataURL(f);
  };
  $("#aFileClear").onclick = () => {
    $("#aFile").value = "";
    pendingMedia.fileData = null;
    pendingMedia.fileType = "";
    $("#aFilePrev").innerHTML = "";
    preview();
  };
  $("#aClear").onclick = () => {
    ["#aNick", "#aAge", "#aDesc", "#aContact", "#aClip"].forEach(s => $(s).value = "");
    $("#aFile").value = "";
    pendingMedia = { clipUrl: "", fileData: null, fileType: "" };
    $("#aFilePrev").innerHTML = "";
    pickedTags = [];
    pickedDays = [];
    document.querySelectorAll("#aTags .chip").forEach(c => c.classList.remove("on"));
    document.querySelectorAll("#aDays .chip").forEach(c => c.classList.remove("on"));
    $("#aLen").textContent = "0";
    editingAdId = null;
    if ($("#aSubmit")) $("#aSubmit").textContent = "Opublikuj ogłoszenie";
    preview();
  };
  preview();
}

function draft() {
  const nick = $("#aNick").value.trim() || "twój_nick";
  const game = $("#aGame").value;
  const hourFrom = $("#aTimeFrom") ? Number($("#aTimeFrom").value) : 17;
  const hourTo = $("#aTimeTo") ? Number($("#aTimeTo").value) : 22;
  return {
    id: "my" + Date.now() + Math.floor(Math.random() * 999),
    nick,
    age: Number($("#aAge").value) || 20,
    region: $("#aRegion").value,
    game,
    gameId: (GAMES.find(g => g.name === game) || {}).id,
    plat: $("#aPlat").value,
    style: $("#aStyle").value,
    rank: ($("#aRank") && $("#aRank").value) || "mid",
    time: timeLabel(hourFrom, hourTo),
    hourFrom,
    hourTo,
    mic: $("#aMic").value,
    lang: "PL",
    hours: 0,
    rating: "—",
    status: "on",
    tags: pickedTags.slice(),
    days: pickedDays.slice(),
    contact: $("#aContact").value.trim(),
    desc: $("#aDesc").value.trim() || "Szukam ludzi do wspólnego grania w " + game + ".",
    clipUrl: ($("#aClip").value || "").trim(),
    fileData: pendingMedia.fileData || null,
    fileType: pendingMedia.fileType || "",
    added: Date.now(),
    mine: true
  };
}
function preview() {
  const box = $("#aPreview");
  box.innerHTML = "";
  box.append(playerCard(draft()));
  // Podgląd to obrazek własnego ogłoszenia, nie działająca karta. Bez tego
  // „Napisz" w podglądzie otwierało rozmowę z samym sobą, a „Obserwuj"
  // dopisywało do obserwowanych ogłoszenie, którego jeszcze nie ma.
  box.querySelectorAll("button, a, .nick-link").forEach(n => {
    n.onclick = e => { e.preventDefault(); e.stopPropagation(); };
    n.style.pointerEvents = "none";
  });
}
let editingAdId = null;

function startEditAd(p) {
  if (!requireLogin("edytować ogłoszenie")) return;
  editingAdId = p.id;
  $("#aNick").value = p.nick || "";
  $("#aAge").value = p.age || "";
  if (p.game) $("#aGame").value = p.game;
  if (p.region) $("#aRegion").value = p.region;
  if (p.plat) $("#aPlat").value = p.plat;
  if (p.style) $("#aStyle").value = p.style;
  if (p.rank && $("#aRank")) $("#aRank").value = p.rank;
  pickedDays = (p.days || []).slice();
  document.querySelectorAll("#aDays .chip").forEach((c, i) => {
    if (WEEK_DAYS[i]) c.classList.toggle("on", pickedDays.includes(WEEK_DAYS[i].id));
  });
  if (p.hourFrom != null && $("#aTimeFrom")) $("#aTimeFrom").value = String(p.hourFrom);
  if (p.hourTo != null && $("#aTimeTo")) $("#aTimeTo").value = String(p.hourTo);
  if (p.mic) $("#aMic").value = p.mic;
  $("#aContact").value = p.contact || "";
  $("#aDesc").value = p.desc || "";
  $("#aLen").textContent = ($("#aDesc").value || "").length;
  $("#aClip").value = p.clipUrl || "";
  pendingMedia.fileData = p.fileData || null;
  pendingMedia.fileType = p.fileType || "";
  pickedTags = (p.tags || []).slice(0, 4);
  document.querySelectorAll("#aTags .chip").forEach(c => {
    c.classList.toggle("on", pickedTags.includes(c.textContent));
  });
  const prev = $("#aFilePrev");
  if (prev) {
    prev.innerHTML = "";
    if (p.fileData && p.fileType && p.fileType.startsWith("image")) {
      const img = el("img");
      img.src = p.fileData;
      img.style.cssText = "max-width:100%;max-height:120px;border-radius:10px";
      prev.append(img);
    }
  }
  if ($("#aSubmit")) $("#aSubmit").textContent = "Zapisz zmiany";
  go("add");
  preview();
  toast("Edytujesz ogłoszenie");
}

async function submitAd() {
  if (!requireLogin("dodać ogłoszenie")) return;
  const nick = $("#aNick").value.trim();
  if (nick.length < 2) { toast("Wpisz nick"); $("#aNick").focus(); return; }
  if ($("#aDesc").value.trim().length < 10) { toast("Opisz krótko, czego szukasz"); $("#aDesc").focus(); return; }

  // Serwer nie przyjmuje plików z dysku — na razie zostają tylko lokalnie.
  if (DATA.isApi && pendingMedia.fileData) {
    toast("Plik z dysku zostaje tylko na tym komputerze — na serwer idzie odsyłacz do klipu");
  }

  const ad = draft();

  if (editingAdId) {
    try {
      await DATA.updateAd(editingAdId, ad);
    } catch (e) {
      toast(e && e.message ? e.message : "Nie udało się zapisać zmian");
      return;
    }
    editingAdId = null;
    if ($("#aSubmit")) $("#aSubmit").textContent = "Opublikuj ogłoszenie";
    toast("Ogłoszenie zaktualizowane");
    updateBadges();
    renderPlayers(true);
    renderMine();
    go("mine");
    return;
  }

  if (!DATA.isApi && MINE.length >= adLimit()) {
    pokazLimitOgloszen(adLimit());
    return;
  }

  ad.ownerId = SESSION ? SESSION.userId : undefined;
  try {
    await DATA.createAd(ad);
  } catch (e) {
    if (e && e.status === 403) {
      pokazLimitOgloszen((e.data && e.data.limit) || DATA.limits.limit || adLimit());
      return;
    }
    if (e && e.status === 401) { requireLogin("dodać ogłoszenie"); return; }
    toast(e && e.message ? e.message : "Nie udało się dodać ogłoszenia");
    return;
  }
  toast("Ogłoszenie opublikowane");
  updateBadges();
  renderPlayers(true);
  renderMine();
  go("mine");
}

function pokazLimitOgloszen(limit) {
  openModal(`<h3 style="margin-bottom:8px">Limit ogłoszeń wyczerpany</h3>
    <p class="note">Twój plan pozwala mieć ${limit} aktywne ogłoszenia. Usuń jedno ze starych albo przejdź na Premium, gdzie zmieścisz 10 i trafisz na górę wyników.</p>
    <button class="btn gold" id="limGo" style="margin-top:16px">Zobacz Premium</button>`);
  $("#limGo").onclick = () => { $("#modal").classList.remove("on"); go("premium"); };
}

function renderMine() {
  const box = $("#mineList");
  box.innerHTML = "";
  if (!MINE.length) {
    box.innerHTML = `<div class="empty" style="grid-column:1/-1"><h3>Nie masz jeszcze ogłoszeń</h3><p>Dodaj pierwsze, żeby inni gracze mogli Cię znaleźć.</p></div>`;
    const b = el("button", "btn pri", "Dodaj ogłoszenie");
    b.onclick = () => go("add");
    box.firstChild.append(b);
    return;
  }
  MINE.forEach(p => box.append(playerCard(p)));
}
function renderSaved() {
  const box = $("#savedList");
  box.innerHTML = "";
  const list = allPlayers().filter(p => SAVED.includes(p.id));
  if (!list.length) {
    box.innerHTML = `<div class="empty" style="grid-column:1/-1"><h3>Pusto</h3><p>Gwiazdka na karcie gracza zapisze go tutaj.</p></div>`;
    return;
  }
  list.forEach(p => box.append(playerCard(p)));
}

