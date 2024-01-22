const product = require('../models/Product')
const fs = require('fs');
const path = require('path');

module.exports = {
    getAll: async (req, res, next) => {

    },
    
    editProduct: async (req, res, next) => {
        try {
            let { } = req.body;
            await product.updateByID();
            res.redirect('back');
        } catch (error) {
            console.log(error)
            res.redirect('back');
        }
    }

}