"use strict";

/* =========================================================
   12c. REJESTRACJA / LOGOWANIE
========================================================= */
function updateAuthUI() {
  if (typeof applyAuthVisibility === "function") applyAuthVisibility();
  const guest = document.getElementById("userGuest");
  const logged = document.getElementById("userLogged");
  const nickEl = document.getElementById("userNickLabel");
  const metaEl = document.getElementById("userMetaLabel");
  const ava = document.getElementById("userAva");
  const menu = document.getElementById("userMenu");
  const btn = document.getElementById("userMenuBtn");
  const coinNum = document.getElementById("userMenuCoinNum");
  const verifyBtn = document.getElementById("userMenuVerify");
  const settingsBtn = document.getElementById("userMenuSettings");
  const logoutBtn = document.getElementById("userMenuLogout");
  const coinsBtn = document.getElementById("userMenuCoins");
  const loginOpen = document.getElementById("btnLoginOpen");

  if (loginOpen) {
    loginOpen.textContent = typeof t === "function" ? t("user.loginBtn") : "Zaloguj / Załóż konto";
    loginOpen.onclick = openAuthModal;
  }
  if (settingsBtn) settingsBtn.textContent = typeof t === "function" ? t("user.settings") : "Ustawienia";
  if (logoutBtn) logoutBtn.textContent = typeof t === "function" ? t("user.logout") : "Wyloguj";
  if (verifyBtn) verifyBtn.textContent = typeof t === "function" ? t("user.verifyEmail") : "Potwierdź e-mail";

  if (isLoggedIn()) {
    if (guest) guest.style.display = "none";
    if (logged) logged.style.display = "";
    const u = currentUser();
    const nick = (u && u.nick) ? u.nick : (SESSION && SESSION.nick) || "User";
    const email = u && u.email ? u.email : "";
    const phone = u && u.phone ? u.phone : "";
    const sub = email || phone || (typeof t === "function" ? t("user.logged") : "");

    if (nickEl) {
      if (u && u.email && !u.emailVerified) {
        nickEl.innerHTML = '<span class="u-nick-text"></span><span class="badge-unverified">' +
          (typeof t === "function" ? t("user.unverified") : "!") + "</span>";
        nickEl.querySelector(".u-nick-text").textContent = nick;
      } else if (u && (u.emailVerified || u.provider)) {
        nickEl.innerHTML = '<span class="u-nick-text"></span><span class="badge-verified" title="' +
          (typeof t === "function" ? t("user.verified") : "OK") + '">✓</span>';
        nickEl.querySelector(".u-nick-text").textContent = nick;
      } else {
        nickEl.textContent = nick;
      }
    }
    if (metaEl) metaEl.textContent = sub;

    if (ava) {
      try {
        if (typeof avatarArt === "function") {
          ava.style.backgroundImage = avatarArt(nick, (PREF && PREF.avaShift) || "");
        }
      } catch (e) {}
    }
    if (coinNum && typeof COINS !== "undefined") {
      coinNum.textContent = typeof nf === "function" ? nf(COINS.bal) : String(COINS.bal);
    }
    if (verifyBtn) {
      const need = !!(u && u.email && !u.emailVerified);
      verifyBtn.style.display = need ? "" : "none";
      verifyBtn.onclick = () => {
        closeUserMenu();
        openAuthModal("verify");
        startEmailVerifyUI(u);
      };
    }
    if (settingsBtn) settingsBtn.onclick = () => { closeUserMenu(); go("settings"); };
    if (coinsBtn) coinsBtn.onclick = () => { closeUserMenu(); go("shop"); };
    if (logoutBtn) logoutBtn.onclick = () => { closeUserMenu(); doLogout(); };
    const goClose = (v) => () => { closeUserMenu(); go(v); };
    const addBtn = document.getElementById("userMenuAdd");
    const mineBtn = document.getElementById("userMenuMine");
    const savedBtn = document.getElementById("userMenuSaved");
    const inboxBtn = document.getElementById("userMenuInbox");
    const shopBtn = document.getElementById("userMenuShop");
    const premBtn = document.getElementById("userMenuPremium");
    if (addBtn) addBtn.onclick = goClose("add");
    if (mineBtn) mineBtn.onclick = goClose("mine");
    if (savedBtn) savedBtn.onclick = goClose("saved");
    if (inboxBtn) inboxBtn.onclick = goClose("inbox");
    if (shopBtn) shopBtn.onclick = goClose("shop");
    if (premBtn) premBtn.onclick = goClose("premium");
    const disc = document.getElementById("userMenuDiscord");
    if (disc) disc.onclick = () => { closeUserMenu(); };
    if (btn) {
      btn.onclick = (e) => {
        e.stopPropagation();
        toggleUserMenu();
      };
    }
  } else {
    if (guest) guest.style.display = "";
    if (logged) logged.style.display = "none";
    closeUserMenu();
    if (nickEl) nickEl.textContent = typeof t === "function" ? t("user.guest") : "Gość";
    if (metaEl) metaEl.textContent = typeof t === "function" ? t("user.notLogged") : "";
  }
}

function closeUserMenu() {
  const menu = document.getElementById("userMenu");
  const btn = document.getElementById("userMenuBtn");
  if (btn) btn.setAttribute("aria-expanded", "false");
  if (!menu) return;
  window.clearTimeout(closeUserMenu._t);
  if (!menu.classList.contains("on") && !menu.classList.contains("out")) {
    menu.hidden = true;
    menu.classList.remove("on", "out");
    return;
  }
  menu.classList.remove("on");
  menu.classList.add("out");
  const done = () => {
    menu.classList.remove("out");
    menu.hidden = true;
    menu.removeEventListener("animationend", done);
  };
  menu.addEventListener("animationend", done);
  // fallback gdy animationend nie przyjdzie
  closeUserMenu._t = window.setTimeout(done, 250);
}
function openUserMenu() {
  const menu = document.getElementById("userMenu");
  const btn = document.getElementById("userMenuBtn");
  if (!menu) return;
  window.clearTimeout(closeUserMenu._t);
  menu.classList.remove("out");
  menu.hidden = false;
  // restart animacji wejścia
  menu.classList.remove("on");
  void menu.offsetWidth;
  menu.classList.add("on");
  if (btn) btn.setAttribute("aria-expanded", "true");
}
function toggleUserMenu() {
  const menu = document.getElementById("userMenu");
  if (!menu) return;
  if (menu.classList.contains("on")) closeUserMenu();
  else openUserMenu();
}

// close on outside click / Esc
document.addEventListener("click", e => {
  if (!e.target.closest("#userBox")) closeUserMenu();
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeUserMenu();
});

function openAuthModal(tab) {
  const modal = $("#authModal");
  if (!modal) return;
  const t0 = tab === "register" ? "register" : tab === "phone" ? "phone" : tab === "verify" ? "verify" : "login";
  setAuthTab(t0);
  $("#loginErr")?.classList.remove("on");
  $("#regErr")?.classList.remove("on");
  $("#phoneErr")?.classList.remove("on");
  $("#verifyErr")?.classList.remove("on");
  if ($("#loginNick")) $("#loginNick").value = "";
  if ($("#loginPass")) $("#loginPass").value = "";
  if ($("#regNick")) $("#regNick").value = "";
  if ($("#regEmail")) $("#regEmail").value = "";
  if ($("#regPass")) $("#regPass").value = "";
  if ($("#regPass2")) $("#regPass2").value = "";
  if ($("#phoneNum")) $("#phoneNum").value = "";
  if ($("#phoneCode")) $("#phoneCode").value = "";
  if ($("#phoneCodeField")) $("#phoneCodeField").style.display = "none";
  if ($("#btnPhoneSend")) $("#btnPhoneSend").style.display = "";
  if ($("#btnPhoneVerify")) $("#btnPhoneVerify").style.display = "none";
  modal.classList.add("on");
}
function closeAuthModal() {
  $("#authModal")?.classList.remove("on");
}
function setAuthTab(which) {
  const loginF = $("#authLoginForm");
  const regF = $("#authRegisterForm");
  const phoneF = $("#authPhoneForm");
  const verifyF = $("#authVerifyForm");
  const social = $("#authSocial");
  const div = $("#authDivider");
  const hint = $("#authHintMain");
  const tabL = $("#tabLogin");
  const tabR = $("#tabRegister");
  const tabP = $("#tabPhone");
  if (!loginF || !regF) return;
  const mode = which === "register" ? "register" : which === "phone" ? "phone" : which === "verify" ? "verify" : "login";
  loginF.style.display = mode === "login" ? "" : "none";
  regF.style.display = mode === "register" ? "" : "none";
  if (phoneF) phoneF.style.display = mode === "phone" ? "" : "none";
  if (verifyF) verifyF.style.display = mode === "verify" ? "" : "none";
  if (social) social.style.display = (mode === "login" || mode === "register") ? "" : "none";
  if (div) {
    div.style.display = (mode === "login" || mode === "register") ? "" : "none";
    div.textContent = mode === "register" ? "lub e-mail" : "lub e-mail / nick";
  }
  if (hint) hint.style.display = mode === "verify" ? "none" : "";
  tabL?.classList.toggle("on", mode === "login");
  tabR?.classList.toggle("on", mode === "register");
  tabP?.classList.toggle("on", mode === "phone");
  document.querySelectorAll(".auth-tabs button").forEach(b => {
    b.style.display = mode === "verify" ? "none" : "";
  });
}

function showAuthErr(id, msg) {
  const e = $(id);
  if (!e) return;
  e.textContent = msg;
  e.classList.add("on");
}

function genVerifyCode() {
  return String(100000 + Math.floor(Math.random() * 900000));
}

function saveUsers() { rawSave(KEY.users, USERS); }

function loginAsUser(user, msg) {
  SESSION = { userId: user.id, nick: user.nick, loggedAt: Date.now() };
  rawSave(KEY.session, SESSION);
  loadUserData();
  if ($("#aNick") && !$("#aNick").value) $("#aNick").value = user.nick;
  refreshAfterAuth();
  closeAuthModal();
  toast(msg || ("Zalogowano jako " + user.nick));
  if (user.email && !user.emailVerified && !user.provider) {
    setTimeout(() => {
      openAuthModal("verify");
      startEmailVerifyUI(user);
    }, 400);
  }
}

function startEmailVerifyUI(user) {
  pendingVerifyUserId = user.id;
  const code = genVerifyCode();
  user.verifyCode = code;
  user.verifySentAt = Date.now();
  saveUsers();
  if ($("#verifyEmailLab")) $("#verifyEmailLab").textContent = "Wysłaliśmy 6-cyfrowy kod na " + user.email + ".";
  if ($("#verifyDemoCode")) $("#verifyDemoCode").textContent = "Demo — Twój kod: " + code;
  document.querySelectorAll("#verifyCodeRow .vc").forEach(inp => { inp.value = ""; });
  const first = document.querySelector("#verifyCodeRow .vc");
  if (first) setTimeout(() => first.focus(), 100);
}

let pendingVerifyUserId = null;
let pendingPhone = { num: "", code: "", at: 0 };

function setupVerifyInputs() {
  const inputs = document.querySelectorAll("#verifyCodeRow .vc");
  inputs.forEach((inp, i) => {
    inp.addEventListener("input", () => {
      inp.value = inp.value.replace(/\D/g, "").slice(0, 1);
      if (inp.value && i < inputs.length - 1) inputs[i + 1].focus();
    });
    inp.addEventListener("keydown", e => {
      if (e.key === "Backspace" && !inp.value && i > 0) inputs[i - 1].focus();
    });
    inp.addEventListener("paste", e => {
      e.preventDefault();
      const t = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
      t.split("").forEach((ch, j) => { if (inputs[j]) inputs[j].value = ch; });
      if (inputs[Math.min(t.length, 5)]) inputs[Math.min(t.length, 5)].focus();
    });
  });
}

function getVerifyCodeInput() {
  return Array.from(document.querySelectorAll("#verifyCodeRow .vc")).map(i => i.value).join("");
}

function doVerifyEmail() {
  $("#verifyErr")?.classList.remove("on");
  const u = USERS.find(x => x.id === pendingVerifyUserId) || currentUser();
  if (!u) return showAuthErr("#verifyErr", "Brak sesji weryfikacji.");
  const code = getVerifyCodeInput();
  if (code.length !== 6) return showAuthErr("#verifyErr", "Wpisz pełny 6-cyfrowy kod.");
  if (code !== u.verifyCode) return showAuthErr("#verifyErr", "Nieprawidłowy kod.");
  u.emailVerified = true;
  delete u.verifyCode;
  saveUsers();
  refreshAfterAuth();
  closeAuthModal();
  toast("E-mail potwierdzony");
}

function resendVerifyEmail() {
  const u = USERS.find(x => x.id === pendingVerifyUserId) || currentUser();
  if (!u) return;
  startEmailVerifyUI(u);
  toast("Wysłano nowy kod");
}

async function doRegister() {
  const nick = ($("#regNick")?.value || "").trim();
  const email = ($("#regEmail")?.value || "").trim().toLowerCase();
  const pass = $("#regPass")?.value || "";
  const pass2 = $("#regPass2")?.value || "";
  $("#regErr")?.classList.remove("on");

  const minPass = DATA.minPassword;
  if (nick.length < 3) return showAuthErr("#regErr", "Nick musi mieć co najmniej 3 znaki.");
  if (nick.length > 24) return showAuthErr("#regErr", "Nick max 24 znaki.");
  if (!/^[a-zA-Z0-9_\-ąćęłńóśźżĄĆĘŁŃÓŚŹŻ.]+$/.test(nick)) return showAuthErr("#regErr", "Nick: litery, cyfry, _ - .");
  if (!email) return showAuthErr("#regErr", "Podaj adres e-mail.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showAuthErr("#regErr", "Podaj poprawny adres e-mail.");
  if (pass.length < minPass) return showAuthErr("#regErr", `Hasło musi mieć min. ${minPass} znaków.`);
  if (pass !== pass2) return showAuthErr("#regErr", "Hasła nie są takie same.");

  // Tryb serwerowy: konto zakłada backend, hasło nie wychodzi poza to żądanie.
  if (DATA.isApi) {
    try {
      await DATA.register({ email, password: pass, displayName: nick });
    } catch (e) {
      return showAuthErr("#regErr", e && e.message ? e.message : "Nie udało się założyć konta.");
    }
    if ($("#aNick") && !$("#aNick").value) $("#aNick").value = nick;
    refreshAfterAuth();
    closeAuthModal();
    toast("Konto utworzone — jesteś zalogowany");
    return;
  }

  if (USERS.some(u => u.nick.toLowerCase() === nick.toLowerCase())) return showAuthErr("#regErr", "Ten nick jest już zajęty.");
  if (USERS.some(u => u.email && u.email === email)) return showAuthErr("#regErr", "Ten e-mail jest już używany.");

  const salt = genSalt();
  const passHash = await hashPass(pass, salt);
  const user = {
    id: "u" + Date.now() + Math.floor(Math.random() * 999),
    nick,
    email,
    emailVerified: false,
    salt,
    passHash,
    created: Date.now()
  };
  USERS.push(user);
  rawSave(KEY.users, USERS);

  SESSION = { userId: user.id, nick: user.nick, loggedAt: Date.now() };
  rawSave(KEY.session, SESSION);
  loadUserData();
  if ($("#aNick") && !$("#aNick").value) $("#aNick").value = nick;
  refreshAfterAuth();
  setAuthTab("verify");
  startEmailVerifyUI(user);
  toast("Konto utworzone — potwierdź e-mail");
}

async function doLogin() {
  const ident = ($("#loginNick")?.value || "").trim();
  const pass = $("#loginPass")?.value || "";
  $("#loginErr")?.classList.remove("on");
  if (!ident || !pass) return showAuthErr("#loginErr", "Wpisz nick/e-mail i hasło.");

  // Tryb serwerowy: sesję zakłada backend i wraca ciasteczkiem httpOnly.
  if (DATA.isApi) {
    if (!ident.includes("@")) {
      return showAuthErr("#loginErr", "Na serwerze logujesz się adresem e-mail, nie nickiem.");
    }
    try {
      await DATA.login({ email: ident, password: pass });
    } catch (e) {
      return showAuthErr("#loginErr", e && e.message ? e.message : "Nie udało się zalogować.");
    }
    refreshAfterAuth();
    closeAuthModal();
    toast("Zalogowano jako " + (DATA.user.displayName || ident));
    return;
  }

  const user = USERS.find(u =>
    u.nick.toLowerCase() === ident.toLowerCase() ||
    (u.email && u.email === ident.toLowerCase())
  );
  if (!user) return showAuthErr("#loginErr", "Nie znaleziono konta o takim nicku lub e-mailu.");
  if (!user.passHash || !user.salt) return showAuthErr("#loginErr", "To konto loguje się przez Google/Discord/telefon.");

  const hash = await hashPass(pass, user.salt);
  if (hash !== user.passHash) return showAuthErr("#loginErr", "Nieprawidłowe hasło.");

  loginAsUser(user);
}

function socialLogin(provider) {
  // Tryb serwerowy: Discord to prawdziwy OAuth — wychodzimy na backend, który
  // przekierowuje do Discorda i wraca z gotową sesją.
  if (DATA.isApi) {
    if (provider === "discord") {
      location.href = DATA.discordLoginUrl();
      return;
    }
    openModal(`<h3 style="margin-bottom:8px">Google</h3>
      <p class="note" style="margin-top:10px">Logowanie przez Google nie jest jeszcze wpięte w backend. Na serwerze działa Discord albo e-mail z hasłem.</p>`);
    return;
  }

  openModal(`<h3 style="margin-bottom:8px">${provider === "google" ? "Google" : "Discord"}</h3>
    <p class="note" style="margin-bottom:12px">Połącz konto ${provider === "google" ? "Google" : "Discord"} z BigWW. W wersji produkcyjnej otworzy się oficjalne okno OAuth.</p>
    <div class="field"><label>Nick w BigWW</label>
      <input type="text" id="socNick" maxlength="24" placeholder="np. zimnyLisek" value=""></div>
    <div class="field"><label>E-mail z konta</label>
      <input type="email" id="socEmail" placeholder="gracz@gmail.com"></div>
    <p class="err" id="socErr" style="display:none"></p>
    <button class="btn pri" id="socGo" style="width:100%;margin-top:10px">Połącz i zaloguj</button>
    <p class="note" style="margin-top:10px">E-mail z ${provider === "google" ? "Google" : "Discord"} uznajemy za potwierdzony.</p>`);
  $("#socGo").onclick = () => {
    const nick = ($("#socNick")?.value || "").trim();
    const email = ($("#socEmail")?.value || "").trim().toLowerCase();
    const err = $("#socErr");
    if (nick.length < 3) { err.style.display = "block"; err.textContent = "Nick min. 3 znaki"; return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.style.display = "block"; err.textContent = "Podaj e-mail"; return; }
    let user = USERS.find(u => u.email === email || (u.provider === provider && u.providerId === email));
    if (!user) {
      if (USERS.some(u => u.nick.toLowerCase() === nick.toLowerCase())) {
        err.style.display = "block"; err.textContent = "Nick zajęty — wybierz inny"; return;
      }
      user = {
        id: "u" + Date.now() + Math.floor(Math.random() * 999),
        nick,
        email,
        emailVerified: true,
        provider,
        providerId: email,
        created: Date.now()
      };
      USERS.push(user);
      saveUsers();
    } else {
      user.provider = provider;
      user.emailVerified = true;
      saveUsers();
    }
    $("#modal").classList.remove("on");
    loginAsUser(user, "Zalogowano przez " + (provider === "google" ? "Google" : "Discord"));
  };
}

function phoneSendCode() {
  $("#phoneErr")?.classList.remove("on");
  if (DATA.isApi) {
    return showAuthErr("#phoneErr", "Logowanie numerem działa tylko w trybie lokalnym — backend nie wysyła SMS-ów. Użyj e-maila albo Discorda.");
  }
  let num = ($("#phoneNum")?.value || "").trim().replace(/[\s\-()]/g, "");
  if (!/^\+?[0-9]{9,15}$/.test(num)) return showAuthErr("#phoneErr", "Podaj poprawny numer (np. +48500000000).");
  if (!num.startsWith("+")) num = "+48" + num.replace(/^0/, "");
  const code = genVerifyCode();
  pendingPhone = { num, code, at: Date.now() };
  if ($("#phoneCodeField")) $("#phoneCodeField").style.display = "";
  if ($("#btnPhoneSend")) $("#btnPhoneSend").style.display = "none";
  if ($("#btnPhoneVerify")) $("#btnPhoneVerify").style.display = "";
  showAuthErr("#phoneErr", "");
  const e = $("#phoneErr");
  if (e) { e.classList.remove("on"); e.style.color = "var(--on)"; e.textContent = "Demo — kod SMS: " + code; e.classList.add("on"); }
  toast("Kod wysłany");
}

function phoneVerifyLogin() {
  $("#phoneErr")?.classList.remove("on");
  const code = ($("#phoneCode")?.value || "").trim();
  if (!pendingPhone.code || Date.now() - pendingPhone.at > 10 * 60 * 1000) return showAuthErr("#phoneErr", "Kod wygasł — wyślij ponownie.");
  if (code !== pendingPhone.code) return showAuthErr("#phoneErr", "Nieprawidłowy kod SMS.");
  let user = USERS.find(u => u.phone === pendingPhone.num);
  if (!user) {
    const nick = "tel" + pendingPhone.num.slice(-4) + Math.floor(Math.random() * 90 + 10);
    user = {
      id: "u" + Date.now() + Math.floor(Math.random() * 999),
      nick,
      phone: pendingPhone.num,
      email: "",
      emailVerified: false,
      provider: "phone",
      created: Date.now()
    };
    USERS.push(user);
    saveUsers();
  }
  loginAsUser(user, "Zalogowano numerem telefonu");
}

async function doLogout() {
  if (DATA.isApi) {
    try {
      await DATA.logout();
    } catch (e) {
      toast("Nie udało się wylogować — sprawdź połączenie z serwerem");
      return;
    }
  } else {
    SESSION = null;
    rawSave(KEY.session, null);
    loadUserData();
  }
  refreshAfterAuth();
  toast("Wylogowano");
  go("home");
}

function refreshAfterAuth() {
  countCache = null;
  applyTheme();
  updateAuthUI();
  updateBadges();
  updateCoinUI();
  updateLookingUI();
  renderHome();
  renderPlayers(true);
  renderMine();
  renderSaved();
  renderPremium();
  renderSettingsPrem();
  renderShop();
  renderLives();
  // restore filters UI if needed
  if ($("#sTheme")) $("#sTheme").value = PREF.theme;
  if ($("#sRegion")) $("#sRegion").value = PREF.region;
}

function requireLogin(actionLabel) {
  if (isLoggedIn()) return true;
  openModal(`<h3 style="margin-bottom:8px">Wymagane logowanie</h3>
    <p class="note">Aby ${actionLabel || "wykonać tę akcję"}, musisz mieć konto BigWW.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px">
      <button class="btn pri" id="needLogin">Zaloguj się</button>
      <button class="btn" id="needReg">Załóż konto</button>
    </div>`);
  $("#needLogin").onclick = () => { $("#modal").classList.remove("on"); openAuthModal("login"); };
  $("#needReg").onclick = () => { $("#modal").classList.remove("on"); openAuthModal("register"); };
  return false;
}

// bind auth UI
if ($("#tabLogin")) $("#tabLogin").onclick = () => setAuthTab("login");
if ($("#tabRegister")) $("#tabRegister").onclick = () => setAuthTab("register");
if ($("#tabPhone")) $("#tabPhone").onclick = () => setAuthTab("phone");
if ($("#btnDoLogin")) $("#btnDoLogin").onclick = () => doLogin();
if ($("#btnDoRegister")) $("#btnDoRegister").onclick = () => doRegister();
if ($("#authClose")) $("#authClose").onclick = closeAuthModal;
if ($("#authModal")) $("#authModal").onclick = e => { if (e.target.id === "authModal") closeAuthModal(); };
if ($("#btnLoginOpen")) $("#btnLoginOpen").onclick = openAuthModal;
if ($("#btnGoogle")) $("#btnGoogle").onclick = () => socialLogin("google");
if ($("#btnDiscord")) $("#btnDiscord").onclick = () => socialLogin("discord");
if ($("#btnPhoneSend")) $("#btnPhoneSend").onclick = phoneSendCode;
if ($("#btnPhoneVerify")) $("#btnPhoneVerify").onclick = phoneVerifyLogin;
if ($("#btnVerifyEmail")) $("#btnVerifyEmail").onclick = doVerifyEmail;
if ($("#btnResendVerify")) $("#btnResendVerify").onclick = resendVerifyEmail;
setupVerifyInputs();
["#loginPass", "#loginNick"].forEach(s => {
  const n = $(s);
  if (n) n.addEventListener("keydown", e => { if (e.key === "Enter") doLogin(); });
});
["#regPass2", "#regPass", "#regNick", "#regEmail"].forEach(s => {
  const n = $(s);
  if (n) n.addEventListener("keydown", e => { if (e.key === "Enter") doRegister(); });
});
["#phoneCode"].forEach(s => {
  const n = $(s);
  if (n) n.addEventListener("keydown", e => { if (e.key === "Enter") phoneVerifyLogin(); });
});

