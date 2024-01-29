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
const productController = require('../controllers/product.c');

router.get('/', controller.render);
router.get('/admin', auth.ensureAuthenticatedAdmin, controller.renderAdmin);
router.get('/login', controller.renderLogin);
router.get('/products', controller.products);
// router.get('/products/asc', controller.acs);
// router.get('/products/des', controller.des);
// router.get('/products/az', controller.az);
// router.get('/products/za', controller.za);
router.post('/register', accountController.register);
router.post('/search', controller.search);
//router.post('/admin/search', controller.search1);
router.post('/addToCart', controller.addToCart);
router.post('/plus', controller.plus);
router.post('/minus', controller.minus);
router.post('/paging', controller.paging);
router.post('/paging1', controller.paging1);
router.post('/filter', controller.filter);
router.post('/remove', controller.remove);
router.post('/checkSoLuong', controller.checkSoLuong);
//router.get('/admin/product',controller.renderAddProduct);

router.get('/admin/chart', auth.ensureAuthenticatedAdmin, controller.renderChart);
router.post('/admin/table', auth.ensureAuthenticatedAdmin, controller.renderTable);
router.get('/success', controller.renderSuccess);
router.get('/fail/id=:id', controller.renderFail);
router.post('/sort', controller.sort);
router.post('/verify', passport.authenticate('myS', {
    failureRedirect: '/authFail',
}), (req, res) => {
    if (req.user && req.user.isAdmin) {
        res.redirect('/admin');
    } else {
        res.redirect('/');
    }
});
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), function (req, res) {
    res.redirect('/');
});
router.get('/authFail', accountController.renderAuthFail);
router.get('/logout', accountController.logout);
router.get('/admin/category', auth.ensureAuthenticatedAdmin, categoryController.renderCat);
router.get('/admin/account', auth.ensureAuthenticatedAdmin, accountController.renderAccountManager);
router.get('/admin/category/page', auth.ensureAuthenticatedAdmin, categoryController.getCatPage);

router.get('/changePassword', auth.ensureAuthenticated, accountController.changePassword);
router.get('/payment', auth.ensureAuthenticated, billController.renderBill);

router.get('/admin/account/remove/:Username', auth.ensureAuthenticatedAdmin, accountController.managerRemoveUser);
router.get('/admin/account/edit', auth.ensureAuthenticatedAdmin, accountController.managerEditUser);
router.get('/admin/account/add', auth.ensureAuthenticatedAdmin, accountController.managerAddUser);
router.get('/admin/account/page', auth.ensureAuthenticatedAdmin, accountController.getUsersPage);

router.post('/admin/products', auth.ensureAuthenticatedAdmin, productController.addProduct);
router.get('/admin/products', auth.ensureAuthenticatedAdmin, productController.renderProduct);
router.get('/admin/products/page', auth.ensureAuthenticatedAdmin, productController.getProPage);


router.get('/admin/products/:id', auth.ensureAuthenticatedAdmin, productController.detailProduct);
router.post('/admin/products/:id', auth.ensureAuthenticatedAdmin, productController.editProduct);

router.get('/products/:id',controller.detailProductForUser);
router.post('/bill/detail', billController.billDetail);

router.get('/about', controller.renderAbout);
//router.get('/product?catID=:catID',controller.getProductCat);
//router.get('/product?itemID=:itemID',controller.getProductItem);
router.get('/admin/bills', auth.ensureAuthenticatedAdmin, controller.renderBills);
router.get('/admin/paymenthistory', auth.ensureAuthenticatedAdmin, controller.renderPaymentHistory);

module.exports = router;
