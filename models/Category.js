const db = require('../utilities/database');

module.exports = class Category {
    constructor(raw) {
        this.catID = raw.catID;
        this.catName = raw.catName;
        this.catItems = null;
    }
     static async allCategory() {
          return await db.allCategory();
     };
     static async allCategoryItem(){
          return await db.allCategoryItem();
     };
     static async deleteByID(catID){
          return await db.deleteByID(catID);
     };
     static async addCategory(catName){
          return await db.addCategory(catName);
     };
     static async updateCategory(catID,catName){
          return await db.updateCategory(catID, catName);
     };
     static async addItem(itemID, itemName, catID){
     return await db.addItem(itemID, itemName, catID);
     };
     static async updateItem(itemID, itemName, catID){
          return await db.updateItem(itemID, itemName, catID);
     };
     static async deleteItemByID(itemID){
          return await db.deleteItemByID(itemID);
     };
     static async checkCatNameExist(catName){
          return await db.checkCatNameExist(catName);
     }
     static async checkItemNameExist(itemName){
          return await db.checkItemNameExist(itemName);
     }
     static async checkItemIDExist(itemID){
          return await db.checkItemIDExist(itemID);
     }
     static async getCatPage(page, perPage){
          return await db.getCatPage(page, perPage);
     }
};
