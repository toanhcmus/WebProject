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
   }
    
};
