const Category=require('../models/Category')
const fs = require('fs');
const path = require('path');

module.exports = {
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
    getEdit: async (req, res, next) => {
        try {
            let url = `${req.protocol}://${req.hostname}${req.originalUrl}`;
            let urlObj = new URL(url);
            let deleteCat = urlObj.searchParams.get("delete");
            let editCat = urlObj.searchParams.get("edit");
            let CatName = urlObj.searchParams.get("CatName");
            let id = urlObj.searchParams.get("id");
            let name = urlObj.searchParams.get("name");

            if (deleteCat) {
                await category.deleteByID(parseInt(deleteCat));
            }
            if (editCat) {
                await category.updateCategory(parseInt(editCat), CatName);
            }
            if (id && name) {
                await category.addCategory(id, name);
            }
            let categories = await category.getAll();
            res.render("editCategory", { categories, title: "Edit Category" });

        } catch (error) {

            let categories = await category.getAll();
            res.render("editCategory", { categories, error, title: "Edit Category" });
        }
    },
}