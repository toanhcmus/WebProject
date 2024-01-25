const Category=require('../models/Category')
const fs = require('fs');
const path = require('path');

module.exports = {
    renderEditCat: async (req, res, next) => {
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
            console.log(error);
            let categories = await Category.allCategory();       
            let categoryItems = await Category.allCategoryItem();
            let dataForHbs = categories.map((categories) => {
                const items = categoryItems.filter((item) => item.catID === categories.catID);
                return { ...categories, items };
            });
            res.render("admin/category/editCategory", { categories: dataForHbs, error, title: "Edit" });
        }
    },
    renderCat: async (req, res, next) => {
        try{
            const categories = await Category.allCategory();       
            const categoryItems = await Category.allCategoryItem();
            const dataForHbs = categories.map((categories) => {
                const items = categoryItems.filter((item) => item.catID === categories.catID);
                return { ...categories, items };
            });
            res.render('admin/category/viewCategory',{layout: 'admin', categories: dataForHbs});
        }
        catch (error) {
            next(error);
        }
    },
    renderCatForHome: async (req, res, next) => {
        try{
            const categories = await Category.allCategory();       
            const categoryItems = await Category.allCategoryItem();
            const dataForHbs = categories.map((categories) => {
                const items = categoryItems.filter((item) => item.catID === categories.catID);
                return { ...categories, items };
            });
            res.render('partials/header',{layout: 'main', categories: dataForHbs});
        }
        catch (error) {
            next(error);
        }
    },
}