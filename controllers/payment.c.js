const Product = require('../models/Product');
const paymentM = require('../models/Payment');
const billM = require('../models/Bill');
const fs = require('fs');
const path = require('path');
const Category = require('../models/Category');
const billC = require('./bill.c');
const productM = require('../models/Product');

module.exports = {
    render: async (req, res, next) => {
        try {
            console.log(req.session);
            res.render('payment/home', {layout: ''});
        }
        catch (error) {
            next(error);
        }
    },
    renderAdmin: async (req, res, next) => {
        if (!req.isAuthenticated() || req.user == null) {
            return res.redirect('/login');
        }
        if (req.user.isAdmin == false || req.user.isAdmin == null) {
            return res.redirect('/');
        }
        try {
            res.render('payment/admin');
        }
        catch (error) {
            next(error);
        }
    },
    renderLogin: async (req, res, next) => {
        try {
            if (req.user) {
                res.render('profile', { layout: 'main', account: account, allBills: allBills, categories: dataForHbs ,cart: cart });
            }
            else {
                res.render('loginPayment', { layout: '' });
            }
        }
        catch (error) {
            next(error);
        }
    },
    
}