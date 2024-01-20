const db = require('../utilities/database');

module.exports = {
    getAll: async () => {
        const res = await db.db.query(
            `
            SELECT * FROM "Categories"
            ORDER BY "CatID" ASC
            `
        );

        return res;
    },
    deleteByID: async (catID) => {
        try {
            const res = await db.db.query(
                `
                DELETE FROM "Categories"
                WHERE "CatID" = $1
                --CASCADE
                `,
                [catID],
            );
    
            return res;
        } catch (error) {
            throw error;
        }
    },
    addCategory: async (catID, catName) => {
        const res = await db.db.query(
            `
            INSERT INTO "Categories" ("CatID","CatName")
            VALUES ($1,$2)
            `,
            [catID,catName],
        );

        return res;
    },
    updateCategory: async (catID,catName) => {
        const res = await db.db.query(
            `
            UPDATE "Categories"
            SET "CatName" = $1
            WHERE "CatID" = $2
            `,
            [catID,catName],
        );
        return res;
    }
};
