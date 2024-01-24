const Bill = require('../models/Bill');
const jwt = require('jsonwebtoken');
const Product = require('../models/Product');

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
            // console.log(userData);
            user = {
                "username": userData.Email
            }
        }
        
        const token = jwt.sign(user, 'mysecretkey', { expiresIn: '1h' });
        // console.log(token);
        res.render('bill', { layout: 'main', cart: cart, token: token });
    },
    async billDetail(req, res) {
        const billID = req.body.billId;
        console.log("BillID", billID);
        const data = await Bill.selectTTHoaDon(parseInt(billID));
        console.log(data);

        let products = [];

        if (data.length !== 0 ){
            for (let i = 0; i < data.length; i++) {
                let product;
                product = await Product.getProductByID(data[i].MaSP);
                console.log(product);
                products.push(product[0]);
            }
        }

        console.log("products");
        console.log(products);

        res.send({
            bill: data,
            data: products
        });
    }
}