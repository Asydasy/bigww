-- Wyszukiwanie odporne na polskie znaki.
--
-- Problem: ILIKE '%rankedow%' nie znajdzie "rankedów", a ludzie wpisują
-- w wyszukiwarkę bez ogonków. Front robił to od zawsze (funkcja norm()),
-- baza musi robić dokładnie to samo, inaczej wyniki się rozjeżdżają.

CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Własna funkcja: małe litery bez znaków diakrytycznych.
-- IMMUTABLE, żeby dało się po niej budować indeksy (samo unaccent jest tylko
-- STABLE, bo zależy od słownika — tu przypinamy słownik na sztywno).
CREATE OR REPLACE FUNCTION bigww_norm(txt TEXT) RETURNS TEXT AS $$
  SELECT lower(public.unaccent('public.unaccent', COALESCE(txt, '')))
$$ LANGUAGE SQL IMMUTABLE PARALLEL SAFE;

-- Gotowa do szukania treść ogłoszenia: nick + opis + tagi, znormalizowane.
-- Trzymamy ją w kolumnie, bo array_to_string() nie jest IMMUTABLE i nie da się
-- po nim zbudować indeksu wprost. Kolumnę pilnuje wyzwalacz poniżej.
ALTER TABLE ads ADD COLUMN search_text TEXT NOT NULL DEFAULT '';

CREATE OR REPLACE FUNCTION ads_refresh_search() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_text := bigww_norm(
    NEW.nick || ' ' || NEW.descr || ' ' || array_to_string(NEW.tags, ' ')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ads_search_trg
  BEFORE INSERT OR UPDATE ON ads
  FOR EACH ROW EXECUTE FUNCTION ads_refresh_search();

-- Wypełnia kolumnę dla ogłoszeń, które już są w bazie.
UPDATE ads SET nick = nick;

CREATE INDEX ads_search_idx ON ads USING gin (search_text gin_trgm_ops);
CREATE INDEX games_name_search_idx ON games USING gin (bigww_norm(name) gin_trgm_ops);
