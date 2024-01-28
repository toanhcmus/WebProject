const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');
const Category = require('../models/Category');

module.exports = {
    renderProduct: async (req, res, next) => {
        let url = `${req.protocol}://${req.hostname}${req.originalUrl}`;
        let urlObj = new URL(url);
        let catID = urlObj.searchParams.get("catID");
        let itemID = urlObj.searchParams.get("itemID");
        req.session.catID=null;
        req.session.itemID=null;
        let deleteID = urlObj.searchParams.get("delete");

        if(deleteID){
            await Product.deleteProduct(deleteID);
        }        
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
        req.session.search='';
        req.session.sort ='';
        req.session.filter ='';
        const categories = await Category.allCategory();       
        const categoryItems = await Category.allCategoryItem();
        const dataForHbs = categories.map((categories) => {
            const items = categoryItems.filter((item) => item.catID === categories.catID);
            return { ...categories, items };
        });
        res.render("admin/product/viewProduct", {products: data.splice(0,8), max:Math.ceil(data.length / 8)+1 , categories: dataForHbs, catitem: categoryItems,keyword:'', title: "Dashboard", layout: 'admin'});
    },
    addProduct: async (req, res, next) => {
        try {
            let id = req.body.inputID;
            if (await Product.checkProductExist(id)){
                throw(`Đã tồn tại sản phẩm có ID là ${id}`)
            }
            else {
                console.log(req.body);
                await Product.addProduct(req.body.inputID,req.body.inputName,req.body.tinyDes, req.body.fullDes,req.body.price,req.body.items,req.body.count,req.body.producer,req.body.imageUrl );
               
                res.redirect('back');
            }

        } catch (error) {
            console.log(error)
            let url = `${req.protocol}://${req.hostname}${req.originalUrl}`;
            let urlObj = new URL(url);
            let catID = urlObj.searchParams.get("catID");
            let itemID = urlObj.searchParams.get("itemID");
            req.session.catID=null;
            req.session.itemID=null;
            let deleteID = urlObj.searchParams.get("delete");

            if(deleteID){
                await Product.deleteProduct(deleteID);
            }        
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
            req.session.search='';
            req.session.sort ='';
            req.session.filter ='';
            const categories = await Category.allCategory();       
            const categoryItems = await Category.allCategoryItem();
            const dataForHbs = categories.map((categories) => {
                const items = categoryItems.filter((item) => item.catID === categories.catID);
                return { ...categories, items };
            });
            res.render("admin/product/viewProduct", {products: data.splice(0,8), max:Math.ceil(data.length / 8)+1 , categories: dataForHbs, catitem: categoryItems,keyword:'',error, title: "Dashboard", layout: 'admin'});
        }

    },
    editProduct: async (req, res, next) => {
        try {
            console.log(req.body);
            await Product.updateByID(req.body.inputID1,req.body.inputName1,req.body.tinyDes1, req.body.fullDes1,req.body.price1,req.body.items1,req.body.count1,req.body.producer1);
           
            res.redirect('back');
        } catch (error) {
            console.log(error)
            res.redirect('back');
        }
    },
    detailProduct: async (req, res, next) => {
        try {
        let id = req.params.id;
        let product = await Product.getProductByID(id);
        
        let categories = await Category.allCategory();       
        let categoryItems = await Category.allCategoryItem();
        let dataForHbs = categories.map((categories) => {
            const items = categoryItems.filter((item) => item.catID === categories.catID);
            return { ...categories, items };
        });

        let productCon = await Product.getProductCon(id);
        let productSuggest = await Product.getProductSuggest(id);
        product = product ? product[0] : {};
        res.render("admin/product/detailProduct", {product: product, categories: dataForHbs, productCon, productSuggest,title: "Product" ,layout: 'admin'});

        } catch (error) {
            console.log(error)
        }
    },
    getProPage: async (req, res, next) => {
        if (!req.isAuthenticated() || req.user == null) {
            return res.redirect('/login');
        }
        if (req.user.isAdmin == false || req.user.isAdmin == null) {
            return res.redirect('/');
        }
        let body = req.query;
        let page = body.page;
        let perPage = body.perPage;
        let catID = null;
        let itemID = null;
        let data = await Category.getCatPage(page, perPage);
        /*const categoryItems = await Category.allCategoryItem();
        const dataForHbs = data.cats.map((cat) => {
            const items = categoryItems.filter((item) => item.catID === cat.catID);
            return { ...cat, items };
        });*/
        //console.log(data);
        res.json(data);
    },
}