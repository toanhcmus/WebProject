const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const categoryCtrl = require('../controllers/category.c');
router.use(bodyParser.urlencoded({ extended: true }));
router.use('/', express.json());

router.get("/category/edit",categoryCtrl.getEdit);
router.get("/category",categoryCtrl.getAll);

module.exports = router;