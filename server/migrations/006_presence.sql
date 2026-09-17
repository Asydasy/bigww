-- Ślad ostatniej aktywności konta — do licznika „aktywnych teraz".
--
-- Liczymy konta, z których w ostatnich minutach przyszło jakiekolwiek żądanie
-- z ważną sesją. To NIE jest to samo co licznik na Starcie: tamten pokazuje
-- ogłoszenia z włączonym „szukam teraz" (kto szuka ekipy), ten pokazuje, ile
-- osób w ogóle jest na stronie. Dwie różne liczby i dwie różne nazwy.

ALTER TABLE users ADD COLUMN last_seen_at TIMESTAMPTZ;

-- Zapytanie licznika idzie po tej kolumnie i po niczym innym.
CREATE INDEX users_last_seen_idx ON users (last_seen_at);
