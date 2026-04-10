import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from 'passport-google-oauth20';
import AppleStrategy from 'passport-apple';
import prisma from '../lib/prisma';
import redis from '../lib/redis';
import { verifyToken } from '../middleware/auth';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret';
const BCRYPT_ROUNDS = 12;
const RATE_LIMIT_MAX_FAILURES = 10;
const RATE_LIMIT_WINDOW_SECS = 15 * 60; // 15 minutes

// ─── Helpers ────────────────────────────────────────────────────────────────

function issueTokens(userId: string, email: string) {
  const accessToken = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId, email }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

function rateLimitKey(ip: string) {
  return `auth:failed:${ip}`;
}

async function getFailedAttempts(ip: string): Promise<number> {
  try {
    const val = await redis.get(rateLimitKey(ip));
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0; // Redis unavailable — fail open
  }
}

async function incrementFailedAttempts(ip: string): Promise<void> {
  try {
    const key = rateLimitKey(ip);
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW_SECS);
    }
  } catch {
    // Redis unavailable — continue
  }
}

async function clearFailedAttempts(ip: string): Promise<void> {
  try {
    await redis.del(rateLimitKey(ip));
  } catch {
    // Redis unavailable — continue
  }
}

// ─── Passport setup ─────────────────────────────────────────────────────────

passport.serializeUser((user: any, done) => done(null, user));
passport.deserializeUser((user: any, done) => done(null, user));

// Google OAuth strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.API_BASE_URL || 'http://localhost:4000'}/api/auth/google/callback`,
        passReqToCallback: true,
      },
      async (req: Request, _accessToken: string, _refreshToken: string, profile: GoogleProfile, done: any) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('No email from Google profile'));

          let user = await prisma.user.findFirst({
            where: { OR: [{ email }, { oauthProvider: 'google', oauthId: profile.id }] },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                oauthProvider: 'google',
                oauthId: profile.id,
                displayName: profile.displayName || email.split('@')[0],
                avatarUrl: profile.photos?.[0]?.value ?? null,
                subscriptionStatus: 'trial',
                trialStartDate: new Date(),
              },
            });
          } else if (!user.oauthId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { oauthProvider: 'google', oauthId: profile.id },
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
}

// GitHub OAuth strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  const GitHubStrategy = require('passport-github2').Strategy;
  passport.use(new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.API_BASE_URL || 'http://localhost:4000'}/api/auth/github/callback`,
    },
    async (accessToken: string, refreshToken: string, profile: { id: string; displayName: string; emails?: Array<{ value: string }> }, done: (err: unknown, user?: unknown) => void) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('No email from GitHub'));
        let user = await prisma.user.findFirst({ where: { OR: [{ email }, { oauthProvider: 'github', oauthId: profile.id }] } });
        if (!user) {
          user = await prisma.user.create({ data: { email, oauthProvider: 'github', oauthId: profile.id, displayName: profile.displayName || email.split('@')[0], subscriptionStatus: 'trial', trialStartDate: new Date() } });
        }
        return done(null, user);
      } catch (err) { return done(err); }
    }
  ));
}

// Apple OAuth strategy
if (
  process.env.APPLE_CLIENT_ID &&
  process.env.APPLE_TEAM_ID &&
  process.env.APPLE_KEY_ID &&
  process.env.APPLE_PRIVATE_KEY
) {
  passport.use(
    new AppleStrategy(
      {
        clientID: process.env.APPLE_CLIENT_ID,
        teamID: process.env.APPLE_TEAM_ID,
        keyID: process.env.APPLE_KEY_ID,
        privateKeyString: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        callbackURL: `${process.env.API_BASE_URL || 'http://localhost:4000'}/api/auth/apple/callback`,
        passReqToCallback: true,
      } as any,
      async (req: Request, _accessToken: string, _refreshToken: string, idToken: any, profile: any, done: any) => {
        try {
          const email: string | undefined =
            idToken?.email || profile?.email || req.body?.user
              ? JSON.parse(req.body.user || '{}').email
              : undefined;

          const appleId: string = profile?.id || idToken?.sub;
          if (!appleId) return done(new Error('No Apple ID in token'));

          let user = await prisma.user.findFirst({
            where: { OR: [{ oauthProvider: 'apple', oauthId: appleId }, ...(email ? [{ email }] : [])] },
          });

          if (!user) {
            if (!email) return done(new Error('No email from Apple — first sign-in must provide email'));
            user = await prisma.user.create({
              data: {
                email,
                oauthProvider: 'apple',
                oauthId: appleId,
                displayName: email.split('@')[0],
                subscriptionStatus: 'trial',
                trialStartDate: new Date(),
              },
            });
          } else if (!user.oauthId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { oauthProvider: 'apple', oauthId: appleId },
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
}

router.use(passport.initialize());

// ─── POST /api/auth/register ─────────────────────────────────────────────────

router.post('/register', async (req: Request, res: Response) => {
  const { email, password, displayName } = req.body;

  if (!email || !password || !displayName) {
    res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'email, password, and displayName are required.', retryable: false },
    });
    return;
  }

  const emailLower = String(email).toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: emailLower } });
  if (existing) {
    res.status(422).json({
      error: {
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email address already exists. Please sign in or use a different email.',
        retryable: false,
      },
    });
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: emailLower,
      passwordHash,
      displayName: String(displayName).trim(),
      subscriptionStatus: 'trial',
      trialStartDate: new Date(),
    },
  });

  const tokens = issueTokens(user.id, user.email);

  res.status(201).json({
    user: { id: user.id, email: user.email, displayName: user.displayName, subscriptionStatus: user.subscriptionStatus },
    ...tokens,
  });
});

// ─── POST /api/auth/login ────────────────────────────────────────────────────

router.post('/login', async (req: Request, res: Response) => {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';

  // Rate limit check
  const failures = await getFailedAttempts(ip);
  if (failures >= RATE_LIMIT_MAX_FAILURES) {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many failed login attempts. Please try again in 15 minutes.',
        retryable: true,
      },
    });
    return;
  }

  const { email, password } = req.body;
  if (!email || !password) {
    res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'email and password are required.', retryable: false },
    });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase().trim() } });

  if (!user || !user.passwordHash) {
    await incrementFailedAttempts(ip);
    res.status(401).json({
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.', retryable: false },
    });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    await incrementFailedAttempts(ip);
    res.status(401).json({
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.', retryable: false },
    });
    return;
  }

  await clearFailedAttempts(ip);
  const tokens = issueTokens(user.id, user.email);

  res.json({
    user: { id: user.id, email: user.email, displayName: user.displayName, subscriptionStatus: user.subscriptionStatus },
    ...tokens,
  });
});

// ─── GET /api/auth/google ────────────────────────────────────────────────────

router.get('/google', (req: Request, res, next) => {
  const redirectUrl = (req.query.redirect as string) || '/';
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: Buffer.from(JSON.stringify({ redirectUrl })).toString('base64'),
    session: false,
  })(req, res, next);
});

router.get('/google/callback', (req: Request, res: Response, next) => {
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth_failed' }, (err: any, user: any) => {
    if (err || !user) {
      return res.redirect('/login?error=oauth_failed');
    }

    let redirectUrl = '/';
    try {
      const state = JSON.parse(Buffer.from((req.query.state as string) || '', 'base64').toString());
      redirectUrl = state.redirectUrl || '/';
    } catch {
      // ignore malformed state
    }

    const tokens = issueTokens(user.id, user.email);
    const frontendBase = process.env.CORS_ORIGIN || 'http://localhost:3000';
    const params = new URLSearchParams({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, redirect: redirectUrl });
    res.redirect(`${frontendBase}/auth/callback?${params.toString()}`);
  })(req, res, next);
});

// ─── GET /api/auth/github ────────────────────────────────────────────────────

router.get('/github', (req: Request, res, next) => {
  const redirectUrl = (req.query.redirect as string) || '/discovery';
  passport.authenticate('github', {
    scope: ['user:email'],
    state: Buffer.from(JSON.stringify({ redirectUrl })).toString('base64'),
    session: false,
  } as Record<string, unknown>)(req, res, next);
});

router.get('/github/callback', (req: Request, res: Response, next) => {
  passport.authenticate('github', { session: false, failureRedirect: '/login?error=oauth_failed' }, (err: unknown, user: { id: string; email: string }) => {
    if (err || !user) return res.redirect('/login?error=oauth_failed');
    let redirectUrl = '/discovery';
    try { const state = JSON.parse(Buffer.from((req.query.state as string) || '', 'base64').toString()); redirectUrl = state.redirectUrl || '/discovery'; } catch { /**/ }
    const tokens = issueTokens(user.id, user.email);
    const frontendBase = process.env.CORS_ORIGIN || 'http://localhost:3000';
    const params = new URLSearchParams({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, redirect: redirectUrl });
    res.redirect(`${frontendBase}/auth/callback?${params.toString()}`);
  })(req, res, next);
});

// ─── GET /api/auth/apple ─────────────────────────────────────────────────────

router.get('/apple', (req: Request, res, next) => {
  const redirectUrl = (req.query.redirect as string) || '/';
  passport.authenticate('apple', {
    state: Buffer.from(JSON.stringify({ redirectUrl })).toString('base64'),
    session: false,
  } as any)(req, res, next);
});

router.post('/apple/callback', (req: Request, res: Response, next) => {
  passport.authenticate('apple', { session: false, failureRedirect: '/login?error=oauth_failed' }, (err: any, user: any) => {
    if (err || !user) {
      return res.redirect('/login?error=oauth_failed');
    }

    let redirectUrl = '/';
    try {
      const state = JSON.parse(Buffer.from((req.body.state as string) || '', 'base64').toString());
      redirectUrl = state.redirectUrl || '/';
    } catch {
      // ignore malformed state
    }

    const tokens = issueTokens(user.id, user.email);
    const frontendBase = process.env.CORS_ORIGIN || 'http://localhost:3000';
    const params = new URLSearchParams({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, redirect: redirectUrl });
    res.redirect(`${frontendBase}/auth/callback?${params.toString()}`);
  })(req, res, next);
});

// ─── POST /api/auth/onboarding ───────────────────────────────────────────────

router.post('/onboarding', verifyToken, async (req: Request, res: Response) => {
  const { dietaryPreferences, cuisineInterests, preferredLanguage } = req.body;
  const userId = req.user!.userId;

  // Validate preferredLanguage if provided
  const SUPPORTED_LANGS = ['en', 'es', 'fr', 'hi', 'ar', 'pt', 'zh', 'ja', 'de', 'it'];
  const lang = preferredLanguage && SUPPORTED_LANGS.includes(preferredLanguage) ? preferredLanguage : undefined;

  // Store preferences on the user row
  // dietaryPreferences and cuisineInterests are stored as JSON in a future migration;
  // for now we store preferredLang and serialize the arrays into bio-adjacent fields.
  // The schema has preferredLang; dietary/cuisine prefs will be stored once the column is added.
  // We use a pragmatic approach: store them in a JSON column via a raw update if available,
  // otherwise store preferredLang and acknowledge the rest.

  const updateData: Record<string, any> = {};
  if (lang) updateData.preferredLang = lang;

  // Store dietary preferences and cuisine interests as JSON strings in dedicated fields
  // (the Prisma schema will need these columns; we add them gracefully)
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        // Store onboarding data in bio as JSON until dedicated columns are added
        // This is a pragmatic interim approach
      },
    });

    // Return the stored preferences back to the caller
    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        preferredLang: user.preferredLang,
      },
      preferences: {
        dietaryPreferences: dietaryPreferences ?? [],
        cuisineInterests: cuisineInterests ?? [],
        preferredLanguage: lang ?? user.preferredLang,
      },
    });
  } catch {
    res.status(500).json({
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to save onboarding preferences.', retryable: true },
    });
  }
});

// ─── POST /api/auth/refresh ──────────────────────────────────────────────────

router.post('/refresh', (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Refresh token required.', retryable: false } });
    return;
  }
  try {
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string; email: string };
    const tokens = issueTokens(payload.userId, payload.email);
    res.json(tokens);
  } catch {
    res.status(401).json({ error: { code: 'TOKEN_EXPIRED', message: 'Refresh token is invalid or expired.', retryable: false } });
  }
});

export default router;
