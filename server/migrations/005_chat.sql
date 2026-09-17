-- Czat ogólny — jeden pokój dla całego serwisu.
--
-- Po co: przy pustym serwisie lista ogłoszeń niczego nie mówi o tym, czy
-- ktokolwiek tu jest. Jeden wspólny pokój jest najtańszym sposobem, żeby to
-- było widać, i jedynym miejscem, gdzie pierwszych stu użytkowników może się
-- spotkać, zanim ogłoszeń będzie dość, żeby kogokolwiek znaleźć.
--
-- Nick zapisujemy razem z wiadomością (nie tylko user_id), bo historia ma
-- pokazywać, kto pisał wtedy — zmiana nazwy konta nie przepisuje starych
-- wiadomości.

CREATE TABLE chat_messages (
  id         TEXT         PRIMARY KEY,
  user_id    TEXT         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  nick       TEXT         NOT NULL,
  body       VARCHAR(300) NOT NULL,
  -- Skasowana wiadomość zostaje w tabeli, żeby stronicowanie po czasie się nie
  -- rozjeżdżało; API oddaje ją jako „wiadomość usunięta".
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Odpytywanie idzie po czasie: "daj wszystko nowsze niż to, co mam".
CREATE INDEX chat_messages_created_idx ON chat_messages (created_at);
CREATE INDEX chat_messages_user_idx    ON chat_messages (user_id, created_at DESC);
