const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const controller = require('../controllers/controller');
const accountController = require('../controllers/account');
const passport = require('passport');
const auth = require('../mws/auth');
const categoryController = require('../controllers/category.c');
const billController = require('../controllers/bill.c');
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
router.get('/authFail', accountController.renderAuthFail);
router.get('/logout', accountController.logout);
router.get('/admin/category',categoryController.renderCat);
router.get('/admin/category/edit',categoryController.renderEditCat);
router.get('/admin/account', accountController.renderAccountManager);

router.get('/changePassword', accountController.changePassword);
router.get('/payment', auth.ensureAuthenticated, )

router.get('/admin/account/remove/:Username', accountController.managerRemoveUser);
router.get('/admin/account/edit', accountController.managerEditUser);
router.get('/admin/account/add', accountController.managerAddUser);

module.exports = router;