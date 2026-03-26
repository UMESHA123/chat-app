const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('./models/User');

const initPassport = () => {
  const googleId = process.env.GOOGLE_CLIENT_ID;
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (googleId && googleId !== 'your_google_client_id' && googleSecret && googleSecret !== 'your_google_client_secret') {
    passport.use(
      new GoogleStrategy(
        {
          clientID: googleId,
          clientSecret: googleSecret,
          callbackURL: `${process.env.SERVER_URL}/api/auth/google/callback`,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            let user = await User.findOne({ googleId: profile.id });

            if (!user) {
              user = await User.findOne({ email: profile.emails[0].value });
              if (user) {
                user.googleId = profile.id;
                await user.save();
              } else {
                user = await User.create({
                  googleId: profile.id,
                  email: profile.emails[0].value,
                  username: profile.displayName.replace(/\s+/g, '').toLowerCase() + '_' + profile.id.slice(0, 5),
                  avatar: profile.photos[0]?.value || null,
                });
              }
            }

            done(null, user);
          } catch (err) {
            done(err, null);
          }
        }
      )
    );
  }

  const githubId = process.env.GITHUB_CLIENT_ID;
  const githubSecret = process.env.GITHUB_CLIENT_SECRET;
  if (githubId && githubId !== 'your_github_client_id' && githubSecret && githubSecret !== 'your_github_client_secret') {
    passport.use(
      new GitHubStrategy(
        {
          clientID: githubId,
          clientSecret: githubSecret,
          callbackURL: `${process.env.SERVER_URL}/api/auth/github/callback`,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            let user = await User.findOne({ githubId: profile.id });

            if (!user) {
              const email = profile.emails?.[0]?.value;
              if (email) user = await User.findOne({ email });

              if (user) {
                user.githubId = profile.id;
                await user.save();
              } else {
                user = await User.create({
                  githubId: profile.id,
                  email: email || `${profile.username}@github.noemail`,
                  username: profile.username + '_gh',
                  avatar: profile.photos[0]?.value || null,
                });
              }
            }

            done(null, user);
          } catch (err) {
            done(err, null);
          }
        }
      )
    );
  }
};

module.exports = initPassport;
