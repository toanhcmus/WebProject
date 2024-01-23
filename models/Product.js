const db = require('../utilities/database');

module.exports = class Product {
    constructor(raw) {
        this.id = raw.id;
        this.name = raw.name;
        this.count = raw.count;
        this.price = raw.price;
        this.size = raw.size;
        this.item=raw.item;
        this.tinyDes=raw.tinyDes;
        this.fullDes=raw.fullDes;
        this.image=raw.image;
        this.producer=raw.producer;
        this.discounut=raw.dicount;
    }
    static async allProduct() {
        return await db.allProduct();
    }
    static async search(name) {
        return await db.search(name);
    }
    static async sort(option) {
        return await db.sort(option);
    }
    static async addProduct(id,name,tinyDes,fullDes,price, size,items,count,producer,imageUrl) {
        console.log('â')
        await db.addProduct(id,name,tinyDes,fullDes,price, size,items,count,producer,imageUrl);
    }
    static async chart() {
        const data=await db.chart();
        return data;
    }
    static async paging(search,sort,fil) {
        const data=await db.paging(search,sort,fil);
        return data;
    }
    static async filter(filter) {
        const data=await db.filter(filter);
        return data;
    }
    static async getNoiBat() {
        console.log('day')
        return await db.getNoiBat();
    }
    static async getProductByCategoryItem(itemID){
        return await db.getProductByCategoryItem(itemID);
    }
    static async getProductByCategory(catID){
        return await db.getProductByCategory(catID);
    }
    static async deleteProduct(id){
        return await db.deleteProduct(id);
    }
    static async updateByID(id,name,tinyDes,fullDes,price, size,items,count,producer){
       return await db.updateProduct(id,name,tinyDes,fullDes,price, size,items,count,producer);
    } 
    static async getProductByID(id){
        return await db.getProductByID(id);
    }
    static async getProductCon(id){
        return await db.getProductCon(id);
    }
    static async getProductSuggest(id){
        return await db.getProductSuggest(id);
    }
};
