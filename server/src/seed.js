/**
 * Wypełnia tabelę games danymi z js/data-games.js — front i baza mają jedno
 * źródło prawdy co do nazw gier. Uruchamiać po migracjach: npm run seed
 *
 * Powtórne uruchomienie jest bezpieczne: istniejące gry są aktualizowane,
 * a nie duplikowane (klucz to nazwa).
 */
import { db, closeDb } from "./db.js";
import { parseGames } from "./games-file.js";

export async function seedGames(log = console.log) {
  const games = await parseGames();
  if (!games.length) throw new Error("Pusta lista gier — seed przerwany.");

  await db
    .insertInto("games")
    .values(games)
    .onConflict((oc) =>
      oc.column("name").doUpdateSet((eb) => ({
        genre: eb.ref("excluded.genre"),
        mode: eb.ref("excluded.mode"),
        plats: eb.ref("excluded.plats"),
        pop: eb.ref("excluded.pop")
      }))
    )
    .execute();

  const { count } = await db
    .selectFrom("games")
    .select((eb) => eb.fn.countAll().as("count"))
    .executeTakeFirstOrThrow();

  log(`Gry w bazie: ${count} (z pliku: ${games.length}).`);
  return Number(count);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedGames()
    .then(() => closeDb())
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}
