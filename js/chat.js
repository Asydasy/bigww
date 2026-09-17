"use strict";

/* =========================================================
   CZAT OGÓLNY — panel w menu bocznym
   =========================================================
   Jeden pokój dla całego serwisu. Czytać może każdy, pisać tylko zalogowany.
   Historia i wysyłka idą przez DATA (tryb serwerowy); bez backendu panel mówi
   wprost, że czat nie działa, zamiast udawać rozmowę z samym sobą.

   Odświeżanie: pytamy serwer co CZAT_ODSTEP_MS o wiadomości nowsze niż ostatnia,
   którą mamy. Pytamy tylko wtedy, gdy panel jest rozwinięty i karta przeglądarki
   jest widoczna — zamknięty panel i karta w tle nie generują ruchu.
========================================================= */

const CZAT_ODSTEP_MS = 5000;
const CZAT_MAX_ZNAKOW = 300;
/** Ile wiadomości trzymamy w panelu; starsze wypadają z góry. */
const CZAT_MAX_W_PANELU = 120;

let czatWiadomosci = [];
let czatOstatniCzas = 0;     // znacznik czasu ostatniej wiadomości, którą mamy
let czatTimer = null;
let czatNieprzeczytane = 0;
let czatWlaczony = false;    // czy tryb serwerowy w ogóle pozwala na czat
let czatPobieranie = false;

function czatOtwarty() {
  return !!(PREF && PREF.chatOpen);
}

/** Godzina bez sekund — w wąskim panelu data nie ma sensu. */
function czatGodzina(ts) {
  const d = new Date(ts);
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

function czatPanel() { return document.getElementById("chatPanel"); }

function ustawStanCzatu(tekst, klasa) {
  const box = document.getElementById("chatList");
  if (!box) return;
  box.innerHTML = "";
  const p = el("p", "chat-state" + (klasa ? " " + klasa : ""), tekst);
  box.append(p);
}

function renderChatBadge() {
  const b = document.getElementById("chatBadge");
  if (!b) return;
  const pokaz = czatNieprzeczytane > 0 && !czatOtwarty();
  b.textContent = czatNieprzeczytane > 9 ? "9+" : String(czatNieprzeczytane);
  b.classList.toggle("on", pokaz);
}

/** Jedna wiadomość. Treść wchodzi przez textContent — to jest cudzy tekst. */
function czatWiersz(m) {
  const row = el("div", "chat-msg" + (m.mine ? " mine" : ""));

  const head = el("div", "chat-msg-head");
  const nick = el("span", "chat-nick");
  nick.textContent = m.nick;
  const czas = el("span", "chat-time");
  czas.textContent = czatGodzina(m.at);
  head.append(nick, czas);

  if (m.mine && !m.deleted) {
    const del = el("button", "chat-del", "×");
    del.title = "Usuń wiadomość";
    del.onclick = async () => {
      try {
        await DATA.chatDelete(m.id);
        m.deleted = true;
        m.body = null;
        renderChat();
      } catch (e) {
        toast(e && e.message ? e.message : "Nie udało się usunąć");
      }
    };
    head.append(del);
  }

  const body = el("div", "chat-text" + (m.deleted ? " deleted" : ""));
  body.textContent = m.deleted ? "wiadomość usunięta" : m.body;

  row.append(head, body);
  return row;
}

function renderChat() {
  const box = document.getElementById("chatList");
  if (!box) return;

  if (!czatWlaczony) {
    ustawStanCzatu("Czat działa tylko z uruchomionym serwerem. Teraz strona chodzi na danych lokalnych.", "off");
    return;
  }
  if (!czatWiadomosci.length) {
    ustawStanCzatu("Pusto. Napisz pierwszy — reszta zobaczy to od razu.");
    return;
  }

  // Trzymamy się dołu tylko wtedy, gdy użytkownik nie przewinął w górę czytać.
  const naDole = box.scrollHeight - box.scrollTop - box.clientHeight < 40;

  box.innerHTML = "";
  const frag = document.createDocumentFragment();
  czatWiadomosci.forEach(m => frag.append(czatWiersz(m)));
  box.append(frag);

  if (naDole) box.scrollTop = box.scrollHeight;
}

function czatUstawPole() {
  const pole = document.getElementById("chatInput");
  const send = document.getElementById("chatSend");
  const info = document.getElementById("chatFormInfo");
  const form = document.getElementById("chatForm");
  if (!form) return;

  const mozePisac = czatWlaczony && isLoggedIn();
  form.style.display = czatWlaczony ? "" : "none";
  if (pole) {
    pole.disabled = !mozePisac;
    pole.placeholder = mozePisac ? "Napisz do wszystkich…" : "Zaloguj się, żeby pisać";
  }
  if (send) send.disabled = !mozePisac;
  if (info) {
    info.textContent = mozePisac ? "" : "Czytać może każdy, pisać tylko z kontem.";
    info.style.display = mozePisac ? "none" : "";
  }
}

/** Dokłada wiadomości, których jeszcze nie mamy, i liczy nieprzeczytane. */
function czatDoloz(nowe, liczNieprzeczytane) {
  if (!nowe || !nowe.length) return 0;
  const znane = new Set(czatWiadomosci.map(m => m.id));
  const doDodania = nowe.filter(m => !znane.has(m.id));

  // Skasowane w międzyczasie: serwer oddaje je z deleted=true, więc podmieniamy.
  nowe.forEach(m => {
    const stara = czatWiadomosci.find(x => x.id === m.id);
    if (stara && m.deleted && !stara.deleted) { stara.deleted = true; stara.body = null; }
  });

  if (!doDodania.length) return 0;
  czatWiadomosci = czatWiadomosci.concat(doDodania).slice(-CZAT_MAX_W_PANELU);
  czatOstatniCzas = Math.max(czatOstatniCzas, ...doDodania.map(m => m.at));

  const obce = doDodania.filter(m => !m.mine).length;
  if (liczNieprzeczytane && obce) czatNieprzeczytane += obce;
  return doDodania.length;
}

async function odswiezCzat(odNowa) {
  if (czatPobieranie) return;
  czatPobieranie = true;
  try {
    const res = await DATA.chatList(odNowa ? 0 : czatOstatniCzas);
    czatWlaczony = true;
    const doszlo = czatDoloz(res.messages, !odNowa && !czatOtwarty());
    if (doszlo || odNowa) renderChat();
    renderChatBadge();
    czatUstawPole();
  } catch (e) {
    if (e && e.status === 503) {
      czatWlaczony = false;
      renderChat();
      czatUstawPole();
      zatrzymajCzat();
    }
    // Chwilowy błąd sieci przemilczamy — kolejne odpytanie spróbuje znowu.
  } finally {
    czatPobieranie = false;
  }
}

function uruchomCzat() {
  zatrzymajCzat();
  if (!czatWlaczony || !czatOtwarty()) return;
  czatTimer = setInterval(() => {
    if (document.visibilityState === "visible") odswiezCzat(false);
  }, CZAT_ODSTEP_MS);
}
function zatrzymajCzat() {
  if (czatTimer) { clearInterval(czatTimer); czatTimer = null; }
}

function ustawCzatOtwarty(otwarty) {
  PREF.chatOpen = !!otwarty;
  save(KEY.pref, PREF);
  const panel = czatPanel();
  if (panel) panel.classList.toggle("open", !!otwarty);
  const btn = document.getElementById("chatToggle");
  if (btn) {
    btn.setAttribute("aria-expanded", otwarty ? "true" : "false");
    const strzalka = btn.querySelector(".chat-chev");
    if (strzalka) strzalka.textContent = otwarty ? "▾" : "▸";
  }
  if (otwarty) {
    czatNieprzeczytane = 0;
    renderChatBadge();
    odswiezCzat(false).then(() => {
      const box = document.getElementById("chatList");
      if (box) box.scrollTop = box.scrollHeight;
    });
    uruchomCzat();
  } else {
    zatrzymajCzat();
    renderChatBadge();
  }
}

async function wyslijCzat() {
  const pole = document.getElementById("chatInput");
  if (!pole) return;
  const tekst = (pole.value || "").trim();
  if (!tekst) return;
  if (tekst.length > CZAT_MAX_ZNAKOW) {
    toast("Maksymalnie " + CZAT_MAX_ZNAKOW + " znaków");
    return;
  }
  const send = document.getElementById("chatSend");
  if (send) send.disabled = true;
  try {
    const m = await DATA.chatSend(tekst);
    pole.value = "";
    czatDoloz([m], false);
    renderChat();
    const box = document.getElementById("chatList");
    if (box) box.scrollTop = box.scrollHeight;
  } catch (e) {
    if (e && e.status === 401) requireLogin("pisać na czacie");
    else toast(e && e.message ? e.message : "Nie udało się wysłać");
  } finally {
    czatUstawPole();
    if (pole && !pole.disabled) pole.focus();
  }
}

/** Woła to boot.js po rozpoznaniu trybu danych. */
function initChat(tryb) {
  czatWlaczony = tryb === "api";

  const btn = document.getElementById("chatToggle");
  if (btn) btn.onclick = () => ustawCzatOtwarty(!czatOtwarty());

  const form = document.getElementById("chatForm");
  if (form) {
    form.onsubmit = e => { e.preventDefault(); wyslijCzat(); };
  }
  const pole = document.getElementById("chatInput");
  if (pole) {
    pole.maxLength = CZAT_MAX_ZNAKOW;
    // Enter wysyła, Shift+Enter zostaje na przyszłość (pole jednolinijkowe).
    pole.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); wyslijCzat(); }
    });
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && czatOtwarty() && czatWlaczony) odswiezCzat(false);
  });

  const panel = czatPanel();
  if (panel) panel.classList.toggle("open", czatOtwarty());
  if (btn) {
    const strzalka = btn.querySelector(".chat-chev");
    if (strzalka) strzalka.textContent = czatOtwarty() ? "▾" : "▸";
  }

  czatUstawPole();
  if (!czatWlaczony) { renderChat(); return; }

  // Pierwsze pobranie leci zawsze — dzięki temu zwinięty panel pokazuje
  // odznakę z liczbą nowych wiadomości.
  odswiezCzat(true).then(() => {
    if (czatOtwarty()) uruchomCzat();
  });
}

/** Po zalogowaniu i wylogowaniu zmienia się to, czy wolno pisać. */
function chatPoAuth() {
  czatUstawPole();
  if (czatWlaczony) odswiezCzat(true);
}
