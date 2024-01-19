const passport = require('passport');
const MyStrategy = require('../utilities/customSPP.js');
const Account = require('../models/User.js');
const bcrypt = require('bcrypt');

passport.serializeUser((user, done) => {
    done(null, user.username);
});

passport.deserializeUser(async (username, done) => {
    const check = await Account.checkUsernameExist(username);
    if (check) {
        const u = await Account.getUser(username);
        return done(null, u);
    }
    else {
        return done('invalid', null);
    }
})

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
                return done(null, rs);
            }
        }
        done('invalid auth', null);
    }, {
        username: 'username',
        password: 'password'
    }));
}