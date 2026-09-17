/**
 * Wypełnia tabelę games danymi z js/data-games.js — front i baza mają jedno
 * źródło prawdy co do nazw gier. Uruchamiać po migracjach: npm run seed
 *
 * Powtórne uruchomienie jest bezpieczne: istniejące gry są aktualizowane,
 * a nie duplikowane (klucz to nazwa).
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { db, closeDb } from "./db.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GAMES_FILE = path.join(HERE, "..", "..", "js", "data-games.js");

export async function parseGames(file = GAMES_FILE) {
  const src = await readFile(file, "utf8");
  const block = src.match(/const GAME_DATA = `([\s\S]*?)`\.trim\(\)/);
  if (!block) throw new Error(`Nie znalazłem GAME_DATA w ${file}`);
  return block[1]
    .trim()
    .split("\n")
    .map((line) => line.split("|"))
    .filter((p) => p.length === 5)
    .map(([name, genre, mode, plats, pop]) => ({
      name: name.trim(),
      genre: genre.trim(),
      mode: mode.trim(),
      plats: plats.trim().split(","),
      pop: Number(pop)
    }));
}

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
