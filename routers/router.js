const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const controller = require('../controllers/controller');
const accountController = require('../controllers/account');
const passport = require('passport');
const auth = require('../mws/auth');

router.use(bodyParser.urlencoded({ extended: true }));
router.use('/', express.json());

router.get('/', controller.render);
router.get('/admin', controller.renderAdmin);
router.get('/login', controller.renderLogin);
router.get('/products', controller.products);
router.get('/products/asc', controller.acs);
router.get('/products/des', controller.des);
router.get('/products/az', controller.az);
router.get('/products/za', controller.za);
router.post('/register', accountController.register);
router.post('/search', controller.search);
// router.post('/sort', controller.sort);
router.post('/verify', passport.authenticate('myS', {
    failureRedirect: '/'
}), (req, res) => {
    if (req.user && req.user.isAdmin) {
        res.redirect('/admin'); 
    } else {
        res.redirect('/');
    }
});
router.get('/logout', accountController.logout);

module.exports = router;