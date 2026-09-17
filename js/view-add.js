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
    gameId: (GAMES.find(g => g.name === game) || {}).id,
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
function submitAd() {
  const nick = $("#aNick").value.trim();
  if (nick.length < 2) { toast("Wpisz nick"); $("#aNick").focus(); return; }
  if ($("#aDesc").value.trim().length < 10) { toast("Opisz krótko, czego szukasz"); $("#aDesc").focus(); return; }
  if (MINE.length >= adLimit()) {
    openModal(`<h3 style="margin-bottom:8px">Limit ogłoszeń wyczerpany</h3>
      <p class="note">Plan podstawowy pozwala mieć ${adLimit()} aktywne ogłoszenia. Usuń jedno ze starych albo przejdź na Premium, gdzie zmieścisz 10 i trafisz na górę wyników.</p>
      <button class="btn gold" id="limGo" style="margin-top:16px">Zobacz Premium</button>`);
    $("#limGo").onclick = () => { $("#modal").classList.remove("on"); go("premium"); };
    return;
  }
  const ad = draft();
  MINE.unshift(ad);
  save(KEY.mine, MINE);
  countCache = null;
  toast("Ogłoszenie opublikowane");
  updateBadges();
  renderPlayers(true);
  go("mine");
  progressQuest("post"); // monetization.js — zadanie dnia „dodaj ogłoszenie”
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
