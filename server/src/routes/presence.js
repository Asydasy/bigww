/**
 * Licznik „aktywnych teraz" — ile kont miało kontakt z serwerem w ostatnich
 * minutach.
 *
 * Czym to NIE jest: licznikiem ze strony startowej. Tamten pokazuje ogłoszenia
 * z włączonym „szukam teraz", czyli ilu ludzi szuka ekipy. Ten pokazuje, ile
 * osób w ogóle jest na stronie. Dwie różne liczby — i dlatego mają dwie różne
 * nazwy w interfejsie („szuka teraz" kontra „aktywnych").
 *
 * Liczymy tylko konta. Niezalogowanego gościa nie da się policzyć bez
 * zostawiania mu czegoś w przeglądarce, a to nie jest tego warte.
 */
import { sql } from "kysely";
import { db } from "../db.js";

/** Ile minut wstecz uznajemy za „teraz". */
export const OKNO_MINUT = 5;

export async function liczAktywnych() {
  const { ile } = await db
    .selectFrom("users")
    .select((eb) => eb.fn.countAll().as("ile"))
    .where(sql`last_seen_at`, ">", sql`now() - make_interval(mins => ${OKNO_MINUT})`)
    .executeTakeFirstOrThrow();
  return Number(ile);
}

export default async function presenceRoutes(app) {
  app.get("/", { preHandler: [app.optionalAuth] }, async () => ({
    online: await liczAktywnych(),
    windowMinutes: OKNO_MINUT
  }));
}
