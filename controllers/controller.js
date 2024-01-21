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
    renderAdmin: async(req, res, next) => {
        try {
            res.render('admin/dashboard');
        }
        catch (error) {
            next(error);
        }
    },
    renderLogin: async (req, res, next) => {
        try {
            if (req.user || req.session.user) {
                let account = req.user;
                if (!req.user) account = req.session.user;
                res.render('profile', { layout: 'main', account: account });
            }
            else {
                res.render('login', { layout: '' });
            }
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
    az: async (req, res, next) => {
        try {
            console.log('sort')
            var data=await Product.sort("az")
            console.log(data)
            res.render('products',{products :data});
        }
        catch (error) {
            next(error);
        } 
    },
    acs: async (req, res, next) => {
        try {
            console.log('sort')
            var data=await Product.sort("increase")
            console.log(data)
            res.render('products',{products :data});
        }
        catch (error) {
            next(error);
        } 
    },
    za: async (req, res, next) => {
        try {
            console.log('sort')
            var data=await Product.sort("za")
            console.log(data)
            res.render('products',{products :data});
        }
        catch (error) {
            next(error);
        } 
    },
    des: async (req, res, next) => {
        try {
            console.log('sort')
            var data=await Product.sort("decrease")
            console.log(data)
            res.render('products',{products :data});
        }
        catch (error) {
            next(error);
        } 
    },
    
    
}