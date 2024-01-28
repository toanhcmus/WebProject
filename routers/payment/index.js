const express = require('express');
const jwt = require('jsonwebtoken');
const paymentM = require('../../models/Payment');
const auth = require('../../mws/authPayment');
const controller = require('../../controllers/payment.c');
const accountController = require('../../controllers/account');
const passport = require('passport');

const router = express.Router();

router.get('/', controller.render)


// post payment
const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization');
    // console.log(token);
    if (!token) {
      console.log('Yêu cầu xác thực');
      return res.send({
        msg: 1,
        id: 1          // server thanh toán chưa đăng nhập
      });
    }
  
    jwt.verify(token, 'mysecretkey', (err, user) => {
      if (err) {
        console.log('Xác thực không hợp lệ');
        return res.send({
              msg: 1,
              id: 1          // server thanh toán chưa đăng nhập
            });
      }
      req.userReq = user;
      next();
    });
};

// Route để chuyển khoản
router.post('/transfer', authenticateJWT, async (req, res) => {
    try {
      console.log("req.userReq");
      console.log(req.userReq);

      const total = req.body.total;
      const user = req.userReq;
      const userDB = await paymentM.selectUser(user.username);
      console.log(userDB);
      const balance = userDB.balance;
      console.log(balance, total);
      const userAdmin = await paymentM.selectUser("Admin");
      const balanceAdmin = userAdmin.balance;

      const time = new Date();

      const payment = {
        id: user.username,
        money: total,
        TrangThai: 1,
        time: time,
        Type: "transfer"
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

router.post('/fundin', authenticateJWT, async (req, res) => {
  try {
    console.log("req.userReq");
    console.log(req.userReq);

    const fundin = req.body.balanceFundin;
    const user = req.userReq;
    const userDB = await paymentM.selectUser(user.username);
    console.log(userDB);
    const balance = userDB.balance;
    console.log(balance, fundin);
    
    const time = new Date();

    const payment = {
      id: user.username,
      money: fundin,
      TrangThai: 0,
      time: time,
      Type: "fundin"
    }

    await paymentM.addPaymentHistory(payment);
    const payments = await paymentM.selectAllPayments();
    let maxxIDPayment = 0;
    payments.forEach(e => {
      if (e.maGiaoDich > maxxIDPayment) {
        maxxIDPayment = e.maGiaoDich;
      }
    })
    
    await paymentM.updateBalance(userDB.id, parseInt(balance + fundin));
    res.send({
      msg: 0,
    })

  } catch (error) {
      console.error(error);
      await paymentM.updatePaymentHistory(maxxIDPayment, 1);
      res.send({
        msg: 1,
        error: error
      })
      // res.status(500).json({ message: 'Đã xảy ra lỗi trong quá trình xử lý' });
  }
});

module.exports = router;
