"use strict";

/* =========================================================
   7. FILTRY GRACZY
========================================================= */
const QUICK = [
  { id: "on", label: "Tylko online" },
  { id: "mic", label: "Z mikrofonem" },
  { id: "new", label: "Świeże (24 h)" },
  { id: "learn", label: "Uczą nowych" },
  { id: "pl", label: "Po polsku" }
];
let quickOn = new Set();
let shown = 24;
let playerView = (PREF && PREF.playerView) || "grid";

function applyPlayerView() {
  const box = $("#playerList");
  if (box) box.classList.toggle("list-view", playerView === "list");
  document.querySelectorAll("#viewToggle button").forEach(b => {
    b.classList.toggle("on", b.dataset.view === playerView);
  });
}

function rebuildFilterLabels() {
  // update first option labels without wiping selections
  const patchFirst = (sel, label) => {
    if (!sel || !sel.options.length) return;
    const v = sel.value;
    if (sel.options[0] && sel.options[0].value === "") sel.options[0].text = label;
    sel.value = v;
  };
  patchFirst($("#fGame"), t("players.allGames"));
  patchFirst($("#fRegion"), t("players.allRegions"));
  patchFirst($("#fPlat"), t("players.anyPlat"));
  patchFirst($("#fStyle"), t("players.anyStyle"));
  if ($("#fTimeFrom") && $("#fTimeFrom").options[0]) $("#fTimeFrom").options[0].text = t("players.from");
  if ($("#fTimeTo") && $("#fTimeTo").options[0]) $("#fTimeTo").options[0].text = t("players.to");
  // quick chips
  const box = $("#quickChips");
  if (box) {
    const chips = box.querySelectorAll(".chip");
    QUICK.forEach((q, i) => {
      if (chips[i]) {
        const on = chips[i].classList.contains("on");
        chips[i].textContent = t("quick." + q.id);
        if (on) chips[i].classList.add("on");
      }
    });
  }
  // genre "All" chip
  const gAll = document.querySelector("#genreChips .chip");
  if (gAll && (gAll.textContent === "Wszystkie" || gAll.textContent === "All" || gAll.classList.contains("on"))) {
    // only update the first "all" chip
    const first = document.querySelector("#genreChips .chip");
    if (first) first.textContent = t("games.all");
  }
}

function buildFilters() {
  fillSelect($("#fGame"), GAMES.map(g => g.name).sort((a, b) => a.localeCompare(b, "pl")), t("players.allGames"));
  fillSelect($("#fRegion"), REGIONS, t("players.allRegions"));
  fillSelect($("#fPlat"), PLATS.map(p => ({ value: p, label: PLAT_LABEL[p] })), t("players.anyPlat"));
  fillSelect($("#fStyle"), STYLES, t("players.anyStyle"));
  fillHourSelect($("#fTimeFrom"), t("players.from"));
  fillHourSelect($("#fTimeTo"), t("players.to"));
  fillHourSelect($("#aTimeFrom"), null, "17");
  fillHourSelect($("#aTimeTo"), null, "22");

  fillSelect($("#aGame"), GAMES.map(g => g.name).sort((a, b) => a.localeCompare(b, "pl")));
  fillSelect($("#aRegion"), REGIONS);
  fillSelect($("#aPlat"), PLATS.map(p => ({ value: p, label: PLAT_LABEL[p] })));
  fillSelect($("#aStyle"), STYLES);
  fillSelect($("#sRegion"), REGIONS);
  $("#sRegion").value = PREF.region;
  $("#aRegion").value = PREF.region;

  function persistFilters() {
    PREF.filters = {
      search: $("#pSearch").value,
      game: $("#fGame").value,
      region: $("#fRegion").value,
      plat: $("#fPlat").value,
      style: $("#fStyle").value,
      timeFrom: $("#fTimeFrom").value,
      timeTo: $("#fTimeTo").value,
      sort: $("#fSort").value,
      rank: $("#fRank") ? $("#fRank").value : "",
      quick: Array.from(quickOn)
    };
    PREF.playerView = playerView;
    save(KEY.pref, PREF);
  }

  const box = $("#quickChips");
  QUICK.forEach(q => {
    const b = el("button", "chip", t("quick." + q.id) || q.label);
    b.onclick = () => {
      quickOn.has(q.id) ? quickOn.delete(q.id) : quickOn.add(q.id);
      b.classList.toggle("on");
      persistFilters();
      renderPlayers(true);
    };
    box.append(b);
  });

  // restore saved filters
  if (PREF.filters) {
    const f = PREF.filters;
    if (f.search) $("#pSearch").value = f.search;
    if (f.game) $("#fGame").value = f.game;
    if (f.region && REGIONS.includes(f.region)) $("#fRegion").value = f.region;
    if (f.plat) $("#fPlat").value = f.plat;
    if (f.style) $("#fStyle").value = f.style;
    if (f.rank && $("#fRank")) $("#fRank").value = f.rank;
    if (f.timeFrom != null) $("#fTimeFrom").value = f.timeFrom;
    if (f.timeTo != null) $("#fTimeTo").value = f.timeTo;
    if (f.sort) $("#fSort").value = f.sort;
    if (f.quick && f.quick.length) {
      f.quick.forEach(id => quickOn.add(id));
      document.querySelectorAll("#quickChips .chip").forEach((c, i) => {
        if (QUICK[i] && quickOn.has(QUICK[i].id)) c.classList.add("on");
      });
    }
  }
  if (PREF.playerView) playerView = PREF.playerView;
  applyPlayerView();

  document.querySelectorAll("#viewToggle button").forEach(b => {
    b.onclick = () => {
      playerView = b.dataset.view;
      persistFilters();
      applyPlayerView();
    };
  });

  ["#pSearch", "#fGame", "#fRegion", "#fPlat", "#fStyle", "#fRank", "#fTimeFrom", "#fTimeTo", "#fSort"].forEach(s => {
    const node = $(s);
    if (node) node.addEventListener("input", () => { persistFilters(); renderPlayers(true); });
  });
  $("#pReset").onclick = () => {
    ["#fGame", "#fRegion", "#fPlat", "#fStyle", "#fRank", "#fTimeFrom", "#fTimeTo"].forEach(s => { if ($(s)) $(s).value = ""; });
    $("#pSearch").value = ""; $("#fSort").value = "match";
    quickOn.clear();
    document.querySelectorAll("#quickChips .chip").forEach(c => c.classList.remove("on"));
    PREF.filters = null;
    save(KEY.pref, PREF);
    renderPlayers(true);
  };
  $("#pMore").onclick = () => { shown += 24; renderPlayers(false); };

  // presety filtrów
  function refreshPresetSelect() {
    const sel = $("#fPreset");
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = '<option value="">— wybierz zapisany —</option>';
    PRESETS.forEach((p, i) => sel.appendChild(new Option(p.name, String(i))));
    if (cur) sel.value = cur;
  }
  refreshPresetSelect();
  if ($("#btnPresetSave")) $("#btnPresetSave").onclick = () => {
    const name = prompt("Nazwa presetu (np. Valorant ranked PL)", ($("#fGame").value || "Mój filtr") + " · " + (new Date()).toLocaleDateString("pl-PL"));
    if (!name || !name.trim()) return;
    PRESETS.push({
      name: name.trim().slice(0, 40),
      search: $("#pSearch").value,
      game: $("#fGame").value,
      region: $("#fRegion").value,
      plat: $("#fPlat").value,
      style: $("#fStyle").value,
      rank: $("#fRank") ? $("#fRank").value : "",
      timeFrom: $("#fTimeFrom") ? $("#fTimeFrom").value : "",
      timeTo: $("#fTimeTo") ? $("#fTimeTo").value : "",
      sort: $("#fSort").value,
      quick: Array.from(quickOn)
    });
    save(KEY.presets, PRESETS);
    refreshPresetSelect();
    $("#fPreset").value = String(PRESETS.length - 1);
    toast("Preset zapisany");
    pushNotif("Preset filtrów", name.trim(), "players");
  };
  if ($("#btnPresetDel")) $("#btnPresetDel").onclick = () => {
    const i = Number($("#fPreset").value);
    if (Number.isNaN(i) || !PRESETS[i]) return toast("Wybierz preset");
    PRESETS.splice(i, 1);
    save(KEY.presets, PRESETS);
    refreshPresetSelect();
    toast("Preset usunięty");
  };
  if ($("#fPreset")) $("#fPreset").onchange = () => {
    const i = Number($("#fPreset").value);
    if (Number.isNaN(i) || !PRESETS[i]) return;
    const f = PRESETS[i];
    $("#pSearch").value = f.search || "";
    $("#fGame").value = f.game || "";
    $("#fRegion").value = f.region || "";
    $("#fPlat").value = f.plat || "";
    $("#fStyle").value = f.style || "";
    if ($("#fRank")) $("#fRank").value = f.rank || "";
    if ($("#fTimeFrom")) $("#fTimeFrom").value = f.timeFrom || "";
    if ($("#fTimeTo")) $("#fTimeTo").value = f.timeTo || "";
    $("#fSort").value = f.sort || "match";
    quickOn.clear();
    (f.quick || []).forEach(id => quickOn.add(id));
    document.querySelectorAll("#quickChips .chip").forEach((c, idx) => {
      c.classList.toggle("on", QUICK[idx] && quickOn.has(QUICK[idx].id));
    });
    updateQuickComboBtn();
    persistFilters();
    renderPlayers(true);
    toast("Wczytano: " + f.name);
  };

  function updateQuickComboBtn() {
    const on = quickOn.has("on") && quickOn.has("mic") && quickOn.has("pl");
    $("#btnQuickCombo")?.classList.toggle("on", on);
  }
  if ($("#btnQuickCombo")) {
    $("#btnQuickCombo").onclick = () => {
      const on = quickOn.has("on") && quickOn.has("mic") && quickOn.has("pl");
      if (on) {
        quickOn.delete("on"); quickOn.delete("mic"); quickOn.delete("pl");
      } else {
        quickOn.add("on"); quickOn.add("mic"); quickOn.add("pl");
      }
      document.querySelectorAll("#quickChips .chip").forEach((c, idx) => {
        if (QUICK[idx] && ["on", "mic", "pl"].includes(QUICK[idx].id)) {
          c.classList.toggle("on", quickOn.has(QUICK[idx].id));
        }
      });
      updateQuickComboBtn();
      persistFilters();
      renderPlayers(true);
    };
  }
  updateQuickComboBtn();
}

function filterPlayers() {
  const rawQ = ($("#pSearch").value || "").trim();
  const toks = tokens(rawQ);
  const g = $("#fGame").value, r = $("#fRegion").value, pl = $("#fPlat").value,
        st = $("#fStyle").value;
  const rk = $("#fRank") ? $("#fRank").value : "";
  const tf = $("#fTimeFrom") ? $("#fTimeFrom").value : "";
  const tt = $("#fTimeTo") ? $("#fTimeTo").value : "";

  const scored = [];
  allPlayers().forEach(p => {
    if (isBlocked(p.id)) return;
    if (g && p.game !== g) return;
    if (!regionMatches(r, p.region)) return;
    if (pl && p.plat !== pl) return;
    if (st && p.style !== st) return;
    if (rk && p.rank !== rk) return;
    if ((tf !== "" || tt !== "") && !hoursOverlap(p.hourFrom, p.hourTo, tf === "" ? 0 : tf, tt === "" ? 23 : tt)) return;
    if (quickOn.has("on") && p.status !== "on") return;
    if (quickOn.has("mic") && p.mic !== "Mikrofon: tak") return;
    if (quickOn.has("new") && Date.now() - p.added > 24 * HOUR) return;
    if (quickOn.has("learn") && !(p.tags || []).includes("uczę nowych")) return;
    if (quickOn.has("pl") && !(p.lang || "").startsWith("PL")) return;

    const score = searchScore(playerSearchFields(p), toks);
    if (toks.length && score === 0) return;
    scored.push({ p, score, match: matchScore(p) });
  });

  const sort = $("#fSort").value;
  const boostPri = x => isBoosted(x.p.id) ? 0 : 1;
  const lookPri = x => (x.p.mine && PREF.looking) ? 0 : 1;
  const pr = x => (x.p.mine ? isPrem() : !!x.p.prem) ? 0 : 1;
  const byScore = (a, b) => (toks.length ? b.score - a.score : 0);

  if (sort === "match") scored.sort((a, b) => boostPri(a) - boostPri(b) || lookPri(a) - lookPri(b) || b.match - a.match || byScore(a, b) || b.p.added - a.p.added);
  else if (sort === "new") scored.sort((a, b) => boostPri(a) - boostPri(b) || lookPri(a) - lookPri(b) || pr(a) - pr(b) || byScore(a, b) || b.p.added - a.p.added);
  else if (sort === "online") scored.sort((a, b) => boostPri(a) - boostPri(b) || lookPri(a) - lookPri(b) || (a.p.status === "on" ? 0 : 1) - (b.p.status === "on" ? 0 : 1) || byScore(a, b) || b.p.added - a.p.added);
  else if (sort === "hours") scored.sort((a, b) => boostPri(a) - boostPri(b) || lookPri(a) - lookPri(b) || byScore(a, b) || (b.p.hours || 0) - (a.p.hours || 0));
  else if (sort === "rating") scored.sort((a, b) => boostPri(a) - boostPri(b) || lookPri(a) - lookPri(b) || byScore(a, b) || Number(b.p.rating) - Number(a.p.rating));
  else scored.sort((a, b) => byScore(a, b) || b.p.added - a.p.added);

  return scored.map(x => x.p);
}

function renderActiveFilters() {
  const box = $("#activeFilters");
  if (!box) return;
  box.innerHTML = "";
  const chips = [];
  const add = (key, label, clear) => chips.push({ key, label, clear });
  if ($("#pSearch") && $("#pSearch").value.trim()) add("q", "„" + $("#pSearch").value.trim() + "”", () => { $("#pSearch").value = ""; });
  if ($("#fGame") && $("#fGame").value) add("g", $("#fGame").value, () => { $("#fGame").value = ""; });
  if ($("#fRegion") && $("#fRegion").value) add("r", $("#fRegion").value, () => { $("#fRegion").value = ""; });
  if ($("#fPlat") && $("#fPlat").value) add("p", PLAT_LABEL[$("#fPlat").value] || $("#fPlat").value, () => { $("#fPlat").value = ""; });
  if ($("#fStyle") && $("#fStyle").value) add("s", $("#fStyle").value, () => { $("#fStyle").value = ""; });
  if ($("#fTimeFrom") && ($("#fTimeFrom").value !== "" || ($("#fTimeTo") && $("#fTimeTo").value !== ""))) {
    add("t", timeLabel($("#fTimeFrom").value || 0, ($("#fTimeTo") && $("#fTimeTo").value) || 23), () => {
      $("#fTimeFrom").value = ""; if ($("#fTimeTo")) $("#fTimeTo").value = "";
    });
  }
  QUICK.forEach(q => {
    if (quickOn.has(q.id)) add("qk-" + q.id, q.label, () => {
      quickOn.delete(q.id);
      document.querySelectorAll("#quickChips .chip").forEach((c, i) => {
        if (QUICK[i] && QUICK[i].id === q.id) c.classList.remove("on");
      });
    });
  });
  chips.forEach(ch => {
    const b = el("button", "chip on", ch.label + " ×");
    b.onclick = () => {
      ch.clear();
      if (PREF.filters) {
        PREF.filters = {
          search: $("#pSearch").value,
          game: $("#fGame").value,
          region: $("#fRegion").value,
          plat: $("#fPlat").value,
          style: $("#fStyle").value,
          timeFrom: $("#fTimeFrom") ? $("#fTimeFrom").value : "",
          timeTo: $("#fTimeTo") ? $("#fTimeTo").value : "",
          sort: $("#fSort").value,
          quick: Array.from(quickOn)
        };
        save(KEY.pref, PREF);
      }
      renderPlayers(true);
    };
    box.append(b);
  });
}

function renderPlayers(reset) {
  if (reset) shown = 24;
  const list = filterPlayers();
  const box = $("#playerList");
  box.innerHTML = "";
  renderActiveFilters();
  $("#pCount").textContent = list.length
    ? `${nf(list.length)} ${list.length === 1 ? "gracz" : list.length < 5 ? "graczy" : "graczy"} pasuje do filtrów`
    : "Brak wyników";

  if (!list.length) {
    const e = el("div", "empty");
    e.style.gridColumn = "1/-1";
    const active = [];
    if ($("#pSearch").value.trim()) active.push("szukaj: „" + $("#pSearch").value.trim() + "”");
    if ($("#fGame").value) active.push("gra: " + $("#fGame").value);
    if ($("#fRegion").value) active.push("region: " + $("#fRegion").value);
    if ($("#fPlat").value) active.push("platforma: " + $("#fPlat").value);
    if ($("#fStyle").value) active.push("styl: " + $("#fStyle").value);
    if ($("#fTimeFrom") && ($("#fTimeFrom").value !== "" || $("#fTimeTo").value !== "")) {
      active.push("godziny: " + timeLabel($("#fTimeFrom").value || 0, $("#fTimeTo").value || 23));
    }
    if (quickOn.size) active.push("szybkie filtry: " + quickOn.size);
    e.innerHTML = `<h3>Brak dokładnych wyników</h3>
      <p>${active.length ? "Aktywne: " + active.join(" · ") + "." : "Nikt nie pasuje."}
      Spróbuj mniej słów w wyszukiwarce (każde słowo musi pasować) albo wyczyść filtry.</p>`;
    const row = el("div");
    row.style.cssText = "display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:16px";
    const b1 = el("button", "btn", "Wyczyść filtry");
    b1.onclick = () => $("#pReset").click();
    const b2 = el("button", "btn pri", "Dodaj ogłoszenie");
    b2.onclick = () => go("add");
    row.append(b1, b2);
    e.append(row);
    box.append(e);
    $("#pMore").style.display = "none";
    return;
  }
  const frag = document.createDocumentFragment();
  list.slice(0, shown).forEach(p => frag.append(playerCard(p)));
  box.append(frag);
  applyPlayerView();
  $("#pMore").style.display = list.length > shown ? "inline-block" : "none";
}

