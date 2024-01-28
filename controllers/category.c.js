const Category=require('../models/Category')
const fs = require('fs');
const path = require('path');

module.exports = {
    renderEditCat: async (req, res, next) => {
        if (!req.isAuthenticated() || req.user == null) {
            return res.redirect('/login');
        }
        if (req.user.isAdmin == false || req.user.isAdmin == null) {
            return res.redirect('/');
        }
        try {
            let url = `${req.protocol}://${req.hostname}${req.originalUrl}`;
            let urlObj = new URL(url);
            let deleteID = urlObj.searchParams.get("delete");
            let editID = urlObj.searchParams.get("edit");
            let catName = urlObj.searchParams.get("catName");
            let add = urlObj.searchParams.get("add");
            
            if (deleteID) {
                await Category.deleteByID(parseInt(deleteID));
            }
            if (editID) {
                await Category.updateCategory(parseInt(editID), catName);
            }
            if (add) {
                await Category.addCategory(add);
            }
            let addCatID = urlObj.searchParams.get("addtoID");
            let addItemID = urlObj.searchParams.get("itemID");
            let addItemName = urlObj.searchParams.get("itemName");

            let deleteItemID = urlObj.searchParams.get("deleteItem");

            let editItem =  urlObj.searchParams.get("editItem");
            let itemName =  urlObj.searchParams.get("itemName");
            let itemCategory =  urlObj.searchParams.get("catID");

            if (editItem && itemName && itemCategory){
                await Category.updateItem(editItem, itemName, parseInt(itemCategory));
            }
            
            if (addCatID && addItemID && addItemName){
                await Category.addItem(addItemID, addItemName, parseInt(addCatID));
            }
            if (deleteItemID) {
                await Category.deleteItemByID(deleteItemID);
            }
            
            let categories = await Category.allCategory();       
            let categoryItems = await Category.allCategoryItem();
            let dataForHbs = categories.map((categories) => {
                const items = categoryItems.filter((item) => item.catID === categories.catID);
                return { ...categories, items };
            });
            res.render("admin/category/editCategory", { layout: 'admin', categories: dataForHbs, title: "Edit" });

        } catch (error) {
            let categories = await Category.allCategory();       
            let categoryItems = await Category.allCategoryItem();
            let dataForHbs = categories.map((categories) => {
                const items = categoryItems.filter((item) => item.catID === categories.catID);
                return { ...categories, items };
            });
            res.render("admin/category/editCategory", { categories: dataForHbs, error:'Không thể xoá do tồn tại sản phẩm sản phẩm liên quan tới danh mục muốn hoá hiện tại!', title: "Edit" });
        }
    },
    renderCat: async (req, res, next) => {
        if (!req.isAuthenticated() || req.user == null) {
            return res.redirect('/login');
        }
        if (req.user.isAdmin == false || req.user.isAdmin == null) {
            return res.redirect('/');
        }
        try {
            let url = `${req.protocol}://${req.hostname}${req.originalUrl}`;
            let urlObj = new URL(url);
            let deleteID = urlObj.searchParams.get("delete");
            let editID = urlObj.searchParams.get("edit");
            let catName = urlObj.searchParams.get("catName");
            let add = urlObj.searchParams.get("add");
            

            if (deleteID) {
                await Category.deleteByID(parseInt(deleteID));
            }
            if (catName && await Category.checkCatNameExist(catName)){
                    throw(`Tên danh mục ${catName/*.toLowerCase().replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); })*/} đã tồn tại!`);
            }else {
                if (editID) {
                
                    await Category.updateCategory(parseInt(editID), catName);
                }
            }
            if (add && await Category.checkCatNameExist(add)){
                throw(`Tên danh mục ${add} đã tồn tại!`);
            } else {
                if (add) {
                    await Category.addCategory(add);
                }
            }
            let addCatID = urlObj.searchParams.get("addtoID");
            let addItemID = urlObj.searchParams.get("itemID");
            let addItemName = urlObj.searchParams.get("itemName");
            let editItem =  urlObj.searchParams.get("editItem");
            let itemName =  urlObj.searchParams.get("itemName");
            let itemCategory =  urlObj.searchParams.get("catID");
            let deleteItemID = urlObj.searchParams.get("deleteItem");

            if (itemName && await Category.checkItemNameExist(itemName) || addItemName&&await Category.checkItemNameExist(addItemName)){
                throw(`Tên danh mục ${itemName})} đã tồn tại!`);
            }
            else if (await Category.checkItemIDExist(addItemID)){
                throw(`Danh mục có ID này đã tồn tại!`);
            }
            else {
                if (editItem && itemName && itemCategory){
                    await Category.updateItem(editItem, itemName, parseInt(itemCategory));
                }
                
                if (addCatID && addItemID && addItemName){
                    await Category.addItem(addItemID, addItemName, parseInt(addCatID));
                }
                if (deleteItemID) {
                    await Category.deleteItemByID(deleteItemID);
                }
            }         
            
            let categories = await Category.allCategory();       
            let categoryItems = await Category.allCategoryItem();
            let dataForHbs = categories.map((categories) => {
                const items = categoryItems.filter((item) => item.catID === categories.catID);
                return { ...categories, items };
            });
            res.render("admin/category/viewCategory", { layout: 'admin', categories: dataForHbs, title: "Edit" });

        } catch (error) {
            let categories = await Category.allCategory();       
            let categoryItems = await Category.allCategoryItem();
            let dataForHbs = categories.map((categories) => {
                const items = categoryItems.filter((item) => item.catID === categories.catID);
                return { ...categories, items };
            });
            res.render("admin/category/viewCategory", {  layout: 'admin', categories: dataForHbs, error, title: "Edit" });
        }//:'Không thể xoá do tồn tại sản phẩm sản phẩm liên quan tới danh mục muốn hoá hiện tại!'
    },
    renderCatForHome: async (req, res, next) => {
        try{
            const categories = await Category.allCategory();       
            const categoryItems = await Category.allCategoryItem();
            const dataForHbs = categories.map((categories) => {
                const items = categoryItems.filter((item) => item.catID === categories.catID);
                return { ...categories, items };
            });
            res.render('partials/header',{layout: 'main', categories: dataForHbs, catitem: categoryItems});
        }
        catch (error) {
            next(error);
        }
    },
    getCatPage: async (req, res, next) => {
        if (!req.isAuthenticated() || req.user == null) {
            return res.redirect('/login');
        }
        if (req.user.isAdmin == false || req.user.isAdmin == null) {
            return res.redirect('/');
        }
        let body = req.query;
        let page = body.page;
        let perPage = body.perPage;
        
        let data = await Category.getCatPage(page, perPage);
        const categoryItems = await Category.allCategoryItem();
        const dataForHbs = data.cats.map((cat) => {
            const items = categoryItems.filter((item) => item.catID === cat.catID);
            return { ...cat, items };
        });
        data.cats = dataForHbs;
        //console.log(data);
        res.json(data);
    },
    
}