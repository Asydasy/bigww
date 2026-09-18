"use strict";

/* Pływające okienka prywatnych wiadomości.
 *
 * Widok „Skrzynka" (renderInbox w state.js) i te okienka pokazują te same
 * wątki — jedno źródło, `DM_THREADS`, odświeżane przez `refreshInbox()`.
 * Tutaj nie ma własnego stanu i nie ma zapisu do localStorage: wysyłka idzie
 * przez `sendInboxMessage()`, czyli przez `DATA`, tak jak każdy inny zapis.
 *
 * Nick i treść wiadomości wstawiamy przez `textContent`. Wiadomość pisze druga
 * osoba, więc `innerHTML` byłby tu gotowym XSS-em na cudzym koncie.
 */
(function () {
  /** Co ile pytamy serwer o nowe wiadomości przy otwartym okienku. */
  const ODSWIEZANIE_MS = 5000;

  function watek(tid) {
    return (typeof DM_THREADS !== "undefined" ? DM_THREADS : []).find(t => t.id === tid) || null;
  }

  function paintBadge() {
    const badge = document.getElementById("nb-inbox");
    if (!badge) return;
    const n = typeof inboxUnreadCount === "function" ? inboxUnreadCount() : 0;
    badge.textContent = n > 9 ? "9+" : (n ? String(n) : "");
    badge.classList.toggle("on", n > 0);
  }

  window.imRefresh = function () {
    paintBadge();
    const list = document.getElementById("imList");
    if (!list) return;

    const rows = (typeof DM_THREADS !== "undefined" ? DM_THREADS : [])
      .slice()
      .sort((a, b) => (b.updated || 0) - (a.updated || 0));

    list.innerHTML = "";
    if (!rows.length) {
      const pusto = el("p", "im-empty", "Kliknij „Napisz” na karcie gracza.");
      list.append(pusto);
      return;
    }

    rows.forEach(t => {
      const last = (t.messages || [])[t.messages.length - 1];
      const btn = el("button", "im-row" + (t.unread ? " unread" : ""));
      btn.type = "button";
      btn.dataset.tid = t.id;
      btn.append(el("b", null, t.withNick));
      btn.append(el("span", null, (last && last.text) || ""));
      if (t.unread) btn.append(el("em", null, t.unread > 9 ? "9+" : String(t.unread)));
      list.append(btn);
    });
  };

  window.imPaintChat = function (tid) {
    const box = document.querySelector('.im-chat[data-tid="' + tid + '"] .im-msgs');
    if (!box) return;
    const th = watek(tid);
    if (!th) return;
    box.innerHTML = "";
    (th.messages || []).forEach(m => {
      const b = el("div", "im-b " + (m.mine || m.from === (currentUser() || {}).id ? "mine" : "theirs"));
      b.textContent = m.text;
      box.append(b);
    });
    box.scrollTop = box.scrollHeight;
  };

  window.imSetStatus = function (tid, msg) {
    const st = document.querySelector('.im-chat[data-tid="' + tid + '"] .im-status');
    if (st) st.textContent = msg || "";
  };

  /** Otwiera okienko rozmowy z autorem ogłoszenia. */
  window.imOpen = async function (player) {
    if (!player) return;
    if (typeof requireLogin === "function" && !requireLogin("napisać wiadomość")) return;

    // Wątek zakłada się dopiero przy pierwszej wiadomości, więc zanim ktoś coś
    // napisze, okienko pracuje na „pustym" wątku trzymanym tylko w oknie.
    const znany = (typeof DM_THREADS !== "undefined" ? DM_THREADS : [])
      .find(t => String(t.withId) === String(player.id));
    const tid = znany ? znany.id : "nowy_" + player.id;

    let win = document.querySelector('.im-chat[data-tid="' + tid + '"]');
    if (!win) {
      win = el("div", "im-chat");
      win.dataset.tid = tid;

      const bar = el("div", "im-chat-bar");
      bar.append(el("b", null, player.nick || "Gracz"));
      const x = el("button", "im-x", "×");
      x.type = "button";
      x.onclick = () => win.remove();
      bar.append(x);

      const msgs = el("div", "im-msgs");
      const status = el("div", "im-status");
      const form = el("form", "im-send");
      const inp = el("input");
      inp.maxLength = 400;
      inp.placeholder = "Napisz wiadomość";
      inp.autocomplete = "off";
      const send = el("button", null, "Wyślij");
      send.type = "submit";
      form.append(inp, send);

      win.append(bar, msgs, status, form);
      document.getElementById("imRoot").append(win);

      przeciaganie(win, bar);

      form.onsubmit = async e => {
        e.preventDefault();
        const text = (inp.value || "").trim();
        if (!text) return;
        inp.value = "";
        status.textContent = "wysyłanie…";
        const ok = await sendInboxMessage({ id: player.id, nick: player.nick }, text);
        status.textContent = ok ? "" : "nie wysłano";
        if (ok) {
          // Po pierwszej wiadomości wątek dostaje prawdziwy identyfikator
          // z serwera — okienko przesiada się na niego.
          const teraz = (typeof DM_THREADS !== "undefined" ? DM_THREADS : [])
            .find(t => String(t.withId) === String(player.id));
          if (teraz && teraz.id !== win.dataset.tid) win.dataset.tid = teraz.id;
          imPaintChat(win.dataset.tid);
        }
        inp.focus();
      };
    }

    if (znany) {
      imPaintChat(tid);
      if (znany.unread) {
        DATA.dmMarkRead(znany.id).then(() => { znany.unread = 0; paintBadge(); imRefresh(); }).catch(() => {});
      }
    }
    win.querySelector("input").focus();
    imRefresh();
  };

  function przeciaganie(win, bar) {
    let drag = null;
    bar.onpointerdown = e => {
      if (e.target.closest("button")) return;
      const r = win.getBoundingClientRect();
      drag = { x: e.clientX - r.left, y: e.clientY - r.top };
      try { bar.setPointerCapture(e.pointerId); } catch (err) {}
    };
    bar.onpointermove = e => {
      if (!drag) return;
      win.style.left = Math.max(0, Math.min(window.innerWidth - win.offsetWidth, e.clientX - drag.x)) + "px";
      win.style.top = Math.max(0, Math.min(window.innerHeight - win.offsetHeight, e.clientY - drag.y)) + "px";
      win.style.right = "auto";
      win.style.bottom = "auto";
    };
    bar.onpointerup = () => { drag = null; };
    bar.onpointercancel = () => { drag = null; };
  }

  /* ---- panel ze spisem rozmów ---- */
  if (!document.getElementById("imRoot")) {
    const root = el("div");
    root.id = "imRoot";
    document.body.append(root);
  }
  const root = document.getElementById("imRoot");

  if (!document.getElementById("imPanel")) {
    const panel = el("div");
    panel.id = "imPanel";
    panel.hidden = true;
    panel.append(el("div", "im-head", "Skrzynka"));
    const list = el("div");
    list.id = "imList";
    panel.append(list);
    root.prepend(panel);
  }

  document.getElementById("imList").onclick = e => {
    const row = e.target.closest(".im-row");
    if (!row) return;
    const t = watek(row.dataset.tid);
    if (t) imOpen({ id: t.withId, nick: t.withNick });
  };

  const top = document.getElementById("inboxTopBtn");
  if (top) {
    top.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      const p = document.getElementById("imPanel");
      p.hidden = !p.hidden;
      if (!p.hidden && typeof refreshInbox === "function") refreshInbox();
    };
  }

  // Odpytujemy tylko wtedy, gdy jest po co: zalogowany i karta na wierzchu.
  setInterval(() => {
    if (document.hidden) return;
    if (typeof isLoggedIn !== "function" || !isLoggedIn()) return;
    const panelOtwarty = !document.getElementById("imPanel").hidden;
    const oknoOtwarte = !!document.querySelector(".im-chat");
    if (!panelOtwarty && !oknoOtwarte) return;
    if (typeof refreshInbox === "function") {
      refreshInbox().then(() => {
        imRefresh();
        document.querySelectorAll(".im-chat").forEach(w => imPaintChat(w.dataset.tid));
      });
    }
  }, ODSWIEZANIE_MS);

  paintBadge();
})();
