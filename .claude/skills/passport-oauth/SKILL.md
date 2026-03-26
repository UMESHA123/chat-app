---
name: passport-oauth
description: Passport.js Google and GitHub OAuth integration patterns for this chat application — strategy setup, user find-or-create, JWT issuance on callback
---

# Passport.js OAuth Standards

## Setup

```javascript
// config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

// We use session: false — JWT issued on callback redirect instead
```

## Find-or-Create Pattern

For each OAuth provider, the flow is:
1. Look for existing user by provider ID (e.g., `googleId`)
2. If not found, look by email (user may have registered with same email)
3. If still not found, create new user
4. Call `done(null, user)`

```javascript
passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  `${process.env.SERVER_URL}/api/auth/google/callback`,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // 1. Try by Google ID
    let user = await User.findOne({ googleId: profile.id });
    if (user) return done(null, user);

    // 2. Try by email (link existing account)
    user = await User.findOneAndUpdate(
      { email: profile.emails[0].value },
      { googleId: profile.id, avatar: user?.avatar || profile.photos[0]?.value },
      { new: true }
    );
    if (user) return done(null, user);

    // 3. Create new user
    const username = await generateUniqueUsername(profile.displayName);
    user = await User.create({
      googleId: profile.id,
      email:    profile.emails[0].value,
      username,
      avatar:   profile.photos[0]?.value || null,
    });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));
```

## Callback Route

```javascript
// No session — use JWT redirect
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth` }),
  (req, res) => {
    const token = generateAccessToken(req.user._id);
    // Client reads token from URL, stores in localStorage, then cleans URL
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  }
);
```

## Initialize in app.js

```javascript
const passport = require('passport');
require('./config/passport'); // loads strategies

app.use(passport.initialize()); // no session middleware needed
// do NOT use passport.session()
```

## Unique Username Generation

OAuth profiles often have names with spaces — need URL-safe usernames:

```javascript
const generateUniqueUsername = async (displayName) => {
  const base = displayName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20);
  let username = base;
  let count = 1;
  while (await User.findOne({ username })) {
    username = `${base}_${count++}`;
  }
  return username;
};
```

## Environment Variables Required

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
SERVER_URL=http://localhost:4000   # used to build callback URLs
CLIENT_URL=http://localhost:3000   # where to redirect after OAuth
```

## Registering Callback URLs

In Google Console and GitHub OAuth app settings, register:
- `http://localhost:4000/api/auth/google/callback` (dev)
- `https://yourdomain.com/api/auth/google/callback` (prod)

## Anti-Patterns

- ❌ Using `passport.session()` — we use JWT, not sessions
- ❌ Hardcoding callback URL — always use `${process.env.SERVER_URL}/...`
- ❌ Not handling the "existing email" case — user gets duplicate key error
- ❌ Putting access token in permanent URL (like hash) — only in redirect query param, consumed immediately
