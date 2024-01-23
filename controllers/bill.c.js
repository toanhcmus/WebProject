const Bill=require('../models/Bill');
const jwt = require('jsonwebtoken');

module.exports = {
    renderBill(req, res) {
        const cart = req.session.cart;
        const checkS = req.session.passport.user.strategy;
        let user;
        if (checkS === 'myS') {
            const userData = req.user;
            user = {
                "username": userData.username,
                "password": userData.password
            }
        } else {
            const userData = req.user;
            console.log(userData);
            user = {
                "username": userData.Email
            }
        }
        
        const token = jwt.sign(user, 'mysecretkey', { expiresIn: '1h' });
        // console.log(token);
        res.render('bill', { layout: 'main', cart: cart, token: token });
    },

}