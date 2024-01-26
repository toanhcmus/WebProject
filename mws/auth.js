module.exports = {
    ensureAuthenticated: function(req, res, next) {
        if (req.session.user || req.isAuthenticated()) {
            //console.log(req.session.user);
            return next();
        } else {
            res.redirect('/login');
        }
    },
    ensureAuthenticatedAdmin: function(req, res, next) {
        if (!req.isAuthenticated() || req.user == null) {
            return res.redirect('/login');
        }
        if (req.user.isAdmin == false || req.user.isAdmin == null) {
            return res.redirect('/');
        }
        return next();
    }
};