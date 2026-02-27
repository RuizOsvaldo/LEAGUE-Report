import * as client from "openid-client";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import MemoryStore from "memorystore";
import bcrypt from "bcryptjs";
import { authStorage } from "./storage";

const DEV_BYPASS = process.env.DEV_BYPASS_AUTH === "true";

// Only used when REPL_ID is set (Replit environment)
const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week

  if (DEV_BYPASS) {
    const MemStore = MemoryStore(session);
    return session({
      secret: process.env.SESSION_SECRET ?? "dev-secret",
      store: new MemStore({ checkPeriod: sessionTtl }),
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, secure: false, maxAge: sessionTtl },
    });
  }

  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: false, maxAge: sessionTtl },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  if (DEV_BYPASS) {
    console.log("[auth] DEV_BYPASS_AUTH=true — skipping auth setup");
    passport.serializeUser((user: Express.User, cb) => cb(null, user));
    passport.deserializeUser((user: Express.User, cb) => cb(null, user));
    return;
  }

  // Local (email + password) strategy
  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        const user = await authStorage.getUserByEmail(email.toLowerCase().trim());
        if (!user || !user.passwordHash) {
          return done(null, false, { message: "Invalid email or password" });
        }
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          return done(null, false, { message: "Invalid email or password" });
        }
        return done(null, { claims: { sub: user.id, email: user.email } });
      } catch (err) {
        return done(err);
      }
    })
  );

  // Google OAuth strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/auth/google/callback",
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) return done(null, false);

            let user = await authStorage.getUserByEmail(email.toLowerCase());
            if (!user) {
              user = await authStorage.upsertUser({
                email: email.toLowerCase(),
                firstName: profile.name?.givenName ?? null,
                lastName: profile.name?.familyName ?? null,
                profileImageUrl: profile.photos?.[0]?.value ?? null,
              });
            }
            return done(null, { claims: { sub: user.id, email: user.email } });
          } catch (err) {
            return done(err as Error);
          }
        }
      )
    );
  }

  passport.serializeUser((user: any, cb) => cb(null, user.claims.sub));
  passport.deserializeUser(async (id: string, cb) => {
    try {
      const user = await authStorage.getUser(id);
      if (!user) return cb(null, false);
      cb(null, { claims: { sub: user.id, email: user.email } });
    } catch (err) {
      cb(err);
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (DEV_BYPASS) {
    (req as any).user = {
      claims: { sub: "dev-user-1", email: "dev@local.test" },
    };
    return next();
  }

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  return next();
};
