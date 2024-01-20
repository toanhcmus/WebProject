const Product=require('../models/Product')
module.exports = {
    render: async (req, res, next) => {
        try {
            const product= await Product.allProduct();
            //console.log(product)
            res.render('home',{ layout: 'main' ,items:product});
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
    products: async (req, res, next) => {
        try {
            const product= await Product.allProduct();

            res.render('products',{products:product});
        }
        catch (error) {
            next(error);
        } 
    },
    search: async (req, res, next) => {
        try {
            console.log('search')
            var data=await Product.search(req.body.name)
            res.render('products',{products :data});
        }
        catch (error) {
            next(error);
        } 
    },
    sort: async (req, res, next) => {
        try {
            console.log('sort')
            var data=await Product.sort(req.body.sort)
            console.log(data)
            res.render('products',{products :data});
        }
        catch (error) {
            next(error);
        } 
    },
    
    
}