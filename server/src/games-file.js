/**
 * Czytanie katalogu gier z js/data-games.js — front i baza mają jedno źródło
 * prawdy co do nazw. Osobny plik, bo korzysta z tego i seed (potrzebuje bazy),
 * i pobieranie okładek (bazy nie potrzebuje).
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const GAMES_FILE = path.join(HERE, "..", "..", "js", "data-games.js");

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
