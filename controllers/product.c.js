const product = require('../models/Product')
const fs = require('fs');
const path = require('path');

module.exports = {
    getAll: async (req, res, next) => {
        
    },
    addProduct: async (req, res, next) => {
        try {
            let {} = req.body;
            const file = req.file;

            console.log(file)
            //fs.mkdirSync(`pid/${}`);
            Product();

            res.redirect('back');
        } catch (error) {
            
            console.log(error)
            res.redirect('back');
        }
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