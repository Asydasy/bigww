"use strict";

/* BigWW — panel konta w sidebarze oraz okno logowania i rejestracji.
 *
 * W trybie demo (bez backendu) panel mówi wprost, że konta nie działają,
 * zamiast udawać, że da się zalogować.
 */

/**
 * Widoki dostępne dopiero po zalogowaniu. Gość ich nie widzi w menu, a próba
 * wejścia (np. przyciskiem na stronie startowej) otwiera okno logowania.
 */
const GUEST_HIDDEN = ["add", "mine", "saved", "premium", "shop"];

/** Czy patrzy na to niezalogowany gość. W trybie demo kont nie ma, więc nie. */
function isGuest() {
  return DATA.isApi && !DATA.user;
}

/** Pokazuje albo chowa to, co należy się dopiero zalogowanym. */
function applyAuthVisibility() {
  const guest = isGuest();

  document.querySelectorAll("#nav button[data-v], #bottomNav button[data-v]").forEach(b => {
    if (GUEST_HIDDEN.includes(b.dataset.v)) b.style.display = guest ? "none" : "";
  });

  // Druga przerwa w menu rozdziela grupy, które gościowi znikają w całości.
  const seps = document.querySelectorAll("#nav .nav-sep");
  if (seps[1]) seps[1].style.display = guest ? "none" : "";

  // Saldo monet WW to część konta — gość nie ma czego oglądać.
  const coin = $("#coinBal");
  if (coin) coin.style.display = guest ? "none" : "";

  // Gdyby gość został na ukrytym widoku (np. po wylogowaniu), wracamy na start.
  if (guest) {
    const current = document.querySelector(".page.on");
    if (current && GUEST_HIDDEN.includes(current.id.replace("v-", ""))) go("home");
  }
}

/** Rysuje kafelek konta nad monetami. */
function renderAccount() {
  const box = $("#account");
  if (!box) return;
  box.innerHTML = "";
  box.className = "account";

  if (!DATA.isApi) {
    const d = el("div", "acc-demo");
    d.innerHTML = `<b>Tryb demo</b><span>Bez serwera — dane tylko w tej przeglądarce</span>`;
    d.title = "Uruchom backend (docker compose up), żeby działały konta i wspólna baza ogłoszeń";
    box.append(d);
    return;
  }

  if (!DATA.user) {
    const b = el("button", "btn sm pri acc-btn", "Zaloguj się");
    // Uwaga: bez strzałki przeglądarka przekazałaby tu obiekt zdarzenia
    // jako nazwę zakładki i okno otwierałoby się na rejestracji.
    b.onclick = () => openAuth("login");
    box.append(b);
    return;
  }

  const row = el("div", "acc-row");
  const av = el("div", "ava sm");
  av.style.backgroundImage = avatarArt(DATA.user.avatarSeed || DATA.user.displayName, "");
  const info = el("div", "acc-info");
  info.append(
    el("b", null, DATA.user.displayName),
    el("span", "note", DATA.user.discordTag ? "Discord: " + DATA.user.discordTag : DATA.user.email || "")
  );
  const out = el("button", "btn sm ghost", "Wyloguj");
  out.onclick = async () => {
    await DATA.logout();
    renderAccount();
    applyAuthVisibility();
    toast("Wylogowano");
    await renderPlayers(true);
    updateBadges();
  };
  row.append(av, info, out);
  box.append(row);
}

/** Okno z dwiema zakładkami: logowanie i zakładanie konta. */
function openAuth(startTab = "login") {
  let tab = startTab;

  function draw() {
    const isLogin = tab === "login";
    openModal(`
      <h3 style="margin-bottom:4px">${isLogin ? "Zaloguj się" : "Załóż konto"}</h3>
      <p class="note" style="margin-bottom:14px">
        ${isLogin ? "Konto jest potrzebne, żeby dodać ogłoszenie i obserwować graczy." : "Wystarczy e-mail i hasło. Nick ustawisz w ogłoszeniu."}
      </p>

      <button class="btn pri" id="authDiscord" style="width:100%;margin-bottom:12px">Kontynuuj przez Discorda</button>
      <div class="auth-sep"><span>albo e-mailem</span></div>

      <div class="form-grid" style="margin-top:12px">
        ${isLogin ? "" : `<div class="field full"><label for="authName">Nazwa</label>
          <input type="text" id="authName" placeholder="np. Seba" autocomplete="nickname"></div>`}
        <div class="field full"><label for="authEmail">E-mail</label>
          <input type="email" id="authEmail" placeholder="ty@example.com" autocomplete="email"></div>
        <div class="field full"><label for="authPass">Hasło</label>
          <input type="password" id="authPass" placeholder="${isLogin ? "twoje hasło" : "minimum 8 znaków"}"
                 autocomplete="${isLogin ? "current-password" : "new-password"}"></div>
      </div>

      <div id="authError" class="auth-error" hidden></div>

      <button class="btn pri" id="authGo" style="width:100%;margin-top:14px">
        ${isLogin ? "Zaloguj" : "Załóż konto"}
      </button>
      <p class="note" style="margin-top:12px;text-align:center">
        ${isLogin ? "Nie masz konta?" : "Masz już konto?"}
        <a id="authSwitch" style="color:var(--acc);cursor:pointer">${isLogin ? "Załóż je" : "Zaloguj się"}</a>
      </p>
    `);

    const err = (msg) => {
      const box = $("#authError");
      box.textContent = msg;
      box.hidden = false;
    };

    $("#authDiscord").onclick = () => {
      location.href = API.discordLoginUrl();
    };

    $("#authSwitch").onclick = () => {
      tab = isLogin ? "register" : "login";
      draw();
    };

    const submit = async () => {
      const email = ($("#authEmail").value || "").trim();
      const pass = $("#authPass").value || "";
      const name = isLogin ? "" : ($("#authName").value || "").trim();

      if (!email.includes("@")) return err("Wpisz poprawny adres e-mail.");
      if (!isLogin && name.length < 2) return err("Nazwa musi mieć co najmniej 2 znaki.");
      if (pass.length < 8) return err(isLogin ? "Hasło ma co najmniej 8 znaków." : "Hasło musi mieć co najmniej 8 znaków.");

      $("#authGo").disabled = true;
      try {
        if (isLogin) await DATA.login({ email, password: pass });
        else await DATA.register({ email, password: pass, displayName: name });

        $("#modal").classList.remove("on");
        renderAccount();
        applyAuthVisibility();
        toast(isLogin ? "Zalogowano" : "Konto założone");
        await renderPlayers(true);
        renderMine();
        renderSaved();
        updateBadges();
      } catch (e) {
        $("#authGo").disabled = false;
        err(e.message || "Nie udało się. Spróbuj jeszcze raz.");
      }
    };

    $("#authGo").onclick = submit;
    ["#authEmail", "#authPass", "#authName"].forEach(s => {
      const inp = $(s);
      if (inp) inp.addEventListener("keydown", e => { if (e.key === "Enter") submit(); });
    });
    setTimeout(() => $(isLogin ? "#authEmail" : "#authName")?.focus(), 50);
  }

  draw();
}

/**
 * Wywoływane, gdy akcja wymaga konta. W trybie demo tłumaczy, czego brakuje,
 * zamiast otwierać okno logowania, którego i tak nie ma jak obsłużyć.
 */
function requireLogin(coZrobic = "zrobić to") {
  if (!DATA.isApi) {
    openModal(`<h3 style="margin-bottom:8px">To działa tylko z serwerem</h3>
      <p class="note">Strona chodzi teraz w trybie demo — bez backendu. Żeby ${coZrobic} na prawdziwym koncie,
      uruchom serwer poleceniem <code>docker compose up -d</code> i odśwież stronę.</p>
      <p class="note" style="margin-top:10px">W trybie demo ogłoszenia zapisują się tylko w tej przeglądarce.</p>`);
    return false;
  }
  openAuth("login");
  return false;
}
