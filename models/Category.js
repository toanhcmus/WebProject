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
    
};
