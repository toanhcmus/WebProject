const Product = require('../models/Product');
const paymentM = require('../models/Payment');
const billM = require('../models/Bill');
const fs = require('fs');
const path = require('path');
const Category = require('../models/Category');
const billC = require('./bill.c');
const productM = require('../models/Product');
const jwt = require('jsonwebtoken');

module.exports = {
    render: async (req, res, next) => {
        try {
            // console.log(req.session);
            const product = await Product.allProduct();
            const noibat = await  Product.getNoiBat();
            const cart = req.session.cart;

            const categories = await Category.allCategory();       
            const categoryItems = await Category.allCategoryItem();
            const dataForHbs = categories.map((categories) => {
                const items = categoryItems.filter((item) => item.catID === categories.catID);
                return { ...categories, items };
            });
            res.render('home', { layout: 'main', items: product.slice(0, 5),noibat:noibat.splice(0,5),categories: dataForHbs ,cart: cart });

        }
        catch (error) {
            next(error);
        }
    },
    renderAdmin: async (req, res, next) => {
        // if (!req.isAuthenticated() || req.user == null) {
        //     return res.redirect('/login');
        // }
        // if (req.user.isAdmin == false || req.user.isAdmin == null) {
        //     return res.redirect('/');
        // }
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
                const cart = req.session.cart;
                let account = req.user;
                if (!req.user) account = req.session.user;
                // console.log(account);
                let allBills;
                if (req.session.passport.user.strategy === 'google') {
                    allBills = await billM.selectHoaDon(account.Email);
                } else {
                    allBills = await billM.selectHoaDon(account.username);
                }
                const categories = await Category.allCategory();       
                const categoryItems = await Category.allCategoryItem();
                const dataForHbs = categories.map((categories) => {
                    const items = categoryItems.filter((item) => item.catID === categories.catID);
                    return { ...categories, items };
                });
                let user;
                if (req.session.passport.user.strategy === 'google') {
                    user = await paymentM.selectUser(account.Email);
                } else {
                    user = await paymentM.selectUser(account.username);
                }
                let paymentHistory;
                if (req.session.passport.user.strategy === 'google') {
                    paymentHistory = await paymentM.selectPaymentByUser(account.Email);
                } else {
                    paymentHistory = await paymentM.selectPaymentByUser(account.username);
                }
                // console.log("payment History");
                // console.log(paymentHistory);
                const checkS = req.session.passport.user.strategy;
                let userToken;
                if (checkS === 'myS') {
                    const userData = req.user;
                    userToken = {
                        "username": userData.username,
                        "password": userData.password
                    }
                } else {
                    const userData = req.user;
                    // console.log(userData);
                    userToken = {
                        "username": userData.Email
                    }
                }
        
                const token = jwt.sign(userToken, 'mysecretkey', { expiresIn: '1h' });
                
                res.render('profile', { layout: 'main', 
                    account: account, 
                    allBills: allBills, 
                    categories: dataForHbs,
                    cart: cart, 
                    user: user,
                    token: token,
                    paymentHistory: paymentHistory });
            }
            else {
                console.log(req.session);
                res.render('login', { layout: '' });
            }
        }
        catch (error) {
            next(error);
        }
    },
    products: async (req, res, next) => {
        try {
            let url = `${req.protocol}://${req.hostname}${req.originalUrl}`;
            let urlObj = new URL(url);
            let catID = urlObj.searchParams.get("catID");
            let itemID = urlObj.searchParams.get("itemID");
            req.session.catID=null;
            req.session.itemID=null;
            let data = null;
            if (catID) {
                req.session.catID=catID;
                req.session.itemID=null;
                data = await Product.getProductByCategory(parseInt(catID));
            }
            if (itemID) {
                req.session.catID=null;
                req.session.itemID=itemID;
                data = await Product.getProductByCategoryItem(itemID); 
            }
            if (catID == null && itemID == null){
                data = await Product.allProduct();
            }
            const cart = req.session.cart;
            req.session.search='';
            req.session.sort ='';
            req.session.filter ='';
            const categories = await Category.allCategory();       
            const categoryItems = await Category.allCategoryItem();
            const dataForHbs = categories.map((categories) => {
                const items = categoryItems.filter((item) => item.catID === categories.catID);
                return { ...categories, items };
            });
            res.render('products', { products: data.splice(0,4), max:Math.ceil(data.length / 4)+1 , categories: dataForHbs ,cart: cart ,keyword:''});
        }
        catch (error) {
            next(error);
        }
    },
    search: async (req, res, next) => {
        try {
            console.log('search');
            req.session.search=req.body.name;
            // let url = `${req.protocol}://${req.hostname}${req.originalUrl}`;
            // let urlObj = new URL(url);
            // let catID = urlObj.searchParams.get("catID");
            // let itemID = urlObj.searchParams.get("itemID");

            // let data = null;
            // if (catID) {
            //     data = await Product.searchByCat(req.body.name,parseInt(catID));
            // }
            // if (itemID) {
            //     data = await Product.searchByItem(req.body.name,itemID); 
            // }
            // if (catID == null && itemID == null){
            //     data = await Product.search(req.body.name)
            // }
            var data  = await Product.paging(req.session.search,req.session.sort,req.session.filter,req.session.catID,req.session.itemID);
            const cart = req.session.cart;
            console.log(data.length );
            console.log(Math.ceil(data.length / 4))
            const categories = await Category.allCategory();       
            const categoryItems = await Category.allCategoryItem();
            const dataForHbs = categories.map((categories) => {
                const items = categoryItems.filter((item) => item.catID === categories.catID);
                return { ...categories, items };
            });
            res.render('products', { products: data.splice(0,4), max:Math.ceil(data.length / 4)+1 , cart: cart , categories: dataForHbs ,keyword:req.body.name});
        }
        catch (error) {
            next(error);
        }
    },
    sort: async (req, res, next) => {
        try {
            req.session.sort =req.body.option;
            console.log('a',req.session.sort)
            var result  = await Product.paging(req.session.search,req.session.sort,req.session.filter,req.session.catID,req.session.itemID);
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
            var data  = await Product.paging(req.session.search,req.session.sort,req.session.filter,req.session.catID,req.session.itemID);
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
    checkSoLuong: async (req, res, next) => {
        try {
            let soluong=await Product.count(req.body.id);
            console.log('so luong trong ho',soluong[0].count)
            res.json({soluong:soluong[0].count});
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
    paging: async (req, res, next) => {
        try {
            console.log('a',req.session.sort)
            var result  = await Product.paging(req.session.search,req.session.sort,req.session.filter,req.session.catID,req.session.itemID);
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
        
            res.render('./admin/product/chart',{ layout: 'admin', ...data });

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
        
            res.render('./admin/product/chart', {layout:'admin',x:x,y:y,table:table});
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
                await productM.updateProductCount(obj.id, obj.count);
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
            const id = req.params.id;
            if (id === 0) {
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
            }
            res.render('failNoti', { layout: 'transferNoti', id: parseInt(id) });
        }
        catch (error) {
            next(error);
        }
    },
    detailProductForUser: async (req, res, next) => {
        try {
        let id = req.params.id;
        let product = await Product.getProductByID(id);
        let categories = await Category.allCategory();       
        let categoryItems = await Category.allCategoryItem();
        let dataForHbs = categories.map((categories) => {
            const items = categoryItems.filter((item) => item.catID === categories.catID);
            return { ...categories, items };
        });
        const cart = req.session.cart;
        let productCon = await Product.getProductCon(id);
        let productSuggest = await Product.getProductSuggest(id);
        product = product ? product[0] : {};

        res.render("details", {product: product,categories: dataForHbs, productCon, productSuggest,cart:cart,title: "Product" });
        } catch (error) {
            console.log(error)
        }

    },
    /*getProductCat: async (req, res, next) => {
        try {
            const cart = req.session.cart;
            let catID = res.params.catID;
            // console.log("renderPro", req.session);
            const data = await Product.getProductByCategory(catID);
            req.session.search='';
            req.session.sort ='';
            req.session.filter ='';
            const categories = await Category.allCategory();       
            const categoryItems = await Category.allCategoryItem();
            const dataForHbs = categories.map((categories) => {
                const items = categoryItems.filter((item) => item.catID === categories.catID);
                return { ...categories, items };
            });
            res.render('products', { products: data.splice(0,4), max:Math.ceil(data.length / 4)+1 , categories: dataForHbs ,cart: cart ,keyword:''});
        }
        catch (error) {
            next(error);
        }
    },
    getProductItem: async (req, res, next) => {
        try {
            const cart = req.session.cart;
            let itemID = res.params.itemID;
            // console.log("renderPro", req.session);
            const data = await Product.getProductByCategoryItem(itemID);
            req.session.search='';
            req.session.sort ='';
            req.session.filter ='';
            const categories = await Category.allCategory();       
            const categoryItems = await Category.allCategoryItem();
            const dataForHbs = categories.map((categories) => {
                const items = categoryItems.filter((item) => item.catID === categories.catID);
                return { ...categories, items };
            });
            res.render('products', { products: data.splice(0,4), max:Math.ceil(data.length / 4)+1 , categories: dataForHbs ,cart: cart ,keyword:''});
        }
        catch (error) {
            next(error);
        }
    },*/
    renderAbout: async (req, res, next) => {
        try {
            const cart = req.session.cart;
            const categories = await Category.allCategory();       
            const categoryItems = await Category.allCategoryItem();
            const dataForHbs = categories.map((categories) => {
                const items = categoryItems.filter((item) => item.catID === categories.catID);
                return { ...categories, items };
            });
            res.render('about', { layout: 'main',  categories: dataForHbs ,cart: cart });
        }
        catch (error) {
            next(error);
        }
    },
    renderBills: async (req, res, next) => {
        const allBills = await billM.selectAllBills();
        // console.log(allBills);
        res.render('admin/billDetail', { layout: 'admin', allBills: allBills });
    },
    renderPaymentHistory: async (req, res, next) => {
        const userAdmin = await paymentM.selectUser('Admin');
        const paymentHistory = await paymentM.selectAllPayments();
        res.render('admin/paymentHistory', { layout: 'admin', userAdmin: userAdmin, paymentHistory: paymentHistory });
    }
}