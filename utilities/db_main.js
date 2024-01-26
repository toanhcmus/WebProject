const db = require('../utilities/connectDB_main');

module.exports = {
    selectAllBills: async () => {
        const rs = await db.any('SELECT * FROM "HoaDon"');
        return rs;
    },
    addTTHoaDon: async (MaHoaDon, obj) => {
        try {
            await db.none(
                'INSERT INTO "ThongTinHoaDon" ("MaHoaDon", "MaSP", "SoLuong") VALUES ($1, $2, $3)',
                [MaHoaDon, obj.id, obj.count]
            );
        } catch (error) {
            console.error("Error inserting:", error);
            throw error;
        }
    },
    insertBill: async (obj) => {
        await db.none(
            'INSERT INTO "HoaDon" ("username", "NgayLap", "ThanhTien", "TrangThai") VALUES($1, $2, $3, $4)',
            [obj.username, obj.date, obj.total, obj.status]
        );

    },
    selectHoaDon: async (username) => {
        const rs = await db.any(
            'SELECT * FROM "HoaDon" WHERE "username" = $1;',
            [username]
        );
        return rs;
    },
    selectTTHoaDon: async (MaHD) => {
        const rs = await db.any(
            'SELECT * FROM "ThongTinHoaDon" WHERE "MaHoaDon" = $1;',
            [MaHD]
        );
        return rs;
    },
    updateStatus: async (id, status) => {
        const updateQuery = 'UPDATE public."HoaDon" SET "TrangThai" = $1 WHERE "id" = $2';
        await db.none(updateQuery, [status, id]);
    },
    updateProductCount: async (id, count) => {
        const updateQuery = 'UPDATE public."Products" SET "count" = "count" - $1 WHERE "id" = $2';
        await db.none(updateQuery, [count, id]);
    },
    allProduct: async () => {
        const data = await db.any(`SELECT * FROM "Products"  ORDER BY "id" ASC`);
        return data;
    },
    search: async (name) => {
        const data = await db.any(`SELECT * FROM "Products" WHERE "name" ILIKE '%${name}%'`);
        return data;
    },
    searchByCat: async (name, catID) => {
        const data = await db.query(`
            SELECT * FROM "Products" p
            JOIN "CategoryItems" c ON p."item" = c."itemID"
            JOIN "Categories" ca ON c."catID" = ca."catID"
            WHERE ca."catID" = ${catID}  AND p."name" ILIKE '%${name}%'
            ORDER BY p."id" ASC
        `);
        return data;
    },
    searchByItem: async (name, itemID) => {
        const data = await db.query(` SELECT * FROM "Products" p
        JOIN "CategoryItems" c ON p."item" = c."itemID"
        WHERE c."itemID" = '${itemID}' p."name" ILIKE '%${name}%'
        ORDER BY p."id" ASC`);
        return data;
    },
    addProduct: async (id, name, tinyDes, fullDes, price, items, count, producer, imageUrl) => {
        console.log('Product added');
        const insertQuery = 'INSERT INTO "Products" ("id", "name", "tinyDes", "fullDes", "price", "item", "count", "producer", "images") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)';
        try {
            await db.none(insertQuery, [id, name, tinyDes, fullDes, price, items, count, producer, imageUrl]);
            console.log('Product added');
        } catch (error) {
            console.log(error);
        }
    },
    getNoiBat: async () => {
        let query = `
        SELECT 
            "Products".id,
            "Products".name,
            "Products".price,
            "Products".images,            
            COALESCE(SUM("ThongTinHoaDon"."SoLuong"), 0) AS soluong
        FROM 
        "Products" 
        LEFT JOIN 
             "ThongTinHoaDon" ON "ThongTinHoaDon"."MaSP" = "Products"."id"
        GROUP BY
            "Products".id,"Products".name,
            "Products".price,
            "Products".images
        ORDER BY  soluong DESC
            `
        const data = await db.any(query);
        //console.log('bbbb', data)
        return data;
    },
    chart: async () => {
        let query = `
        SELECT
            EXTRACT(MONTH FROM "NgayLap"::date)  AS Thang,
            SUM("ThanhTien") AS ThanhTien
        FROM
            "HoaDon"
        GROUP BY
            EXTRACT(MONTH FROM "NgayLap"::date)
        ORDER BY EXTRACT(MONTH FROM "NgayLap"::date) ASC
            `
        const data = await db.any(query);
        return data;
    },
    table: async (date) => {
        let query = `
        SELECT 
            "Products"."id",
            "Products"."name",
            "Products"."price",
            SUM("ThongTinHoaDon"."SoLuong") AS soluong,
            SUM("Products"."price" * "ThongTinHoaDon"."SoLuong") AS thanhtien
        FROM 
            "HoaDon"
        JOIN 
            "ThongTinHoaDon" ON "HoaDon"."MaHoaDon" = "ThongTinHoaDon"."MaHoaDon"
        INNER JOIN 
            "Products" ON "ThongTinHoaDon"."MaSP" = "Products"."id"
        WHERE 
            EXTRACT(MONTH FROM "HoaDon"."NgayLap"::date) = EXTRACT(MONTH FROM $1::date)
            AND EXTRACT(YEAR FROM "HoaDon"."NgayLap"::date) = EXTRACT(YEAR FROM $1::date)
        GROUP BY
            "Products"."id","Products"."name","Products"."price"
            `
        const data = await db.any(query, [date]);
        return data;
    },
    sort: async (option) => {
        let data;
        if (option === "decrease") {
            console.log('cr')
            data = await db.any(`SELECT * FROM "Products"  ORDER BY "price" DESC`);
        }
        else if (option === "increase") {
            console.log('incr')
            data = await db.any(`SELECT * FROM "Products"  ORDER BY "price" ASC`);
        }
        else if (option === "az") {
            data = await db.any(`SELECT * FROM "Products"  ORDER BY "name" ASC`);
        }
        else {
            data = await db.any(`SELECT * FROM "Products"  ORDER BY "name" DESC`);
        }
        return data;
    },
    paging: async (search, sort, fi,catID,itemID) => {
        let query = `SELECT "Products".* FROM "Products"
                        JOIN "CategoryItems" c ON "Products"."item" = c."itemID"
                        JOIN "Categories" ca ON c."catID" = ca."catID"`;
            query += ` WHERE "name" ILIKE '%${search}%'`;
            if (catID)
            {
                query+=` AND ca."catID" = ${catID}`
            }
            if (itemID)
            {
                query+=` AND c."itemID" = '${itemID}'`;
            }
        let producerConditions = [];
        let priceConditions = [];
        if (fi) {
            for (let i = 0; i < fi.length; i++) {
                switch (fi[i]) {
                    case "500k":
                        priceConditions.push(`"price" < 500000`);
                        break;
                    case "1000k":
                        priceConditions.push(`("price" >= 500000 AND "price" < 1000000)`);
                        break;
                    case "2000k":
                        priceConditions.push(`("price" >= 1000000 AND "price" < 2000000)`);
                        break;
                    case "3000k":
                        priceConditions.push(`"price" > 2000000`);
                        break;
                    case "Khac":
                        producerConditions.push(`"producer" NOT ILIKE '%TEELAB%' AND "producer" NOT ILIKE '%Coolmate%' AND "producer" NOT ILIKE '%Yame%' AND "producer" NOT ILIKE '%Routine%'`);
                        break;
                    default:
                        producerConditions.push(`"producer" ILIKE '%${fi[i]}%'`);
                        break;
                }
            }

            let conditions = [];
            if (producerConditions.length > 0) {
                conditions.push(`(${producerConditions.join(' OR ')})`);
            }
            if (priceConditions.length > 0) {
                conditions.push(`(${priceConditions.join(' OR ')})`);
            }

            if (conditions.length > 0) {
                query += ` AND ` + conditions.join(' AND ');
            }
        }
        if(!sort){
            query += ` ORDER BY "name" ASC`;
        }
        else if (sort.trim('') === "decrease") {
            query += ` ORDER BY "price" DESC`;
        } else if (sort.trim('') === "increase") {
            query += ` ORDER BY "price" ASC`;
        } else if (sort.trim('') === "za") {
            query += ` ORDER BY "name" DESC`;
        } else {
            query += ` ORDER BY "name" ASC`;
        }

        const data = await db.any(query);
        return data;
    },
    filter: async (fi) => {

        let query = `SELECT * FROM "Products"`;
        let producerConditions = [];
        let priceConditions = [];

        for (let i = 0; i < fi.length; i++) {
            switch (fi[i]) {
                case "500k":
                    priceConditions.push(`"price" < 500000`);
                    break;
                case "1000k":
                    priceConditions.push(`("price" >= 500000 AND "price" < 1000000)`);
                    break;
                case "2000k":
                    priceConditions.push(`("price" >= 1000000 AND "price" < 2000000)`);
                    break;
                case "3000k":
                    priceConditions.push(`"price" > 2000000`);
                    break;
                case "Khac":
                    producerConditions.push(`"producer" NOT ILIKE '%TEELAB%' AND "producer" NOT ILIKE '%Coolmate%' AND "producer" NOT ILIKE '%Yame%' AND "producer" NOT ILIKE '%Routine%'`);
                    break;
                default:
                    producerConditions.push(`"producer" ILIKE '%${fi[i]}%'`);
                    break;
            }
        }

        let conditions = [];
        if (producerConditions.length > 0) {
            conditions.push(`(${producerConditions.join(' OR ')})`);
        }
        if (priceConditions.length > 0) {
            conditions.push(`(${priceConditions.join(' OR ')})`);
        }

        if (conditions.length > 0) {
            query += ` WHERE ` + conditions.join(' AND ');
        }

        const data = await db.any(query);
        return data;


    },
    insertUser: async (newUser) => {
        const insertUserQuery = 'INSERT INTO "Users" ("Username", "Password", "Email", "isAdmin") VALUES ($1, $2, $3, $4)';
        const insertUserValues = [newUser.username, newUser.password, newUser.email, newUser.isAdmin];
        try {
            await db.none(insertUserQuery, insertUserValues);
            console.log('User added');
        } catch (error) {
            console.log(error);
        }
    },
    checkUsernameExist: async (username) => {
        const checkUsernameExistQuery = 'SELECT "Username" FROM "Users" WHERE "Username" = $1';
        const checkUsernameExistValues = [username];
        try {
            const checkUsernameExistResult = await db.oneOrNone(checkUsernameExistQuery, checkUsernameExistValues);
            return checkUsernameExistResult ? true : false;
        } catch (error) {
            console.log(error);
            return false;
        }
    },
    checkEmailExist: async (email) => {
        const checkEmailExistQuery = 'SELECT "Email" FROM "Users" WHERE "Email" = $1';
        const checkEmailExistValues = [email];
        try {
            const checkEmailExistResult = await db.oneOrNone(checkEmailExistQuery, checkEmailExistValues);
            return checkEmailExistResult ? true : false;
        } catch (error) {
            console.log(error);
            return false;
        }
    },
    editUser: async (username, newEmail, newPassword) => {
        const editUserQuery = 'UPDATE "Users" SET "Email" = $1, "Password" = $2 WHERE "Username" = $3';
        const editUserValues = [newEmail, newPassword, username];
        try {
            await db.none(editUserQuery, editUserValues);
            console.log('User updated');
        } catch (error) {
            console.log(error);
        }
    },
    removeUser: async (username) => {
        const removeUserQuery = 'DELETE FROM "Users" WHERE "Username" = $1';
        const removeUserValues = [username];
        try {
            await db.none(removeUserQuery, removeUserValues);
            console.log('User removed');
        } catch (error) {
            console.log(error);
        }
    },
    getAllUsers: async () => {
        const getAllUsersQuery = 'SELECT * FROM "Users"';
        try {
            const getAllUsersResult = await db.any(getAllUsersQuery);
            return getAllUsersResult;
        } catch (error) {
            console.log(error);
            return null;
        }
    },
    getUser: async (username) => {
        const getUserQuery = 'SELECT * FROM "Users" WHERE "Username" = $1';
        const getUserValues = [username];
        try {
            const getUserResult = await db.oneOrNone(getUserQuery, getUserValues);
            return getUserResult;
        } catch (error) {
            console.log(error);
            return null;
        }
    },
    getPassword: async (username) => {
        const getPasswordQuery = 'SELECT "Password" FROM "Users" WHERE "Username" = $1';
        const getPasswordValues = [username];
        try {
            const getPasswordResult = await db.oneOrNone(getPasswordQuery, getPasswordValues);
            return getPasswordResult ? getPasswordResult.Password : null;
        } catch (error) {
            console.log(error);
            return null;
        }
    },
    getUsersPage: async (page, perPage) => {
        const getUsersPageQuery = 'SELECT * FROM "Users" ORDER BY "isAdmin" DESC LIMIT $1 OFFSET $2';
        const getUsersPageValues = [perPage, (page - 1) * perPage];
        try {
            const getUsersPageResult = await db.any(getUsersPageQuery, getUsersPageValues);
            const maxPage = Math.ceil((await db.one('SELECT COUNT(*) FROM "Users"')).count / perPage);
            return { users: getUsersPageResult, maxPage };
        } catch (error) {
            console.log(error);
            return null;
        }
    },
    insertGoogleUser: async (newUser) => {
        const insertUserQuery = 'INSERT INTO "GoogleAccount" ("Name", "Email", "Avatar") VALUES ($1, $2, $3) ON CONFLICT ("Email") DO NOTHING';
        const insertUserValues = [newUser.Name, newUser.Email, newUser.Avatar];
        try {
            await db.none(insertUserQuery, insertUserValues);
        } catch (error) {
            console.log(error);
        }
    },
    getGoogleUser: async (Email) => {
        const getUserQuery = 'SELECT * FROM "GoogleAccount" WHERE "Email" = $1';
        const getUserValues = [Email];
        try {
            const getUserResult = await db.oneOrNone(getUserQuery, getUserValues);
            return getUserResult;
        } catch (error) {
            console.log(error);
            return null;
        }
    },
    getAllGoogleUsers: async () => {
        const getAllUsersQuery = 'SELECT * FROM "GoogleAccount"';
        try {
            const getAllUsersResult = await db.any(getAllUsersQuery);
            return getAllUsersResult;
        } catch (error) {
            console.log(error);
            return null;
        }
    },
    allCategory: async () => {
        const data = await db.any(`SELECT * FROM "Categories" ORDER BY "catID" ASC`);
        return data;
    },

    allCategoryItem: async () => {
        const data = await db.any(`
        SELECT * FROM "CategoryItems" ORDER BY "itemID" ASC`);
        return data;
    },
    deleteByID: async (catID) => {
        try {
            const res = await db.query(
                `
                DELETE FROM "Categories"
                WHERE "catID" = $1
                --CASCADE
                `,
                [catID],
            );

            return res;
        } catch (error) {
            console.log(error);
            throw error;
        }
    },
    addCategory: async (catName) => {
        try {
            const maxID = await db.oneOrNone('SELECT MAX("catID") FROM "Categories"');
            const res = await db.query(
                'INSERT INTO "Categories" ("catID", "catName") VALUES ($1, $2)',
                [maxID.max + 1, catName]
            );
            return res;
        } catch (error) {
            console.log(error);
            throw error;
        }
    },
    updateCategory: async (catID, catName) => {
        try {
            const res = await db.query(
                `
                UPDATE "Categories"
                SET "catName" = $1
                WHERE "catID" = $2
                `,
                [catName, catID],
            );

            return res;
        } catch (error) {
            console.log(error);
            throw error;
        }
    },
    deleteItemByID: async (itemID) => {
        try {
            const res = await db.query(
                `
                DELETE FROM "CategoryItems"
                WHERE "itemID" = $1
                --CASCADE
                `,
                [itemID],
            );

            return res;
        } catch (error) {
            console.log(error);
            throw error;
        }
    },
    addItem: async (itemID, itemName, catID) => {
        try {
            const res = await db.query(
                'INSERT INTO "CategoryItems" ("itemID", "itemName", "catID") VALUES ($1, $2, $3)',
                [itemID, itemName, catID]
            );
            return res;
        } catch (error) {
            console.log(error);
            throw error;
        }
    },

    updateItem: async (itemID, itemName, catID) => {
        try {
            const res = await db.query(
                `
                UPDATE "CategoryItems"
                SET "itemName" = $1,"catID" = $2
                WHERE "itemID" = $3
                `,
                [itemName, catID, itemID],
            );

            return res;
        } catch (error) {
            console.log(error);
            throw error;
        }
    },

    getProductByCategory: async (catID) => {
        try {
            const res = await db.query(`
            SELECT * FROM "Products" p
            JOIN "CategoryItems" c ON p."item" = c."itemID"
            JOIN "Categories" ca ON c."catID" = ca."catID"
            WHERE ca."catID" = ${catID} 
            ORDER BY p."name" ASC
            `);
            return res;
        } catch (error) {
            console.log(error);
            throw error;
        }
    },

    getProductByCategoryItem: async (itemID) => {
        try {
            const res = await db.query(`
            SELECT * FROM "Products" p
            JOIN "CategoryItems" c ON p."item" = c."itemID"
            WHERE c."itemID" = '${itemID}'
            ORDER BY p."name" ASC
            `);
            return res;
        } catch (error) {
            console.log(error);
            throw error;
        }
    },
    deleteProduct: async (id) => {
        try {
            const res = await db.query(
                `
            DELETE FROM "Products"
            WHERE "id" = $1
            --CASCADE
            `,
                [id],
            );
            return res;
        } catch (error) {
            console.log(error);
            throw error;
        }
    },
    updateProduct: async (id, name, tinyDes, fullDes, price, items, count, producer) => {
        try {
            const res = await db.query(
                `
            UPDATE "Products"
            SET "name"=$2,"tinyDes"=$3,"fullDes"=$4,"price"=$5,"item"=$6, "count"=$7, "producer"=$8
            WHERE "id" = $1;
            SELECT * FROM "Products"
            ORDER BY id;
            `,
                [id, name, tinyDes, fullDes, price, items, count, producer],
            );

            return res;
        } catch (error) {
            console.log(error);
        }
    },

    getProductByID: async (id) => {
        try {
            const res = await db.query(
                `
           SELECT * FROM "Products"
            WHERE "id" = $1
            `,
                [id],
            );
            return res;
        } catch (error) {
            console.log(error);
            throw error;
        }
    },
    getProductCon: async (id) => {
        try {
            const res = await db.query(`
            SELECT *
            FROM "Products"
            WHERE "item" = (SELECT "item" FROM "Products" WHERE "id" = $1)
            AND "id" != $1;
            `,
                [id],);
            return res
        } catch (error) {
            console.log(error);
            throw error;
        }
    },
    getProductSuggest: async (id) => {
        try {
            const res = await db.query(
                `SELECT *
                FROM "Products"
                WHERE "item" IN (
                    SELECT "itemID"
                    FROM "CategoryItems"
                    WHERE "catID" IN (
                        SELECT "catID"
                        FROM "Categories"
                        WHERE "catID" = (
                            SELECT "catID"
                            FROM "CategoryItems" 
                            JOIN "Products" ON "item" = "itemID"
                            WHERE "id" = $1
                        )
                    )
                )
                ORDER BY RANDOM()
                LIMIT 16;
                `,
                [id],
            );
            return res;
        } catch (error) {
            console.log(error);
            throw error;
        }
    },
}