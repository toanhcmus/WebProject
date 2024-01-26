const express = require('express');
const jwt = require('jsonwebtoken');
const paymentM = require('../../models/Payment');
const auth = require('../../mws/authPayment');
const controller = require('../../controllers/payment.c');
const accountController = require('../../controllers/account');
const passport = require('passport');

const router = express.Router();

router.get('/', auth.ensureAuthenticated, controller.render);

router.get('/login', controller.renderLogin);
router.get('/admin', controller.renderAdmin);

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
router.get('/authFail', accountController.renderAuthFailPayment);
router.get('/logout', accountController.logout);


// post payment
const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization');
    // console.log(token);
    if (!token) {
      console.log('Yêu cầu xác thực');
      return res.status(401).json({ message: 'Yêu cầu xác thực' });
    }
  
    jwt.verify(token, 'mysecretkey', (err, user) => {
      if (err) {
        console.log('Xác thực không hợp lệ');
        return res.status(403).json({ message: 'Xác thực không hợp lệ' });
      }
      req.userReq = user;
      // console.log(user);
      next();
    });
};
  
// Route để chuyển khoản
router.post('/transfer', authenticateJWT, async (req, res) => {
    try {
      // console.log(req.session);

      if (!req.user) {
        return res.send({
          msg: 1,
          id: 2          // server thanh toán chưa đăng nhập
        });
      }

      if (req.session.passport.user.strategy === 'google') {
          if (req.user.Email !== req.userReq.username) {
            res.send({
              msg: 1,
              id: 1         // server thanh toán không khớp dữ liệu người dùng
            });
          }
      } else {
          if (req.user.username !== req.userReq.username) {
            res.send({
              msg: 4          // server thanh toán không khớp dữ liệu người dùng
            });
          }
      }

      const total = req.body.total;
      const user = req.userReq;
      const userDB = await paymentM.selectUser(user.username);
      console.log(userDB);
      const balance = userDB.balance;
      console.log(balance, total);
      const userAdmin = await paymentM.selectUser("admin");
      const balanceAdmin = userAdmin.balance;

      const time = new Date();

      const obj = {
        username: user.username,
        date: time,
        total: total,
        status: 1
      }

      const payment = {
        id: user.username,
        money: total,
        TrangThai: 1,
        time: time
      }

      await paymentM.addPaymentHistory(payment);

      if (total > balance) {
          res.send({
            msg: 1,
            id: 0           // không đủ số dư
          })
      } else {
        // await billM.updateStatus(maxxIDBill, 0);
        const payments = await paymentM.selectAllPayments();
        let maxxIDPayment = 0;
        payments.forEach(e => {
          if (e.maGiaoDich > maxxIDPayment) {
            maxxIDPayment = e.maGiaoDich;
          }
        })
        await paymentM.updatePaymentHistory(maxxIDPayment, 0);
        await paymentM.updateBalance(userDB.id, parseInt(balance - total));
        await paymentM.updateBalance(userAdmin.id, parseInt(balanceAdmin + total));
        res.send({
          msg: 0,
          maxxIDPayment: maxxIDPayment
        })
      }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi trong quá trình xử lý' });
    }
});

module.exports = router;
