/**
 * Zamiana wierszy z bazy na kształt, którego oczekuje front.
 * W bazie kolumny nazywają się time_of_day i descr (bo "time" i "desc" to
 * słowa zastrzeżone w SQL) — tutaj wracają jako time i desc.
 */

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
    time: row.time_of_day,
    mic: row.mic,
    lang: row.lang,
    tags: row.tags,
    desc: row.descr,
    clipUrl: row.clip_url,
    lookingNow: row.looking_now,
    boosted: Boolean(row.boost_until && new Date(row.boost_until) > new Date()),
    prem: ownerPremium,
    added: new Date(row.created_at).getTime(),
    mine,
    // Kontakt widzi właściciel i posiadacz premium. Odblokowywanie za monety
    // dojdzie razem z portfelem po stronie serwera.
    contact: mine || isPremium(viewer) ? row.contact : null,
    contactLocked: !(mine || isPremium(viewer)) && Boolean(row.contact)
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
