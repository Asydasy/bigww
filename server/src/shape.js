/**
 * Zamiana wierszy z bazy na kształt, którego oczekuje front.
 * W bazie kolumny nazywają się time_of_day i descr (bo "time" i "desc" to
 * słowa zastrzeżone w SQL) — tutaj wracają jako time i desc.
 */

/** „17:00–22:00" z pary godzin; null, gdy ich nie ma. */
export function timeLabel(from, to) {
  if (from === null || from === undefined || to === null || to === undefined) return null;
  const pad = (n) => String(((Number(n) % 24) + 24) % 24).padStart(2, "0") + ":00";
  return pad(from) + "–" + pad(to);
}

export function isPremium(user) {
  return Boolean(user?.premium_until && new Date(user.premium_until) > new Date());
}

export function publicUser(user) {
  return {
    id: user.id,
    displayName: user.display_name,
    email: user.email,
    discordTag: user.discord_tag,
    avatarSeed: user.avatar_seed,
    region: user.region,
    coins: user.coins,
    premium: isPremium(user) ? { plan: user.premium_plan, until: user.premium_until } : null,
    createdAt: user.created_at
  };
}

/**
 * @param row wiersz z ads złączony z games i users
 * @param viewer zalogowany użytkownik albo null
 */
export function publicAd(row, viewer = null) {
  const mine = Boolean(viewer && row.user_id === viewer.id);
  const ownerPremium = Boolean(row.owner_premium_until && new Date(row.owner_premium_until) > new Date());

  return {
    id: row.id,
    nick: row.nick,
    age: row.age,
    region: row.region,
    game: row.game_name,
    gameId: row.game_id,
    plat: row.plat,
    style: row.style,
    time: timeLabel(row.hour_from, row.hour_to) || row.time_of_day || "Elastycznie",
    hourFrom: row.hour_from,
    hourTo: row.hour_to,
    mic: row.mic,
    lang: row.lang,
    rank: row.rank,
    days: row.days || [],
    tags: row.tags,
    desc: row.descr,
    clipUrl: row.clip_url,
    lookingNow: row.looking_now,
    // Pola, których baza jeszcze nie liczy, a front ich oczekuje na karcie.
    // „szukam teraz" traktujemy jako status online; godziny i ocena wracają,
    // gdy będzie co liczyć (historia sesji, oceny ekip).
    status: row.looking_now ? "on" : "idle",
    hours: 0,
    rating: "—",
    boosted: Boolean(row.boost_until && new Date(row.boost_until) > new Date()),
    prem: ownerPremium,
    added: new Date(row.created_at).getTime(),
    mine,
    // Kontakt widzi każdy zalogowany. Płatne odblokowywanie wróci dopiero
    // wtedy, gdy będzie prawdziwa bramka płatnicza — do tego czasu blokowanie
    // kontaktu za monety, których nie da się kupić, zamykałoby serwis
    // dokładnie w tym miejscu, po co ludzie na niego wchodzą.
    contact: viewer ? row.contact : null,
    contactLocked: !viewer && Boolean(row.contact)
  };
}

export function publicGame(row) {
  return {
    id: row.id,
    name: row.name,
    genre: row.genre,
    mode: row.mode,
    plats: row.plats,
    pop: row.pop
  };
}
