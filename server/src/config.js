/**
 * Konfiguracja z zmiennych środowiskowych. Wszystko w jednym miejscu, żeby
 * dało się zobaczyć na raz, czego serwer potrzebuje do startu.
 *
 * Zasada: poza produkcją serwer ma wstać bez żadnego pliku .env — po to, żeby
 * "git clone && docker compose up" działało u kogoś, kto widzi repo pierwszy
 * raz. Na produkcji (NODE_ENV=production) brakujące wartości są błędem.
 */
const isProd = process.env.NODE_ENV === "production";

const DEV_DATABASE_URL = "postgresql://bigww:bigww@localhost:5432/bigww";
const DEV_JWT_SECRET = "bigww-dev-tylko-lokalnie-nie-uzywaj-na-produkcji";

/** Wartość z środowiska albo awaryjna na czas pracy lokalnej. */
const withDevFallback = (name, fallback, note) => {
  const v = process.env[name];
  if (v) return v;
  if (isProd) {
    throw new Error(`Brak zmiennej środowiskowej ${name} — skopiuj server/.env.example do server/.env`);
  }
  console.warn(`[config] ${name} nie ustawione — ${note}`);
  return fallback;
};

export const config = {
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || "0.0.0.0",
  databaseUrl: withDevFallback("DATABASE_URL", DEV_DATABASE_URL, `używam ${DEV_DATABASE_URL}`),
  jwtSecret: withDevFallback("JWT_SECRET", DEV_JWT_SECRET, "używam klucza testowego, sesje nie są bezpieczne"),
  /** Skąd wolno wołać API (front na innym porcie niż serwer). */
  corsOrigin: (process.env.CORS_ORIGIN || "http://localhost:3000,http://localhost:8000,http://127.0.0.1:8000").split(","),
  /** Publiczny adres serwera — potrzebny Discordowi do powrotu po zalogowaniu. */
  publicUrl: process.env.PUBLIC_URL || "http://localhost:3000",
  /** Gdzie odesłać przeglądarkę po udanym logowaniu przez Discorda. */
  frontUrl: process.env.FRONT_URL || "http://localhost:3000/index.html",
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID || "",
    clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
    get enabled() {
      return Boolean(this.clientId && this.clientSecret);
    }
  },
  /** true = serwer oddaje też pliki frontu, więc wystarczy jeden adres. */
  serveStatic: process.env.SERVE_STATIC === "1",
  cookieName: "bigww_session",
  sessionDays: 30,
  isProd
};

/** Ile ogłoszeń wolno mieć na koncie. Te same liczby co w js/state.js —
 *  gdy zmieniasz tutaj, zmień też tam, inaczej front obiecuje co innego,
 *  niż serwer pozwala. */
export function adLimitFor(user) {
  const active = user.premium_until && new Date(user.premium_until) > new Date();
  if (!active) return 3;
  if (user.premium_plan === "pro" || user.premium_plan === "year") return 20;
  return 10;
}
