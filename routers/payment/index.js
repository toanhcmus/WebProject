const express = require('express');
const paymentC = require('../../controllers/payment/payment');
const jwt = require('jsonwebtoken');
const paymentM = require('../../models/Payment');
const billM = require('../../models/Bill');

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
      console.log(user);
      next();
    });
};
  
// Route để chuyển khoản
router.post('/transfer', authenticateJWT, async (req, res) => {
    try {
      console.log(req.session);
      const total = req.body.total;
      const user = req.user;
      const userDB = await paymentM.selectUser(user.username);
      const balance = userDB[0].balance;

      const obj = {
        username: user.username,
        date: new Date(),
        total: total,
        status: 1
      }

      await billM.insertBill()



      if (total > balance) {

      } else {

      }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi trong quá trình xử lý' });
    }
});

module.exports = router;
