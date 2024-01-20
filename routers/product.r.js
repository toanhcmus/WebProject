const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const productCtrl = require('../controllers/product.c');
router.use(bodyParser.urlencoded({ extended: true }));
router.use('/', express.json());

router.get("/product/edit",productCtrl.editProduct);
router.get("/product/add",productCtrl.addProduct);
router.get("/product",productCtrl.getAll);

module.exports = router;