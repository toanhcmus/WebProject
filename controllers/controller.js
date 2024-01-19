const Product=require('../models/Product')
module.exports = {
    render: async (req, res, next) => {
        try {
            //const product= await Product.sanPhamNoiBat();
            //console.log(product)
            res.render('home',{ layout: 'main' });
        }
        catch (error) {
            next(error);
        }
    },
    renderLogin: async (req, res, next) => {
        try {
            res.render('login', { layout: '' });
        }
        catch (error) {
            next(error);
        } 
    },
}