module.exports = {
    ensureAuthenticated: function(req, res, next) {
        if (req.session.user || req.isAuthenticated()) {
            //console.log(req.session.user);
            return next();
        } else {
            res.redirect('/login');
        }
    }
};