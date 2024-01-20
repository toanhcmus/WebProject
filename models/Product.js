const db = require('../utilities/database');

module.exports = class Product {
    constructor(raw) {
        this.id = raw.id;
        this.name = raw.name;
        this.count = raw.count;
        this.price = raw.price;
        this.size = raw.size;
        this.item=raw.size;
    }
    static async allProduct() {
        return await db.allProduct();
    }
    static async search(name) {
        return await db.search(name);
    }
};