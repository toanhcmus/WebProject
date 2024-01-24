const Product = require('../models/Product');
const paymentM = require('../models/Payment');
const billM = require('../models/Bill');
const fs = require('fs');
const path = require('path');
const Category = require('../models/Category');
module.exports = {
    render: async (req, res, next) => {
        try {
            const product = await Product.allProduct();
            const noibat = await  Product.getNoiBat();
            const cart = req.session.cart;
            res.render('home', { layout: 'main', items: product.slice(0, 5),noibat:noibat.splice(0,5) ,cart: cart });
        }
        catch (error) {
            next(error);
        }
    },
    renderAdmin: async (req, res, next) => {
        try {
            res.render('admin/dashboard', {layout: 'admin'});
        }
        catch (error) {
            next(error);
        }
    },
    renderLogin: async (req, res, next) => {
        try {
            if (req.user) {
                let account = req.user;
                if (!req.user) account = req.session.user;
                console.log(account);
                let allBills;
                if (req.session.passport.user.strategy === 'google') {
                    allBills = await billM.selectHoaDon(account.Email);
                } else {
                    allBills = await billM.selectHoaDon(account.username);
                }
                
                console.log(allBills);
                res.render('profile', { layout: 'main', account: account, allBills: allBills });
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
            const cart = req.session.cart;
            // console.log("renderPro", req.session);
            const data = await Product.allProduct();
            req.session.search='';
            req.session.sort ='';
            req.session.filter ='';
            res.render('products', { products: data.splice(0,4), max:Math.ceil(data.length / 4)+1 , cart: cart ,keyword:''});
        }
        catch (error) {
            next(error);
        }
    },
    search: async (req, res, next) => {
        try {
            console.log('search')
            var data = await Product.search(req.body.name)
            const cart = req.session.cart;
            console.log(data.length );
            console.log(Math.ceil(data.length / 4))
            req.session.search=req.body.name;
            res.render('products', { products: data.splice(0,4), max:Math.ceil(data.length / 4)+1 , cart: cart ,keyword:req.body.name});
        }
        catch (error) {
            next(error);
        }
    },
    sort: async (req, res, next) => {
        try {
            req.session.sort =req.body.option;
            console.log('a',req.session.sort)
            var result  = await Product.paging(req.session.search,req.session.sort,req.session.filter);
            var data=result.splice(0,4);
            res.json(data);
        }
        catch (error) {
            next(error);
        }
    },
    filter: async (req, res, next) => {
        try {
            console.log('filter')
            req.session.filter=req.body.filter;
            var data  = await Product.paging(req.session.search,req.session.sort,req.session.filter);
            // console.log(data);
            res.json({pro:data.splice(0,4), max:Math.ceil(data.length / 4)+1});
        }
        catch (error) {
            next(error);
        }
    },
    addToCart: async (req, res, next) => {
        try {
            let found = false;
            if (!req.session.cart) {
                req.session.cart = [];
            }
            for (let i = 0; i < req.session.cart.length; i++) {
                if (req.session.cart[i].name.trim('') === req.body.name.trim('')) {
                    req.session.cart[i].count = req.body.count;
                    found = true;
                    break;
                }
            }
            if (!found) {
                req.session.cart.push({ id: req.body.id, name: req.body.name, price: parseInt(req.body.price), count: parseInt(req.body.count), image: req.body.image });
            }
            res.json({});
        }
        catch (error) {
            next(error);
        }
    },
    plus: async (req, res, next) => {
        try {
            if (!req.session.cart) {
                req.session.cart = [];
            }
            for (let i = 0; i < req.session.cart.length; i++) {
                if (req.session.cart[i].name.trim('') == req.body.name.trim('')) {
                    req.session.cart[i].count++;
                    break;
                }
            }
            res.json({});
        }
        catch (error) {
            next(error);
        }
    },
    minus: async (req, res, next) => {
        try {
            if (!req.session.cart) {
                req.session.cart = [];
            }
            for (let i = 0; i < req.session.cart.length; i++) {
                if (req.session.cart[i].name.trim('') == req.body.name.trim('')) {
                    if (req.session.cart[i].count == 1) {
                        req.session.cart.splice(i, 1);
                    }
                    else {
                        req.session.cart[i].count--;
                    }
                    break;
                }
            }
            res.json({});
        }
        catch (error) {
            next(error);
        }
    },
    minus: async (req, res, next) => {
        try {
            if (!req.session.cart) {
                req.session.cart = [];
            }
            for (let i = 0; i < req.session.cart.length; i++) {
                if (req.session.cart[i].name.trim('') == req.body.name.trim('')) {
                    if (req.session.cart[i].count == 1) {
                        req.session.cart.splice(i, 1);
                    }
                    else {
                        req.session.cart[i].count--;
                    }
                    break;
                }
            }
            res.json({});
        }
        catch (error) {
            next(error);
        }
    },
    paging: async (req, res, next) => {
        try {
            console.log('a',req.session.sort)
            var result  = await Product.paging(req.session.search,req.session.sort,req.session.filter);
            var data=result.splice((req.body.pagenum-1)*4,4);
            res.json(data);
        }
        catch (error) {
            next(error);
        }
    },
    remove: async (req, res, next) => {
        try {
            if (!req.session.cart) {
                req.session.cart = [];
            }
            for (let i = 0; i < req.session.cart.length; i++) {
                if (req.session.cart[i].name.trim('') == req.body.name.trim('')) {
                    req.session.cart.splice(i, 1);
                    break;
                }
            }
            res.json({});
        }
        catch (error) {
            next(error);
        }
    },
    renderAddProduct: async (req, res, next) => {
        try {
            res.render('./admin/product/viewProduct')
         }
        catch (error) {
            next(error);
        }
    },

    renderChart: async (req, res, next) => {
        try {
            const total=await Product.chart();
            console.log('a',total);
            let tien=new Array(12).fill(0);
            for(let i=0;i<12;i++)
            {
                if(total[i]){
                    if(total[i].thang)
                    tien[total[i].thang-1]=total[i].thanhtien;
                }
               
            }
            const data = {
                x: JSON.stringify([1, 2, 3, 4,5,6,7,8,9,10,11,12]),
                y: JSON.stringify(tien)
            };
        
            res.render('./admin/product/chart', data);

        } catch (error) {
            console.log(error)
        }
    },
    renderTable: async (req, res, next) => {
        try {
            const table=await billM.table(req.body.datepicker);
            console.log(table)
            const total=await Product.chart();
            let tien=new Array(12).fill(0);
            for(let i=0;i<12;i++)
            {
                if(total[i]){
                    if(total[i].thang)
                    tien[total[i].thang-1]=total[i].thanhtien;
                }
               
            }
            
                x=JSON.stringify([1, 2, 3, 4,5,6,7,8,9,10,11,12]),
                y=JSON.stringify(tien)
        
            res.render('./admin/product/chart', {x:x,y:y,table:table});
        } catch (error) {
            console.log(error)
        }
    },
    renderSuccess: async (req, res, next) => {
        try {
            const allTranstions = await paymentM.selectAllPayments();
            let maxxMaGD = 0;
            allTranstions.forEach((element) => {
                if (maxxMaGD < element.maGiaoDich) {
                    maxxMaGD = element.maGiaoDich;
                }
            });
            const latestPayment = await paymentM.selectPayment(maxxMaGD);
            console.log(latestPayment);
            const un = latestPayment.id;
            const total = latestPayment.money;
            const date = latestPayment.Time;

            console.log(req.session.cart);

            const obj = {
                username: un,
                date: date,
                total: total,
                status: 0
            }

            await billM.insertBill(obj);

            const allBills = await billM.selectAllBills();
            let maxxMaHD = 0;
            allBills.forEach(element => {
                if (element.MaHoaDon > maxxMaHD) {
                    maxxMaHD = element.MaHoaDon;
                }
            });

            for (let i = 0; i < req.session.cart.length; i++) {
                const item = req.session.cart[i];
                const obj = {
                    id: item.id,
                    count: item.count
                }
                await billM.addTTHoaDon(maxxMaHD, obj);
            }

            req.session.cart = [];
            res.render('successNoti', { layout: 'transferNoti' });
        }
        catch (error) {
            next(error);
        }
    },
    renderFail: async (req, res, next) => {
        try {
            const allTranstions = await paymentM.selectAllPayments();
            let maxxMaGD = 0;
            allTranstions.forEach((element) => {
                if (maxxMaGD < element.maGiaoDich) {
                    maxxMaGD = element.maGiaoDich;
                }
            });
            const latestPayment = await paymentM.selectPayment(maxxMaGD);
            console.log(latestPayment);
            const un = latestPayment.id;
            const total = latestPayment.money;
            const date = latestPayment.Time;

            const obj = {
                username: un,
                date: date,
                total: total,
                status: 1 // Fail
            }

            await billM.insertBill(obj);

            // const allBills = await billM.selectAllBills();
            // let maxxMaHD = 0;
            // allBills.forEach(element => {
            //     if (element.MaHoaDon > maxxMaHD) {
            //         maxxMaHD = element.MaHoaDon;
            //     }
            // });

            // for (let i = 0; i < req.session.cart.length; i++) {
            //     const item = req.session.cart[i];
            //     const obj = {
            //         id: item.id,
            //         count: item.count
            //     }
            //     await billM.addTTHoaDon(maxxMaHD, obj);
            // }

            req.session.cart = [];
            res.render('failNoti', { layout: 'transferNoti' });
        }
        catch (error) {
            next(error);
        }
    },
    detailProductForUser: async (req, res, next) => {
        try {
            const id = req.params.id;
            const product = await Product.getProductByID(id);
            const categories = await Category.allCategory();       
            const categoryItems = await Category.allCategoryItem();
            const dataForHbs = categories.map((categories) => {
                const items = categoryItems.filter((item) => item.catID === categories.catID);
                return { ...categories, items };
            });
    
            const cart = req.session.cart;
    
            let productCon = await Product.getProductCon(id);
            let productSuggest = await Product.getProductSuggest(id);
    
            // Add cart information to each product in productCon
// Add cart information to each product in productCon
productCon = productCon.map((item) => {
    const cartItem = cart && cart.find((cartItem) => cartItem.id === item.id);
    return { ...item, cartItem };
});

// Add cart information to each product in productSuggest
productSuggest = productSuggest.map((item) => {
    const cartItem = cart && cart.find((cartItem) => cartItem.id === item.id);
    return { ...item, cartItem };
});

// If product exists and cart is defined, add its properties to each item in the cart
if (product && product.length > 0 && cart) {
    cart.forEach((cartItem) => {
        const productInfo = product[0];
        // Add product properties to the cart item
        cartItem.productInfo = productInfo;
    });
}

    
            res.render("details", {
                product: product ? product[0] : {},
                categories: dataForHbs,
                productCon: productCon,
                productSuggest: productSuggest,
                cart: cart,
                title: "Product"
            });
    
        } catch (error) {
            console.log(error);
        }
    },
    
}