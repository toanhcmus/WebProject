const Product=require('../models/Product')
module.exports = {
    render: async (req, res, next) => {
        try {
            const product= await Product.sanPhamNoiBat();
            console.log(product)
            res.render('home',{items:product});
        }
        catch (error) {
            next(error);
        }
    }

}
