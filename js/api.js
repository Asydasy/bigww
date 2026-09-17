"use strict";

/* BigWW — surowe wywołania HTTP do serwera.
 *
 * Widoki NIE korzystają z tego pliku bezpośrednio — idą przez DATA
 * (js/data-source.js), która wybiera między serwerem a danymi lokalnymi.
 * Tutaj jest tylko warstwa transportowa.
 *
 * Do wypróbowania z konsoli przeglądarki:
 *   await API.health()
 *   await API.games({ q: "elden" })
 *   await API.ads({ q: "rankedow", page: 1 })
 */

const API = (() => {
  /* Adres serwera nie jest z góry znany: strona może być otwarta z dysku,
   * spod localhost:3000, spod osobnego serwera na innym porcie albo przez
   * tunel z losowym adresem. Dlatego sprawdzamy po kolei kilka możliwości
   * i zostajemy przy pierwszej, która odpowiada na /health.
   *
   * Własny adres na sztywno: ustaw window.BIGWW_API_URL przed tym plikiem. */
  const candidates = [];
  if (window.BIGWW_API_URL) candidates.push(window.BIGWW_API_URL);
  // Ten sam host co strona — tak jest przy SERVE_STATIC=1 i przez tunel.
  if (location.protocol.startsWith("http")) candidates.push(location.origin + "/api");
  // Strona z dysku albo z osobnego serwera deweloperskiego.
  candidates.push("http://localhost:3000/api");

  let base = candidates[0];

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

  /**
   * Znajduje działający adres API. Woła to DATA.init() przed pierwszym
   * zapytaniem. Zwraca true, gdy któryś kandydat odpowiedział.
   */
  async function resolveBase() {
    for (const candidate of candidates) {
      const previous = base;
      base = candidate;
      try {
        await request("/health");
        return true;
      } catch {
        base = previous;
      }
    }
    return false;
  }

  return {
    ApiError,
    get base() { return base; },
    resolveBase,

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
    /** filtry: game, gameId, region, plat, style, time, hourFrom, hourTo, mic,
     *  rank, day, tag, lang, newHours, lookingNow, q, page, perPage */
    ads: (query) => request("/ads", { query }),
    ad: (id) => request("/ads/" + encodeURIComponent(id)),
    myAds: () => request("/ads/mine"),
    savedAds: () => request("/ads/saved"),
    createAd: (payload) => request("/ads", { method: "POST", body: payload }),
    updateAd: (id, payload) => request("/ads/" + encodeURIComponent(id), { method: "PATCH", body: payload }),
    deleteAd: (id) => request("/ads/" + encodeURIComponent(id), { method: "DELETE" }),
    saveAd: (id) => request("/ads/" + encodeURIComponent(id) + "/save", { method: "POST" }),
    unsaveAd: (id) => request("/ads/" + encodeURIComponent(id) + "/save", { method: "DELETE" }),

    // ---- czat ogólny ----
    /** Bez `after` — ostatnie wiadomości; z `after` (ms) — tylko nowsze. */
    chat: (query) => request("/chat", { query }),
    sendChat: (body) => request("/chat", { method: "POST", body: { body } }),
    deleteChat: (id) => request("/chat/" + encodeURIComponent(id), { method: "DELETE" })
  };
})();
