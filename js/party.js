"use strict";

/* Radio BigWW — przeciągany panel z jednym zapętlonym utworem.
 *
 * Plik `audio/party.mp3` NIE leży w repozytorium (patrz `.gitignore`): to
 * kilka MB cudzej muzyki, tak samo jak okładki gier. Po świeżym `git clone`
 * go nie ma i to jest w porządku — panel sam się wtedy nie pokazuje, zamiast
 * mrugać przyciskiem, który nic nie robi.
 */
(function () {
  const oldBtn = document.getElementById("partyToggle");
  if (oldBtn) oldBtn.remove();

  const src = "audio/party.mp3";
  let audio = document.getElementById("partyAudio");
  if (!audio) {
    audio = document.createElement("audio");
    audio.id = "partyAudio";
    document.body.appendChild(audio);
  }
  audio.loop = true;
  // "metadata", nie "none": przeglądarka pyta o nagłówek pliku od razu, więc od
  // razu wiadomo, czy plik w ogóle jest. Przy "none" nie pyta wcale, panel
  // pokazywałby się także bez muzyki, a Play nie robiłby nic. Samego dźwięku
  // to nie ściąga — dopiero Play.
  audio.preload = "metadata";
  audio.src = src;
  audio.volume = (window.PREF && typeof PREF.musicVol === "number") ? PREF.musicVol : 0.6;

  let deck = document.getElementById("partyDeck");
  if (!deck) {
    deck = document.createElement("div");
    deck.id = "partyDeck";
    document.body.appendChild(deck);
  }
  deck.classList.remove("mini");
  deck.innerHTML =
    '<div class="pd-head" id="pdDrag">' +
      '<span class="pd-eq"><i></i><i></i><i></i><i></i></span>' +
      '<div class="pd-titles"><b>BigWW Radio</b><small id="pdTrack">Party Funk — MAFIA</small></div>' +
    '</div>' +
    '<div class="pd-body">' +
      '<button type="button" class="pd-play" id="pdPlay">Play</button>' +
      '<button type="button" class="pd-mute" id="pdMute">Wycisz</button>' +
    '</div>' +
    '<div class="pd-slide">' +
      '<span>Głośność</span>' +
      '<input type="range" id="pdVol" min="0" max="100" value="' + Math.round(audio.volume * 100) + '">' +
    '</div>' +
    '<div class="pd-hint">Przeciągnij radio gdzie chcesz</div>';

  const playBtn = document.getElementById("pdPlay");
  const muteBtn = document.getElementById("pdMute");
  const volEl = document.getElementById("pdVol");
  const track = document.getElementById("pdTrack");

  function isOn() { return !audio.paused && !audio.ended; }

  function paint(on) {
    deck.classList.toggle("on", !!on);
    document.documentElement.setAttribute("data-party", on ? "on" : "off");
    playBtn.textContent = on ? "Pauza" : "Play";
    track.textContent = on ? "gra teraz" : "zatrzymane";
    muteBtn.textContent = audio.volume === 0 ? "Włącz dźwięk" : "Wycisz";
  }

  function saveMusic(on, v) {
    if (!window.PREF || !window.save || !window.KEY) return;
    if (typeof on === "boolean") PREF.music = on ? "on" : "off";
    if (typeof v === "number") PREF.musicVol = v;
    save(KEY.pref, PREF);
    const sm = document.getElementById("sMusic");
    if (sm && typeof on === "boolean") sm.value = PREF.music;
    const sv = document.getElementById("sMusicVol");
    if (sv && typeof v === "number") sv.value = String(Math.round(v * 100));
  }

  function start() {
    const p = audio.play();
    if (p && p.catch) p.catch(function () { paint(false); });
    paint(true);
    saveMusic(true);
  }
  function stop() {
    try { audio.pause(); } catch (e) {}
    paint(false);
    saveMusic(false);
  }
  function setBarFill(el, v) {
    if (!el) return;
    el.style.setProperty("--pos", Math.round(v * 100) + "%");
  }
  function setVol(v) {
    v = Math.max(0, Math.min(1, Number(v)));
    audio.volume = v;
    if (volEl) { volEl.value = String(Math.round(v * 100)); setBarFill(volEl, v); }
    muteBtn.textContent = v === 0 ? "Włącz dźwięk" : "Wycisz";
    saveMusic(undefined, v);
  }

  window.partyStart = start;
  window.partyStop = stop;
  window.partySetVolume = setVol;
  window.partyMute = function () {
    if (audio.volume > 0) {
      deck.dataset.prev = String(audio.volume);
      setVol(0);
    } else {
      setVol(Number(deck.dataset.prev || 0.6));
    }
  };
  window.partySync = function () {
    if (window.PREF && PREF.music === "off") stop();
    else start();
  };

  playBtn.onclick = function (e) { e.stopPropagation(); isOn() ? stop() : start(); };
  muteBtn.onclick = function (e) { e.stopPropagation(); window.partyMute(); };
  volEl.oninput = function () { setVol(Number(volEl.value) / 100); };

  let drag = null;
  deck.addEventListener("pointerdown", function (e) {
    if (e.target.closest("button, input")) return;
    const r = deck.getBoundingClientRect();
    drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    try { deck.setPointerCapture(e.pointerId); } catch (err) {}
  });
  deck.addEventListener("pointermove", function (e) {
    if (!drag) return;
    const x = Math.max(0, Math.min(window.innerWidth - deck.offsetWidth, e.clientX - drag.dx));
    const y = Math.max(0, Math.min(window.innerHeight - deck.offsetHeight, e.clientY - drag.dy));
    deck.style.left = x + "px";
    deck.style.top = y + "px";
    deck.style.right = "auto";
    deck.style.bottom = "auto";
  });
  function endDrag() { drag = null; }
  deck.addEventListener("pointerup", endDrag);
  deck.addEventListener("pointercancel", endDrag);

  audio.addEventListener("playing", function () { paint(true); });
  audio.addEventListener("pause", function () { paint(false); });

  // Brak pliku (albo format, którego przeglądarka nie umie) — chowamy panel.
  // Lepiej, żeby radia nie było, niż żeby było i nie działało.
  audio.addEventListener("error", function () {
    deck.style.display = "none";
    window.partyStart = function () {};
    window.partySync = function () {};
  });

  setBarFill(volEl, audio.volume);
  paint(false);

  // Ustawienie z Ustawień działa od razu po wejściu. Przeglądarki blokują
  // autoodtwarzanie bez kliknięcia — wtedy `start()` łapie odrzucenie
  // i panel po prostu zostaje na „Play".
  if (window.PREF && PREF.music === "on") start();
})();
