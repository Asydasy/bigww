/**
 * Kształt bazy dla Kysely. Dzięki temu edytor podpowiada nazwy tabel i kolumn
 * w zwykłym JavaScripcie i krzyczy przy literówce w zapytaniu.
 *
 * Po zmianie migracji zaktualizuj ten plik — nie generuje się sam.
 */
import type { Generated, ColumnType } from "kysely";

type Timestamp = ColumnType<Date, Date | string | undefined, Date | string>;

export interface UsersTable {
  id: string;
  email: string | null;
  password_hash: string | null;
  discord_id: string | null;
  discord_tag: string | null;
  display_name: string;
  avatar_seed: string;
  region: Generated<string>;
  coins: Generated<number>;
  premium_plan: string | null;
  premium_until: Timestamp | null;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
}

export interface GamesTable {
  id: Generated<number>;
  name: string;
  genre: string;
  mode: string;
  plats: string[];
  pop: number;
}

export interface AdsTable {
  id: string;
  user_id: string;
  game_id: number;
  nick: string;
  age: number;
  region: string;
  plat: string;
  style: string;
  time_of_day: string | null;
  /** Godziny grania od–do (0-23). Null = nie podano. */
  hour_from: number | null;
  hour_to: number | null;
  mic: string;
  lang: Generated<string>;
  /** beginner | mid | high | pro. Null = nie podano. */
  rank: string | null;
  /** Dni tygodnia: mon, tue, wed, thu, fri, sat, sun. Pusta = bez ograniczeń. */
  days: Generated<string[]>;
  descr: string;
  tags: Generated<string[]>;
  contact: string | null;
  clip_url: string | null;
  looking_now: Generated<boolean>;
  /** Pilnowana przez wyzwalacz: nick + opis + tagi bez polskich znaków. */
  search_text: Generated<string>;
  boost_until: Timestamp | null;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
}

export interface SavesTable {
  user_id: string;
  ad_id: string;
  created_at: Generated<Timestamp>;
}

export interface MigrationsTable {
  name: string;
  run_at: Generated<Timestamp>;
}

export interface DB {
  users: UsersTable;
  games: GamesTable;
  ads: AdsTable;
  saves: SavesTable;
  _migrations: MigrationsTable;
}
