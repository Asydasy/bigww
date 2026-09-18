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

/**
 * Wiadomość z czatu ogólnego.
 * @param row wiersz z chat_messages
 * @param viewer zalogowany użytkownik albo null
 */
export function publicChatMessage(row, viewer = null) {
  const usunieta = Boolean(row.deleted_at);
  return {
    id: row.id,
    nick: row.nick,
    userId: row.user_id,
    // Treść usuniętej wiadomości nie wychodzi z serwera — front pokazuje ślad.
    body: usunieta ? null : row.body,
    deleted: usunieta,
    mine: Boolean(viewer && row.user_id === viewer.id),
    at: new Date(row.created_at).getTime()
  };
}

/**
 * Wątek prywatnych wiadomości widziany oczami jednego z uczestników.
 * @param row wiersz z dm_threads
 * @param messages wiersze z dm_messages należące do tego wątku, od najstarszej
 * @param viewerId id konta, które pyta
 * @param nickById mapa id konta → nick rozmówcy
 */
export function publicDmThread(row, messages, viewerId, nickById) {
  const peerId = row.user_a === viewerId ? row.user_b : row.user_a;
  const czytaneOd = viewerId === row.user_a ? row.a_read_at : row.b_read_at;
  const prog = czytaneOd ? new Date(czytaneOd).getTime() : 0;

  return {
    id: row.id,
    withId: peerId,
    withNick: nickById.get(peerId) || "Konto usunięte",
    unread: messages.filter(
      (m) => m.from_id !== viewerId && new Date(m.created_at).getTime() > prog
    ).length,
    updated: new Date(row.updated_at).getTime(),
    messages: messages.map((m) => ({
      id: m.id,
      from: m.from_id,
      fromNick: m.nick,
      text: m.body,
      mine: m.from_id === viewerId,
      ts: new Date(m.created_at).getTime()
    }))
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
