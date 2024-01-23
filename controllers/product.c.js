const product = require('../models/Product');
const fs = require('fs');
const path = require('path');
const Category = require('../models/Category');
module.exports = {
    renderProduct: async (req, res, next) => {
        let url = `${req.protocol}://${req.hostname}${req.originalUrl}`;
        if (!url.includes("?")) {
            // Nếu không có dấu "?", thêm nó vào
            url = url + "?";
        }
        let urlObj = new URL(url);
        let CatID = urlObj.searchParams.get("catID");
        let itemID = urlObj.searchParams.get("itemID");
        let deleteID = urlObj.searchParams.get("delete");
        console.log(urlObj);
        console.log(url);
        if(deleteID){
            await product.deleteProduct(deleteID);
        }
        console.log(deleteID);
        let products = null;
        if (CatID) {
            products = await product.getProductByCategory(parseInt(CatID));
        }
        if (itemID) {
            products = await product.getProductByCategoryItem(itemID); 
        }
        else {
            products = await product.allProduct();
        }
        let categories = await Category.allCategory();       
        let categoryItems = await Category.allCategoryItem();
        let dataForHbs = categories.map((categories) => {
            const items = categoryItems.filter((item) => item.catID === categories.catID);
            return { ...categories, items };
        });
        res.render("admin/product/viewProduct", {products, categories: dataForHbs, title: "Dashboard" });
    },

}