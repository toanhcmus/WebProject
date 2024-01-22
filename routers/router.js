const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const controller = require('../controllers/controller');
const accountController = require('../controllers/account');
const passport = require('passport');
const auth = require('../mws/auth');
const categoryController = require('../controllers/category.c');
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
router.post('/addToCart', controller.addToCart);
router.post('/plus', controller.plus);
router.post('/minus', controller.minus);
router.post('/remove', controller.remove);
// router.post('/sort', controller.sort);
router.post('/verify', passport.authenticate('myS', {
    failureRedirect: '/authFail',
}), (req, res) => {
    if (req.user && req.user.isAdmin) {
        res.redirect('/admin'); 
    } else {
        res.redirect('/');
    }
});
router.get('/logout', accountController.logout);
router.get('/admin/category',categoryController.renderCat);
router.get('/changePassword', accountController.changePassword);

module.exports = router;