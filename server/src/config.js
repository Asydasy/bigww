/**
 * Konfiguracja z zmiennych środowiskowych. Wszystko w jednym miejscu, żeby
 * dało się zobaczyć na raz, czego serwer potrzebuje do startu.
 */
const required = (name) => {
  const v = process.env[name];
  if (!v) throw new Error(`Brak zmiennej środowiskowej ${name} — skopiuj .env.example do .env`);
  return v;
};

export const config = {
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || "0.0.0.0",
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  /** Skąd wolno wołać API (front na innym porcie niż serwer). */
  corsOrigin: (process.env.CORS_ORIGIN || "http://localhost:8000").split(","),
  /** Publiczny adres serwera — potrzebny Discordowi do powrotu po zalogowaniu. */
  publicUrl: process.env.PUBLIC_URL || "http://localhost:3000",
  /** Gdzie odesłać przeglądarkę po udanym logowaniu przez Discorda. */
  frontUrl: process.env.FRONT_URL || "http://localhost:8000/index.html",
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
  isProd: process.env.NODE_ENV === "production"
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
