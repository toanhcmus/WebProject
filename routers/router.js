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
router.get('/admin', controller.renderAdmin);
router.get('/login', controller.renderLogin);
router.get('/products', controller.products);
// router.get('/products/asc', controller.acs);
// router.get('/products/des', controller.des);
// router.get('/products/az', controller.az);
// router.get('/products/za', controller.za);
router.post('/register', accountController.register);
router.post('/search', controller.search);
router.post('/addToCart', controller.addToCart);
router.post('/plus', controller.plus);
router.post('/minus', controller.minus);
router.post('/paging', controller.paging);
router.post('/filter', controller.filter);
router.post('/remove', controller.remove);
//router.get('/admin/product',controller.renderAddProduct);
router.get('/admin/chart',controller.renderChart);
router.post('/admin/table',controller.renderTable);
router.get('/success', controller.renderSuccess);
router.get('/fail', controller.renderFail);
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
router.get('/admin/category', categoryController.renderCat);
router.get('/admin/category/edit', categoryController.renderEditCat);
router.get('/admin/account', accountController.renderAccountManager);

router.get('/changePassword', accountController.changePassword);
router.get('/payment', auth.ensureAuthenticated, billController.renderBill);

router.get('/admin/account/remove/:Username', accountController.managerRemoveUser);
router.get('/admin/account/edit', accountController.managerEditUser);
router.get('/admin/account/add', accountController.managerAddUser);
router.get('/admin/account/page', accountController.getUsersPage);

router.post('/admin/products',productController.addProduct);
router.get('/admin/products',productController.renderProduct);

router.get('/admin/products/:id',productController.detailProduct);
router.post('/admin/products/:id',productController.editProduct);

router.get('/products/:id',controller.detailProductForUser);
router.post('/bill/detail', billController.billDetail);

router.get('/about', controller.renderAbout);
//router.get('/products',controller.getProductCat);
//router.get('/products',controller.getProductItem);
router.get('/admin/bills', auth.ensureAuthenticated, controller.renderBills);

module.exports = router;
