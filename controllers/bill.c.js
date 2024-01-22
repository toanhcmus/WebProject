const Bill=require('../models/Bill');
const jwt = require('jsonwebtoken');

module.exports = {
    renderBill(req, res) {
        const cart = req.session.cart;
        
        const user = req.user;
        const userTransfer = {
            "username": user.username,
            "password": user.password
        }
        const token = jwt.sign(userTransfer, 'mysecretkey', { expiresIn: '1h' });
        console.log(token);
        res.render('bill', { layout: 'main', cart: cart });
    },

}