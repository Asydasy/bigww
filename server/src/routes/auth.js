/**
 * Rejestracja, logowanie, wylogowanie i logowanie przez Discorda.
 */
import { randomUUID } from "node:crypto";
import oauth2 from "@fastify/oauth2";
import { config } from "../config.js";
import { db } from "../db.js";
import { hashPassword, verifyPassword, MIN_PASSWORD } from "../password.js";
import { publicUser } from "../shape.js";

const registerSchema = {
  body: {
    type: "object",
    required: ["email", "password", "displayName"],
    properties: {
      email: { type: "string", format: "email", maxLength: 200 },
      password: { type: "string", minLength: MIN_PASSWORD, maxLength: 200 },
      displayName: { type: "string", minLength: 2, maxLength: 40 }
    }
  }
};

const loginSchema = {
  body: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", maxLength: 200 },
      password: { type: "string", maxLength: 200 }
    }
  }
};

export default async function authRoutes(app) {
  // Osobny, ostrzejszy limit na logowanie — utrudnia zgadywanie haseł.
  const authLimit = { rateLimit: { max: 10, timeWindow: "5 minutes" } };

  app.post("/register", { schema: registerSchema, config: authLimit }, async (request, reply) => {
    const email = request.body.email.trim().toLowerCase();
    const displayName = request.body.displayName.trim();

    const taken = await db.selectFrom("users").select("id").where("email", "=", email).executeTakeFirst();
    if (taken) return reply.code(409).send({ error: "Ten e-mail jest już zajęty." });

    const user = await db
      .insertInto("users")
      .values({
        id: randomUUID(),
        email,
        password_hash: await hashPassword(request.body.password),
        display_name: displayName,
        avatar_seed: displayName
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    app.setSession(reply, user);
    return reply.code(201).send({ user: publicUser(user) });
  });

  app.post("/login", { schema: loginSchema, config: authLimit }, async (request, reply) => {
    const email = request.body.email.trim().toLowerCase();
    const user = await db.selectFrom("users").selectAll().where("email", "=", email).executeTakeFirst();

    // Ten sam komunikat przy złym e-mailu i złym haśle — nie podpowiadamy,
    // które konta istnieją.
    const ok = user && (await verifyPassword(request.body.password, user.password_hash));
    if (!ok) return reply.code(401).send({ error: "Nieprawidłowy e-mail lub hasło." });

    app.setSession(reply, user);
    return { user: publicUser(user) };
  });

  app.post("/logout", async (_request, reply) => {
    app.clearSession(reply);
    return { ok: true };
  });

  app.get("/me", { preHandler: [app.optionalAuth] }, async (request) => ({
    user: request.currentUser ? publicUser(request.currentUser) : null
  }));

  // ---------- Discord ----------
  if (!config.discord.enabled) {
    app.get("/discord", async (_request, reply) =>
      reply.code(503).send({
        error: "Logowanie przez Discorda nie jest skonfigurowane. Uzupełnij DISCORD_CLIENT_ID i DISCORD_CLIENT_SECRET."
      })
    );
    return;
  }

  await app.register(oauth2, {
    name: "discordOAuth2",
    scope: ["identify", "email"],
    credentials: {
      client: { id: config.discord.clientId, secret: config.discord.clientSecret },
      auth: oauth2.DISCORD_CONFIGURATION
    },
    startRedirectPath: "/discord",
    callbackUri: `${config.publicUrl}/api/auth/discord/callback`
  });

  app.get("/discord/callback", async function (request, reply) {
    const { token } = await this.discordOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

    const res = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bearer ${token.access_token}` }
    });
    if (!res.ok) return reply.code(502).send({ error: "Discord nie oddał danych konta." });
    const profile = await res.json();

    const email = profile.email ? profile.email.toLowerCase() : null;
    let user = await db.selectFrom("users").selectAll().where("discord_id", "=", profile.id).executeTakeFirst();

    if (!user && email && profile.verified) {
      // Ten sam, potwierdzony przez Discorda adres = to samo konto. Doklejamy
      // Discorda do istniejącego konta zamiast robić drugie.
      const byEmail = await db.selectFrom("users").selectAll().where("email", "=", email).executeTakeFirst();
      if (byEmail) {
        user = await db
          .updateTable("users")
          .set({ discord_id: profile.id, discord_tag: profile.username, updated_at: new Date() })
          .where("id", "=", byEmail.id)
          .returningAll()
          .executeTakeFirstOrThrow();
      }
    }

    if (!user) {
      // Gdyby adres był zajęty przez konto, którego nie umiemy powiązać,
      // zakładamy konto bez e-maila — logowanie i tak idzie przez Discorda.
      const emailTaken = email
        ? Boolean(await db.selectFrom("users").select("id").where("email", "=", email).executeTakeFirst())
        : true;

      user = await db
        .insertInto("users")
        .values({
          id: randomUUID(),
          discord_id: profile.id,
          discord_tag: profile.username,
          email: emailTaken ? null : email,
          // Konto z Discorda nie ma hasła; CHECK w bazie na to pozwala,
          // bo discord_id wystarczy do zalogowania.
          password_hash: null,
          display_name: profile.global_name || profile.username,
          avatar_seed: profile.id
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    }

    app.setSession(reply, user);
    return reply.redirect(config.frontUrl);
  });
}
