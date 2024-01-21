const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const categoryCtrl = require('../controllers/category.c');
router.use(bodyParser.urlencoded({ extended: true }));
router.use('/', express.json());

router.get("/admin/category/edit",categoryCtrl.getEdit);
router.get("/admin/category",categoryCtrl.getAll);

module.exports = router;