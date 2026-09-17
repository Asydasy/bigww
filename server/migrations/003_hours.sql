-- Godziny grania od–do zamiast sztywnych pór dnia.
--
-- Pomysł i logika nachodzenia zakresów pochodzą z równoległej pracy nad
-- frontem; tutaj dostają odpowiednik w bazie, żeby filtr działał także wtedy,
-- gdy ogłoszeń są tysiące i nie da się ich przefiltrować w przeglądarce.

ALTER TABLE ads ADD COLUMN hour_from INTEGER CHECK (hour_from BETWEEN 0 AND 23);
ALTER TABLE ads ADD COLUMN hour_to   INTEGER CHECK (hour_to   BETWEEN 0 AND 23);

-- Stara kolumna zostaje dla ogłoszeń sprzed tej zmiany, ale nowe nie muszą
-- jej wypełniać — etykietę („17:00–22:00") API wylicza z godzin.
ALTER TABLE ads ALTER COLUMN time_of_day DROP NOT NULL;

CREATE INDEX ads_hours_idx ON ads (hour_from, hour_to);

-- Czy dwa zakresy godzin mają część wspólną.
--
-- Zakres może przechodzić przez północ (22–4), więc rozbijamy go wtedy na dwa
-- kawałki: [22,24) i [0,4). Zakres, w którym początek równa się końcowi,
-- traktujemy jako całą dobę. Pusty zakres po którejkolwiek stronie oznacza
-- „bez ograniczeń" i pasuje do wszystkiego.
--
-- Ta sama logika siedzi we froncie w hoursOverlap() — obie muszą dawać te same
-- wyniki, inaczej filtr pokazywałby co innego z backendem i bez niego.
CREATE OR REPLACE FUNCTION bigww_hours_overlap(
  a_from INTEGER, a_to INTEGER, b_from INTEGER, b_to INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  a_ranges INT4RANGE[];
  b_ranges INT4RANGE[];
  ra INT4RANGE;
  rb INT4RANGE;
BEGIN
  IF a_from IS NULL OR a_to IS NULL OR b_from IS NULL OR b_to IS NULL THEN
    RETURN TRUE;
  END IF;

  IF a_from = a_to THEN a_ranges := ARRAY[int4range(0, 24)];
  ELSIF a_from < a_to THEN a_ranges := ARRAY[int4range(a_from, a_to)];
  ELSE a_ranges := ARRAY[int4range(a_from, 24), int4range(0, a_to)];
  END IF;

  IF b_from = b_to THEN b_ranges := ARRAY[int4range(0, 24)];
  ELSIF b_from < b_to THEN b_ranges := ARRAY[int4range(b_from, b_to)];
  ELSE b_ranges := ARRAY[int4range(b_from, 24), int4range(0, b_to)];
  END IF;

  FOREACH ra IN ARRAY a_ranges LOOP
    FOREACH rb IN ARRAY b_ranges LOOP
      IF ra && rb THEN RETURN TRUE; END IF;
    END LOOP;
  END LOOP;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE;
