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

    static async getAll(){
        try {
            const data = await db.execute('SELECT * FROM "products"');
            return data.map((p) => {
                return new Product(p);
            })
        } catch (error) {
            throw error;
        };
    }
    static async getByID(id){
        try {
            const data = await db.execute(`SELECT * FROM "products" WHERE "id" = '${id}'`);
            if (data.length > 0) {
                return new Passbook(data[0]); // Trả về phần tử đầu tiên của mảng data
            } else {
                return null; // Trả về null nếu không có kết quả nào được tìm thấy
            }
        } catch (error) {
            throw error;
        };
    }
    static async addProduct () {
        const res = await db.db.query(
            `
            INSERT INTO "Products" ()
            VALUES ()
            `,
            [],
        );

        return res;
    }
    static async deleteByID(id){
        const data = await db.db.query(
            `
            DELETE FROM "Products"
            WHERE "id" = $1
            `,
            [id],
        );

        return data;
    }
    static async updateByID(){
        const res = await db.db.query(
            `
            UPDATE "Products"
            SET 
            WHERE
            `,
            [],
        );

        return res;
    } 

};
