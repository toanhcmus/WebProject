const MyStrategy = require('../utilities/customSPP.js');
const Account = require('../models/User.js');
const bcrypt = require('bcrypt');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GoogleAccount = require('../models/GoogleAccount.js');

module.exports = function(passport) {
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
        clientID: '591898010831-evkecckvrabclndvpp2vdsd9e2irrl83.apps.googleusercontent.com',
        clientSecret: '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',
        callbackURL: 'https://localhost:5000/auth/google/callback'
    }, async function (accessToken, refreshToken, profile, cb) {
            let user = await GoogleAccount.getUser(profile.emails[0].value);
            // console.log(user);
            user.strategy = 'google';
            return cb(null, user);
        }
    ));
}