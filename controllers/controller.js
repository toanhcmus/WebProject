const Product = require('../models/Product')
module.exports = {
    render: async (req, res, next) => {
        try {
            const product = await Product.allProduct();
            console.log("render", req.session);
            const cart = req.session.cart;
            res.render('home', { layout: 'main', items: product, cart: cart });
        }
        catch (error) {
            next(error);
        }
    },
    renderAdmin: async (req, res, next) => {
        try {
            res.render('admin/dashboard');
        }
        catch (error) {
            next(error);
        }
    },
    renderLogin: async (req, res, next) => {
        try {
            if (req.user || req.session.user) {
                let account = req.user;
                if (!req.user) account = req.session.user;
                res.render('profile', { layout: 'main', account: account });
            }
            else {
                res.render('login', { layout: '' });
            }
        }
        catch (error) {
            next(error);
        }
    },
    products: async (req, res, next) => {
        try {
            const cart = req.session.cart;
            // console.log(req.session);
            console.log("renderPro", req.session);
            const product = await Product.allProduct();
            res.render('products', { products: product, cart: cart });
        }
        catch (error) {
            next(error);
        }
    },
    search: async (req, res, next) => {
        try {
            console.log('search')
            var data = await Product.search(req.body.name)
            const cart = req.session.cart;
            console.log(cart)
            res.render('products', { products: data, cart: cart });
        }
        catch (error) {
            next(error);
        }
    },
    az: async (req, res, next) => {
        try {
            console.log('sort')
            var data = await Product.sort("az")
            const cart = req.session.cart;
            console.log(data)
            res.render('products', { products: data, cart: cart });
        }
        catch (error) {
            next(error);
        }
    },
    acs: async (req, res, next) => {
        try {
            console.log('sort')
            var data = await Product.sort("increase")
            console.log(data)
            const cart = req.session.cart;
            res.render('products', { products: data, cart: cart });
        }
        catch (error) {
            next(error);
        }
    },
    za: async (req, res, next) => {
        try {
            console.log('sort')
            var data = await Product.sort("za")
            console.log(data)
            const cart = req.session.cart;

            res.render('products', { products: data, cart: cart });
        }
        catch (error) {
            next(error);
        }
    },
    des: async (req, res, next) => {
        try {
            console.log('sort')
            var data = await Product.sort("decrease")
            console.log(data)
            const cart = req.session.cart;

            res.render('products', { products: data, cart: cart });
        }
        catch (error) {
            next(error);
        }
    },
    addToCart: async (req, res, next) => {
        try {
            let found = false;
            if (!req.session.cart) {
                req.session.cart = [];
            }
            for (let i = 0; i < req.session.cart.length; i++) {
                if (req.session.cart[i].name.trim('') === req.body.name.trim('')) {
                    req.session.cart[i].count = req.body.count;
                    found = true;
                    break;
                }
            }
            if (!found) {
                req.session.cart.push({ id: req.body.id, name: req.body.name, price: parseInt(req.body.price), count: parseInt(req.body.count), image: req.body.image });
            }
            res.json({});
        }
        catch (error) {
            next(error);
        }
    },
    plus: async (req, res, next) => {
        try {
            if (!req.session.cart) {
                req.session.cart = [];
            }
            for (let i = 0; i < req.session.cart.length; i++) {
                if (req.session.cart[i].name.trim('') == req.body.name.trim('')) {
                    req.session.cart[i].count++;
                    break;
                }
            }
            res.json({});
        }
        catch (error) {
            next(error);
        }
    },
    minus: async (req, res, next) => {
        try {
            if (!req.session.cart) {
                req.session.cart = [];
            }
            for (let i = 0; i < req.session.cart.length; i++) {
                if (req.session.cart[i].name.trim('') == req.body.name.trim('')) {
                    if (req.session.cart[i].count == 1) {
                        req.session.cart.splice(i, 1);
                    }
                    else {
                        req.session.cart[i].count--;
                    }
                    break;
                }
            }
            res.json({});
        }
        catch (error) {
            next(error);
        }
    },
    remove: async (req, res, next) => {
        try {
            if (!req.session.cart) {
                req.session.cart = [];
            }
            for (let i = 0; i < req.session.cart.length; i++) {
                if (req.session.cart[i].name.trim('') == req.body.name.trim('')) {
                        req.session.cart.splice(i, 1);
                    break;
                }
            }
            res.json({});
        }
        catch (error) {
            next(error);
        }
    }

}