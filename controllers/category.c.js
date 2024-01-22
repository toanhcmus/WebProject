const Category=require('../models/Category')
const fs = require('fs');
const path = require('path');

module.exports = {
    renderEditCat: async (req, res, next) => {
        try {

            // if (!req.session.ID) {
            //     res.redirect("/");
            // }                   

            let url = `${req.protocol}://${req.hostname}${req.originalUrl}`;
            let urlObj = new URL(url);
            //console.log(req.originalUrl)
            let deleteID = urlObj.searchParams.get("delete");
            let editID = urlObj.searchParams.get("edit");
            let CatName = urlObj.searchParams.get("catName");
            let add = urlObj.searchParams.get("add");
            //console.log(deleteID,editID,CatName)
            //console.log(add);
            if (deleteID) {
                await Category.deleteByID(parseInt(deleteID));
            }
            if (editID) {
                await Category.updateCategory(parseInt(editID), CatName);
            }
            if (add) {
                await Category.addCategory(add);
            }

            let categories = await Category.allCategory();
            res.render("admin/category/editCategory", { categories, title: "Edit" });

        } catch (error) {
            console.log(error);
            let categories = await Category.allCategory();
            res.render("admin/category/editCategory", { categories, error, title: "Edit" });
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
            res.render('admin/category/viewCategory',{categories: dataForHbs});
        }
        catch (error) {
            next(error);
        }
    },    
}