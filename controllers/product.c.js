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
        let deleteID = urlObj.searchParams.get("delete");
        let products = null;

        if(deleteID){
            await Product.deleteProduct(deleteID);
        }        
        if (catID) {
            products = await Product.getProductByCategory(parseInt(catID));
        }
        if (itemID) {
            products = await Product.getProductByCategoryItem(itemID); 
        }
        if (catID == null && itemID == null){
            products = await Product.allProduct();
        }
        let categories = await Category.allCategory();       
        let categoryItems = await Category.allCategoryItem();
        let dataForHbs = categories.map((categories) => {
            const items = categoryItems.filter((item) => item.catID === categories.catID);
            return { ...categories, items };
        });
        res.render("admin/product/viewProduct", {products, categories: dataForHbs, title: "Dashboard" });
    },
    addProduct: async (req, res, next) => {
        try {
            console.log(req.body);
            await Product.addProduct(req.body.inputID,req.body.inputName,req.body.tinyDes, req.body.fullDes,req.body.price,req.body.size,req.body.items,req.body.count,req.body.producer,req.body.imageUrl );
           
            res.redirect('back');
        } catch (error) {
            console.log(error)
        }

    },
    editProduct: async (req, res, next) => {
        try {
            console.log(req.body);
            const countArray = req.body.count1.split(',').map(Number);
            await Product.updateByID(req.body.inputID1,req.body.inputName1,req.body.tinyDes1, req.body.fullDes1,req.body.price1,req.body.size1,req.body.items1,countArray,req.body.producer1);
           
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
        res.render("admin/product/detailProduct", {product: product, categories: dataForHbs, productCon, productSuggest,title: "Product" });

        } catch (error) {
            console.log(error)
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

        let productCon = await Product.getProductCon(id);
        let productSuggest = await Product.getProductSuggest(id);
        product = product ? product[0] : {};
        res.render("details", {product: product,categories: dataForHbs, productCon, productSuggest,title: "Product" });

        } catch (error) {
            console.log(error)
        }

    },
}