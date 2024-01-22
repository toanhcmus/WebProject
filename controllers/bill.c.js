const Bill=require('../models/Bill');
const jwt = require('jsonwebtoken');

module.exports = {
    renderBill(req, res) {
        const cart = req.session.cart;
        const userData = req.user;
        const user = {
            "username": userData.username,
            "password": userData.password
        }
        const token = jwt.sign(user, 'mysecretkey', { expiresIn: '1h' });
        // console.log(token);
        res.render('bill', { layout: 'main', cart: cart, token: token });
    },

}