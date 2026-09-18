-- Prywatne wiadomości między dwiema osobami.
--
-- Po co osobno od `chat_messages`: czat ogólny to jeden pokój, który czyta
-- każdy. Tutaj rozmowa ma dokładnie dwóch uczestników i nikt trzeci nie ma
-- prawa jej zobaczyć — to inny zbiór zasad i inny sposób odpytywania
-- (po wątku, nie po czasie).
--
-- Wątek jest jeden na parę kont, niezależnie od tego, kto zaczął. Żeby nie
-- powstały dwa wątki na tę samą parę, `id` jest wyliczane z posortowanych
-- identyfikatorów i to ono jest kluczem głównym. Ta sama zasada pilnuje
-- `user_a` / `user_b`: zawsze user_a < user_b.

CREATE TABLE dm_threads (
  id          TEXT        PRIMARY KEY,
  user_a      TEXT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  user_b      TEXT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  -- Kiedy każdy z uczestników ostatnio otworzył wątek. Licznik nieprzeczytanych
  -- to po prostu wiadomości nowsze niż ten znacznik — nie trzeba go zliczać
  -- przy każdym wysłaniu ani pilnować, żeby się nie rozjechał.
  a_read_at   TIMESTAMPTZ,
  b_read_at   TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT dm_threads_kolejnosc CHECK (user_a < user_b)
);

CREATE INDEX dm_threads_a_idx ON dm_threads (user_a, updated_at DESC);
CREATE INDEX dm_threads_b_idx ON dm_threads (user_b, updated_at DESC);

CREATE TABLE dm_messages (
  id         TEXT         PRIMARY KEY,
  thread_id  TEXT         NOT NULL REFERENCES dm_threads (id) ON DELETE CASCADE,
  from_id    TEXT         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  -- Nick z chwili wysłania, tak samo jak w czacie ogólnym: zmiana nazwy konta
  -- nie przepisuje starych wiadomości.
  nick       TEXT         NOT NULL,
  body       VARCHAR(400) NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX dm_messages_thread_idx ON dm_messages (thread_id, created_at);
