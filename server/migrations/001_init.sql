-- BigWW — pierwsza migracja: konta, gry, ogłoszenia, obserwowani.
-- Uwaga na nazwy: "time" i "desc" to słowa zastrzeżone w SQL, więc w bazie
-- kolumny nazywają się time_of_day i descr. API zamienia je z powrotem na
-- time i desc, żeby front nie musiał nic zmieniać.

CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE,
  password_hash TEXT,
  discord_id    TEXT UNIQUE,
  discord_tag   TEXT,
  display_name  TEXT        NOT NULL,
  avatar_seed   TEXT        NOT NULL,
  region        TEXT        NOT NULL DEFAULT 'Polska',
  -- Monety WW żyją tutaj, nie w przeglądarce. Front tylko je wyświetla.
  coins         INTEGER     NOT NULL DEFAULT 40,
  premium_plan  TEXT,
  premium_until TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Konto musi dać się zalogować przynajmniej jedną drogą: hasłem albo Discordem.
  -- Konto z Discorda nie ma hasła i to jest w porządku.
  CONSTRAINT users_has_credentials CHECK (password_hash IS NOT NULL OR discord_id IS NOT NULL)
);

CREATE TABLE games (
  id    SERIAL PRIMARY KEY,
  name  TEXT    NOT NULL UNIQUE,
  genre TEXT    NOT NULL,
  mode  TEXT    NOT NULL,
  plats TEXT[]  NOT NULL,
  pop   INTEGER NOT NULL
);
CREATE INDEX games_genre_idx ON games (genre);

CREATE TABLE ads (
  id          TEXT PRIMARY KEY,
  user_id     TEXT         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  game_id     INTEGER      NOT NULL REFERENCES games (id),
  nick        TEXT         NOT NULL,
  age         INTEGER      NOT NULL CHECK (age BETWEEN 13 AND 99),
  region      TEXT         NOT NULL,
  plat        TEXT         NOT NULL,
  style       TEXT         NOT NULL,
  time_of_day TEXT         NOT NULL,
  mic         TEXT         NOT NULL,
  lang        TEXT         NOT NULL DEFAULT 'PL',
  descr       VARCHAR(320) NOT NULL,
  tags        TEXT[]       NOT NULL DEFAULT '{}',
  contact     TEXT,
  clip_url    TEXT,
  -- „Szukam teraz" — podbija ogłoszenie w sortowaniu.
  looking_now BOOLEAN      NOT NULL DEFAULT false,
  -- Do kiedy działa wykupiony boost; NULL albo przeszłość = brak boosta.
  boost_until TIMESTAMPTZ,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX ads_game_idx    ON ads (game_id);
CREATE INDEX ads_region_idx  ON ads (region);
CREATE INDEX ads_created_idx ON ads (created_at DESC);
CREATE INDEX ads_user_idx    ON ads (user_id);

CREATE TABLE saves (
  user_id    TEXT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  ad_id      TEXT        NOT NULL REFERENCES ads (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, ad_id)
);
