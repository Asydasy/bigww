/**
 * Prosty runner migracji: puszcza po kolei pliki z migrations/*.sql,
 * zapisuje w tabeli _migrations, które już poszły, i nie powtarza ich.
 * Każdy plik leci w transakcji — albo cały, albo wcale.
 *
 * Uruchomienie: npm run migrate
 */
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { pool, closeDb } from "./db.js";

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "migrations");

export async function migrate(log = console.log) {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name   TEXT PRIMARY KEY,
        run_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`);

    const done = new Set((await client.query("SELECT name FROM _migrations")).rows.map((r) => r.name));
    const files = (await readdir(DIR)).filter((f) => f.endsWith(".sql")).sort();

    let applied = 0;
    for (const file of files) {
      if (done.has(file)) continue;
      const sql = await readFile(path.join(DIR, file), "utf8");
      log(`  → ${file}`);
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
        applied++;
      } catch (err) {
        await client.query("ROLLBACK");
        throw new Error(`Migracja ${file} nie przeszła: ${err.message}`);
      }
    }
    log(applied ? `Migracje: ${applied} nowych.` : "Migracje: nic nowego.");
    return applied;
  } finally {
    client.release();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrate()
    .then(() => closeDb())
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}
