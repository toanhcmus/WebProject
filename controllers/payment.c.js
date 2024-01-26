const paymentM = require('../models/Payment');
const jwt = require('jsonwebtoken');

module.exports = {
    render: async (req, res, next) => {
        try {
            res.render('payment/home', {layout: ''});
        }
        catch (error) {
            next(error);
        }
    },
    // renderAdmin: async (req, res, next) => {
    //     if (!req.isAuthenticated() || req.user == null) {
    //         return res.redirect('/login');
    //     }
    //     if (req.user.isAdmin == false || req.user.isAdmin == null) {
    //         return res.redirect('/');
    //     }
    //     try {
    //         res.render('payment/admin');
    //     }
    //     catch (error) {
    //         next(error);
    //     }
    // },
    // renderLogin: async (req, res, next) => {
    //     try {
    //         if (req.user) {
    //             res.render('profile', { layout: 'main', account: account, allBills: allBills, categories: dataForHbs ,cart: cart });
    //         }
    //         else {
    //             res.render('loginPayment', { layout: '' });
    //         }
    //     }
    //     catch (error) {
    //         next(error);
    //     }
    // },
    
}