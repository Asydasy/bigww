import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";

const { Pool } = pg;

/**
 * Postgres zwraca BIGINT jako string, żeby nie stracić precyzji.
 * U nas żadna liczba nie wychodzi poza zakres Number, więc zamieniamy
 * od razu — inaczej count(*) wracałby jako "12" zamiast 12.
 */
pg.types.setTypeParser(pg.types.builtins.INT8, (v) => Number(v));

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX || 10)
});

/** @type {import("kysely").Kysely<import("./db-schema.js").DB>} */
export const db = new Kysely({
  dialect: new PostgresDialect({ pool })
});

export async function closeDb() {
  await db.destroy();
}
