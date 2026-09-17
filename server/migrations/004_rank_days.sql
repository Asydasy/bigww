-- Ranga gracza i dni tygodnia, w które gra.
--
-- Oba pola powstały we froncie (wersja 1.0.0: RANK_LABEL i WEEK_DAYS w
-- js/state.js). Dopóki siedziały tylko w localStorage, po zalogowaniu na innym
-- komputerze znikały — stąd kolumny w bazie i filtry po stronie serwera.

ALTER TABLE ads ADD COLUMN rank TEXT
  CHECK (rank IS NULL OR rank IN ('beginner', 'mid', 'high', 'pro'));

-- Dni tygodnia jako skróty: mon, tue, wed, thu, fri, sat, sun.
-- Pusta tablica = gracz nie zadeklarował dni i pasuje do każdego filtru.
ALTER TABLE ads ADD COLUMN days TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX ads_rank_idx ON ads (rank);
CREATE INDEX ads_days_idx ON ads USING GIN (days);
