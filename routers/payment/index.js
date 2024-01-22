const express = require('express');
const paymentC = require('../../controllers/payment/payment');

const router = express.Router();

// post payment
const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization');
  
    if (!token) {
      return res.status(401).json({ message: 'Yêu cầu xác thực' });
    }
  
    jwt.verify(token, 'mysecretkey', (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Xác thực không hợp lệ' });
      }
      req.user = user;
      next();
    });
};
  
// Route để chuyển khoản
router.post('/transfer', async (req, res) => {
    try {
        console.log(req.body);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi trong quá trình xử lý' });
    }
});

module.exports = router;
