"use strict";

/* BigWW — jedyne miejsce, w którym front rozmawia z serwerem.
 *
 * Widoki jeszcze z tego nie korzystają: aplikacja dalej działa na danych demo
 * i localStorage. Ten plik jest gotową warstwą, na którą będziemy je
 * przepinać widok po widoku.
 *
 * Do wypróbowania z konsoli przeglądarki:
 *   await API.health()
 *   await API.games({ q: "elden" })
 *   await API.register({ email: "...", password: "...", displayName: "..." })
 *   await API.ads({ q: "rankedow", page: 1 })
 */

const API = (() => {
  /** Adres serwera. Gdy front jest serwowany przez backend (SERVE_STATIC=1),
   *  wystarczy pusty prefiks — wszystko leci na ten sam host. */
  const base =
    window.BIGWW_API_URL ||
    (location.port === "3000" || location.protocol === "file:" ? "" : "http://localhost:3000") + "/api";

  /** Błąd z serwera niosący kod HTTP — front może na niego reagować
   *  (np. 401 = pokaż logowanie, 403 = limit ogłoszeń). */
  class ApiError extends Error {
    constructor(status, message, data) {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.data = data;
    }
  }

  async function request(path, { method = "GET", body, query } = {}) {
    let url = base + path;
    if (query) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null && v !== "") params.set(k, v);
      }
      const qs = params.toString();
      if (qs) url += "?" + qs;
    }

    let res;
    try {
      res = await fetch(url, {
        method,
        // credentials: "include" — bez tego przeglądarka nie wyśle ciasteczka
        // sesji, gdy front stoi pod innym adresem niż serwer.
        credentials: "include",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined
      });
    } catch (e) {
      throw new ApiError(0, "Nie mogę połączyć się z serwerem. Czy backend jest uruchomiony?", null);
    }

    const data = res.headers.get("content-type")?.includes("application/json") ? await res.json() : null;
    if (!res.ok) throw new ApiError(res.status, (data && data.error) || `Błąd ${res.status}`, data);
    return data;
  }

  return {
    ApiError,
    base,

    health: () => request("/health"),

    // ---- konto ----
    me: () => request("/auth/me"),
    register: (payload) => request("/auth/register", { method: "POST", body: payload }),
    login: (payload) => request("/auth/login", { method: "POST", body: payload }),
    logout: () => request("/auth/logout", { method: "POST" }),
    /** Adres do przekierowania przy logowaniu przez Discorda. */
    discordLoginUrl: () => base + "/auth/discord",

    // ---- gry ----
    games: (query) => request("/games", { query }),
    genres: () => request("/games/genres"),

    // ---- ogłoszenia ----
    /** filtry: game, gameId, region, plat, style, time, mic, lookingNow, q, page, perPage */
    ads: (query) => request("/ads", { query }),
    ad: (id) => request("/ads/" + encodeURIComponent(id)),
    myAds: () => request("/ads/mine"),
    savedAds: () => request("/ads/saved"),
    createAd: (payload) => request("/ads", { method: "POST", body: payload }),
    updateAd: (id, payload) => request("/ads/" + encodeURIComponent(id), { method: "PATCH", body: payload }),
    deleteAd: (id) => request("/ads/" + encodeURIComponent(id), { method: "DELETE" }),
    saveAd: (id) => request("/ads/" + encodeURIComponent(id) + "/save", { method: "POST" }),
    unsaveAd: (id) => request("/ads/" + encodeURIComponent(id) + "/save", { method: "DELETE" })
  };
})();
