const paymentM = require('../models/Payment');
const jwt = require('jsonwebtoken');

module.exports = {
    // render: async (req, res, next) => {
    //     try {
    //         // console.log(req.session);
    //         const token = req.params.token;
    //         // console.log(token);
    //         if (!token) {
    //             res.status(401).json({msg: 'Lỗi xác thực người dùng!'});
    //         }

    //         // let user;
        
    //         // jwt.verify(token, 'mysecretkey', (err, user) => {
    //         //     if (err) {
    //         //         console.log('Xác thực không hợp lệ');
    //         //         res.status(401).json({msg: 'Lỗi xác thực người dùng!'});
    //         //     }
    //         //     console.log(user);
    //         //     user = user.username;
    //         // });

    //         async function verifyUser() {
    //             try {
    //                 const decodedUser = await jwt.verify(token, 'mysecretkey');
    //                 console.log(decodedUser);
    //                 const user = decodedUser.username;
    //                 return user;
    //             } catch (err) {
    //                 console.log('Xác thực không hợp lệ');
    //                 res.status(401).json({ msg: 'Lỗi xác thực người dùng!' });
    //             }
    //         }
            
    //         let user = await verifyUser();

    //         let isAdmin = 0;
    //         if (user === "Admin") {
    //             isAdmin = 1;
    //             let dataUser = await paymentM.selectAllUsers();
    //             let paymentHistory = await paymentM.selectAllPayments();
    //             res.render('payment/admin', {layout: '', users: dataUser, payments: paymentHistory});
    //         } else {
    //             console.log(user);
    //             let dataUser = await paymentM.selectUser(user);
    //             let paymentHistory =  await paymentM.selectPaymentByUser(user);
    //             console.log(dataUser);
    //             console.log(paymentHistory);
    //             res.render('payment/home', {layout: '', user: dataUser, isAdmin: isAdmin, paymentHistory: paymentHistory});
    //         }
    //     }
    //     catch (error) {
    //         next(error);
    //     }
    // },
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