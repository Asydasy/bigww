"use strict";

/* BigWW - Widok: dodawanie ogloszenia + moje ogloszenia + obserwowani */

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
  ["#aNick", "#aAge", "#aGame", "#aRegion", "#aPlat", "#aStyle", "#aTime", "#aMic", "#aDesc", "#aContact", "#aClip"]
    .forEach(s => $(s).addEventListener("input", preview));
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
    document.querySelectorAll("#aTags .chip").forEach(c => c.classList.remove("on"));
    $("#aLen").textContent = "0";
    preview();
  };
  preview();
}

function draft() {
  const nick = $("#aNick").value.trim() || "twój_nick";
  const game = $("#aGame").value;
  return {
    id: "my" + Date.now() + Math.floor(Math.random() * 999),
    nick,
    age: Number($("#aAge").value) || 20,
    region: $("#aRegion").value,
    game,
    gameId: DATA.gameIdByName(game),
    plat: $("#aPlat").value,
    style: $("#aStyle").value,
    time: $("#aTime").value,
    mic: $("#aMic").value,
    lang: "PL",
    hours: 0,
    rating: "—",
    status: "on",
    tags: pickedTags.slice(),
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
}
async function submitAd() {
  const nick = $("#aNick").value.trim();
  if (nick.length < 2) { toast("Wpisz nick"); $("#aNick").focus(); return; }
  if ($("#aDesc").value.trim().length < 10) { toast("Opisz krótko, czego szukasz"); $("#aDesc").focus(); return; }

  // Na serwerze ogłoszenie musi mieć właściciela.
  if (DATA.isApi && !DATA.user) return requireLogin("dodać ogłoszenie");

  $("#aSubmit").disabled = true;
  try {
    await DATA.createAd(draft());
  } catch (e) {
    $("#aSubmit").disabled = false;
    if (e.status === 401) return requireLogin("dodać ogłoszenie");
    if (e.status === 403) return limitModal();
    toast(e.message || "Nie udało się opublikować ogłoszenia");
    return;
  }
  $("#aSubmit").disabled = false;

  toast("Ogłoszenie opublikowane");
  updateBadges();
  renderPlayers(true);
  go("mine");
  progressQuest("post"); // monetization.js — zadanie dnia „dodaj ogłoszenie”
}

function limitModal() {
  const limit = DATA.isApi ? DATA.limits.limit : adLimit();
  openModal(`<h3 style="margin-bottom:8px">Limit ogłoszeń wyczerpany</h3>
    <p class="note">Plan podstawowy pozwala mieć ${limit} aktywne ogłoszenia. Usuń jedno ze starych albo przejdź na Premium, gdzie zmieścisz 10 i trafisz na górę wyników.</p>
    <button class="btn gold" id="limGo" style="margin-top:16px">Zobacz Premium</button>`);
  $("#limGo").onclick = () => { $("#modal").classList.remove("on"); go("premium"); };
}

async function renderMine() {
  const box = $("#mineList");
  box.innerHTML = "";

  if (DATA.isApi && !DATA.user) {
    box.innerHTML = `<div class="empty" style="grid-column:1/-1"><h3>Zaloguj się</h3>
      <p>Twoje ogłoszenia są przypisane do konta, więc najpierw trzeba się zalogować.</p></div>`;
    const b = el("button", "btn pri", "Zaloguj się");
    b.onclick = () => openAuth("login");
    box.firstChild.append(b);
    return;
  }

  let res;
  try {
    res = await DATA.myAds();
  } catch (e) {
    box.innerHTML = `<div class="empty" style="grid-column:1/-1"><h3>Nie udało się pobrać ogłoszeń</h3><p>${e.message || ""}</p></div>`;
    return;
  }

  if (!res.ads.length) {
    box.innerHTML = `<div class="empty" style="grid-column:1/-1"><h3>Nie masz jeszcze ogłoszeń</h3><p>Dodaj pierwsze, żeby inni gracze mogli Cię znaleźć.</p></div>`;
    const b = el("button", "btn pri", "Dodaj ogłoszenie");
    b.onclick = () => go("add");
    box.firstChild.append(b);
    return;
  }

  const info = el("div", "note");
  info.style.cssText = "grid-column:1/-1;margin-bottom:4px";
  info.textContent = `Zajęte ${res.used} z ${res.limit} miejsc na ogłoszenia.`;
  box.append(info);
  res.ads.forEach(p => box.append(playerCard(p)));
}

async function renderSaved() {
  const box = $("#savedList");
  box.innerHTML = "";

  if (DATA.isApi && !DATA.user) {
    box.innerHTML = `<div class="empty" style="grid-column:1/-1"><h3>Zaloguj się</h3>
      <p>Obserwowani są zapisani przy koncie, żeby byli widoczni także na innym urządzeniu.</p></div>`;
    const b = el("button", "btn pri", "Zaloguj się");
    b.onclick = () => openAuth("login");
    box.firstChild.append(b);
    return;
  }

  let res;
  try {
    res = await DATA.savedAds();
  } catch (e) {
    box.innerHTML = `<div class="empty" style="grid-column:1/-1"><h3>Nie udało się pobrać listy</h3><p>${e.message || ""}</p></div>`;
    return;
  }

  if (!res.ads.length) {
    box.innerHTML = `<div class="empty" style="grid-column:1/-1"><h3>Pusto</h3><p>Gwiazdka na karcie gracza zapisze go tutaj.</p></div>`;
    return;
  }
  res.ads.forEach(p => box.append(playerCard(p)));
}
