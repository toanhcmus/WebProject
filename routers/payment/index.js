const express = require('express');
const jwt = require('jsonwebtoken');
const paymentM = require('../../models/Payment');

const router = express.Router();

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
      req.user = user;
      // console.log(user);
      next();
    });
};
  
// Route để chuyển khoản
router.post('/transfer', authenticateJWT, async (req, res) => {
    try {
      // console.log(req.session);
      const total = req.body.total;
      const user = req.user;
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
            msg: 1
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
