const passport = require('passport');
const MyStrategy = require('../utilities/customSPP.js');
const Account = require('../models/User.js');
const bcrypt = require('bcrypt');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GoogleAccount = require('../models/GoogleAccount.js');

passport.serializeUser((user, done) => {
    if (user.strategy === 'myS') {
        done(null, { username: user.username, strategy: user.strategy });
    } else if (user.strategy === 'google') {
        done(null, { Email: user.Email, strategy: user.strategy });
    }
});

passport.deserializeUser(async ({ username, Email, strategy }, done) => {
    let user;
    if (strategy === 'myS') {
        user = await Account.getUser(username);
    } else if (strategy === 'google') {
        user = await GoogleAccount.getUser(Email);
    }
    done(null, user);
});

module.exports = app => {
    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(new MyStrategy(async (un, pw, done) => {
        let auth = false;
        const check = await Account.checkUsernameExist(un);
        if (check) {
            const rs = await Account.getUser(un);
            if (rs) {
                auth = await bcrypt.compare(pw, rs.password);
            }
            if (auth) {
                rs.strategy = 'myS';
                return done(null, rs);
            }
        }
        done('invalid auth', null);
    }, {
        username: 'username',
        password: 'password'
    }));

    passport.use(new GoogleStrategy({
        clientID: '134494245821-d15hs7gfpfli8h243e8u91bc6hdk18c9.apps.googleusercontent.com',
        clientSecret: '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',
        callbackURL: 'https://localhost:3000/auth/google/callback'
    }, async function (accessToken, refreshToken, profile, cb) {
            await GoogleAccount.insertUser({ Name: profile.displayName, Email: profile.emails[0].value, Avatar: profile.photos[0].value });
            let user = await GoogleAccount.getUser(profile.emails[0].value);
            user.strategy = 'google';
            return cb(null, user);
        }
    ));
}