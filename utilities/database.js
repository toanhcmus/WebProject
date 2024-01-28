require('dotenv').config();

const db = require('./connectDB');

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
        const data = await db.any(`SELECT * FROM "Products" ORDER BY "name" ASC`);
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
            "Products".count,            
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
        return data;
    },
    count: async (id) => {
        let query = `
        SELECT 
            "Products".count
        FROM "Products" WHERE id='${id}'

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
    checkCatNameExist: async (catName) => {
        catName = catName.toLowerCase();
        const checkCatNameExistQuery = 'SELECT "catName" FROM "Categories" WHERE LOWER("catName") = $1';
        const checkCatNameExistValues = [catName];
        try {
            const checkCatNameExistResult = await db.oneOrNone(checkCatNameExistQuery, checkCatNameExistValues);
            return checkCatNameExistResult ? true : false;
        } catch (error) {
            console.log(error);
            return false;
        }
    },
    checkProductExist: async (id) => {
        const checkCatNameExistQuery = 'SELECT "id" FROM "Products" WHERE "id" = $1';
        const checkCatNameExistValues = [id];
        try {
            const checkCatNameExistResult = await db.oneOrNone(checkCatNameExistQuery, checkCatNameExistValues);
            return checkCatNameExistResult ? true : false;
        } catch (error) {
            console.log(error);
            return false;
        }
    },
    checkItemNameExist: async (itemName) => {
        const checkItemNameExistQuery = 'SELECT "itemName" FROM "CategoryItems" WHERE "itemName" = $1';
        const checkItemNameExistValues = [itemName];
        try {
            const checkItemNameExistResult = await db.oneOrNone(checkItemNameExistQuery, checkItemNameExistValues);
            return checkItemNameExistResult ? true : false;
        } catch (error) {
            console.log(error);
            return false;
        }
    },
    checkItemIDExist: async (itemID) => {
        const checkItemIDExistQuery = 'SELECT "itemID" FROM "CategoryItems" WHERE "itemID" = $1';
        const checkItemIDExistValues = [itemID];
        try {
            const checkItemIDExistResult = await db.oneOrNone(checkItemIDExistQuery, checkItemIDExistValues);
            return checkItemIDExistResult ? true : false;
        } catch (error) {
            console.log(error);
            return false;
        }
    },
    checkIDExist: async (id) => {
        const checkIDExistQuery = 'SELECT "itemID" FROM "CategoryItems" WHERE "itemID" = $1';
        const checkIDExistValues = [id];
        try {
            const checkIDExistResult = await db.oneOrNone(checkIDExistQuery, checkIDExistValues);
            return checkIDExistResult ? true : false;
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
    getCatItemByID: async (id) => {
        try {
            const res = await db.query(
                `
                SELECT *
                FROM "CategoryItems" c JOIN "Categories" ca ON ca."catID" = c."catID"
                WHERE c."itemID" = $1
            `,
                [id],
            );
            return res;
        } catch (error) {
            console.log(error);
            throw error;
        }
    },
    getCatId: async (catID) => {
        try {
            const res = await db.query(
                `
                SELECT *
                FROM "Categories" ca 
                WHERE "catID" = $1
            `,
                [catID],
            );
            return res;
        } catch (error) {
            console.log(error);
            throw error;
        }
    },
    getCatByID: async (id) => {
        try {
            const res = await db.query(
                `
                SELECT *
                FROM "CategoryItems" c JOIN "Products" p ON c."itemID" = p."item"
                JOIN "Categories" ca ON ca."catID" = c."catID"
                WHERE p."id" = $1
            `,
                [id],
            );
            return res;
        } catch (error) {
            console.log(error);
            throw error;
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
    getCatPage: async (page, perPage) => {
        const getCatPageQuery = 'SELECT * FROM "Categories" ORDER BY "catID" ASC LIMIT $1 OFFSET $2';
        const getCatPageValues = [perPage, (page - 1) * perPage];
        const getCats = 'SELECT * FROM "Categories" ORDER BY "catID" ASC';
        try {
            const getCatPageResult = await db.any(getCatPageQuery, getCatPageValues);
            const maxPage = Math.ceil((await db.one('SELECT COUNT(*) FROM "Categories"')).count / perPage);
            const getCatsRt = await db.any(getCats);
            return { cats: getCatPageResult, maxPage, catsList: getCatsRt };
        } catch (error) {
            console.log(error);
            return null;
        }
    },
    getProPage: async (page, perPage) => {
        
        const getProPageQuery = 'SELECT * FROM "Products" ORDER BY "name" ASC LIMIT $1 OFFSET $2';
        const getProPageValues = [perPage, (page - 1) * perPage];
        const getPros = 'SELECT * FROM "CategoryItems" ORDER BY "itemName" ASC';
        try {
            const getProPageResult = await db.any(getProPageQuery, getProPageValues);
            const maxPage = Math.ceil((await db.one('SELECT COUNT(*) FROM "Products"')).count / perPage);
            const getProsRt = await db.any(getPros);
            return { pros: getProPageResult, maxPage, proList: getProsRt };
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
    initDatabase: async function initDatabase() {
        try {
            // Kiểm tra xem database đã tồn tại chưa
            const databaseExists = await db.oneOrNone(
                'SELECT 1 FROM pg_database WHERE datname = $1',
                process.env.DB_NAME
            );

            if (!databaseExists) {
                // Tạo mới database
                await db.none(`CREATE DATABASE ${process.env.DB_NAME}`);
                console.log(`Database ${process.env.DB_NAME} created.`);

                // Kết nối đến database mới tạo
                db.$pool.options.database = process.env.DB_NAME;
                await db.connect();

                // create table inside the new database
                await db.none(`
                /*
                Target Server Type    : PostgreSQL
                Target Server Version : 90600
                File Encoding         : 65001
               */

                -- ---------CREATE TABLE HOADON
                DROP TABLE IF EXISTS "HoaDon";
                CREATE TABLE "HoaDon" (
                "MaHoaDon" serial NOT NULL PRIMARY KEY,
                    "username" text,
                    "NgayLap" timestamp,
                    "ThanhTien" int4,
                    "TrangThai" int4
                )
                ;
                INSERT INTO "HoaDon" ("username", "NgayLap", "ThanhTien", "TrangThai") VALUES
                ('12', '01/12/2023', 5300000, 0),
                ('12', '01/25/2023', 6000000, 0),
                ('usernam1', '02/03/2023', 1500000, 0),                
                ('user1', '02/08/2023', 260000, 0),
                ('usernam1', '03/01/2023',10000000 ,0 ),
                ('user1', '03/12/2023', 200000, 1),          
                ('usernam1', '04/07/2023',380000 ,1 ),
                ('user1', '04/14/2023', 750000, 0),
                ('user1', '05/05/2023', 2250000, 0),
                ('un1', '06/02/2023',950000 , 0),
                ('un1', '06/15/2023', 650000, 0),
                ('user1', '07/09/2023', 7000000,1),
                ('un1', '07/26/2023',460000 , 1),
                ('user1', '08/07/2023', 8500000, 0),
                ('user1', '08/17/2023', 350000, 1),
                ('un1', '09/03/2023',4500000 , 1),
                ('un1', '09/12/2023', 5000000, 0),
                ('usernam1', '10/06/2023',6000000 ,0 ),
                ('un2', '10/11/2023',420000 , 0),
                ('username2', '11/02/2023', 7000000,0),
                ('user1', '11/15/2023', 9000000, 0),
                ('username2', '12/05/2023',10000000 ,0),
                ('user1', '12/18/2023', 7000000, 0),                               
                ('usernam1', '12/29/2023',6000000 ,0 );
                
                
                
                ---------CREATE TABLE ThongTinHoaDon
                DROP TABLE IF EXISTS "ThongTinHoaDon";
                CREATE TABLE "ThongTinHoaDon" (
                "MaHoaDon" int4 NOT NULL,
                    "MaThongTinHD" serial PRIMARY KEY,
                    "MaSP" text,
                    "SoLuong" int4
                )
                ;


               -- ----------------------------
               -- Table structure for Categories
               -- ----------------------------
               DROP TABLE IF EXISTS "Categories";
               CREATE TABLE "Categories" (
                 "catID" serial NOT NULL,
                 "catName" varchar(50) NOT NULL
               )
               ;
               
               -- ----------------------------
               -- Records of Categories
               -- ----------------------------
               BEGIN;
               INSERT INTO "Categories" VALUES (1, 'Thời Trang Nam');
               INSERT INTO "Categories" VALUES (2, 'Thời Trang Nữ');
               INSERT INTO "Categories" VALUES (3, 'Giày Dép Nam');
               INSERT INTO "Categories" VALUES (4, 'Giày Dép Nữ');
               INSERT INTO "Categories" VALUES (5, 'Balo/Túi Nam');
               INSERT INTO "Categories" VALUES (6, 'Túi Ví Nữ');
               INSERT INTO "Categories" VALUES (7, 'Đồng hồ nam/nữ');
               COMMIT;
               

               DROP TABLE IF EXISTS "CategoryItems";
               CREATE TABLE "CategoryItems" (
                 "itemID" text NOT NULL,
                 "itemName" varchar(50) NOT NULL,
                 "catID" int4 NOT NULL
               )
               ;
               
               -- ----------------------------
               -- Records of Categories
               -- ----------------------------
               BEGIN;
               INSERT INTO "CategoryItems" VALUES ('ATH', 'Áo Thun Nam', 1);
               INSERT INTO "CategoryItems" VALUES ('AKH', 'Áo Khoác Nam', 1);
               INSERT INTO "CategoryItems" VALUES ('QTA', 'Quần Tây Nam', 1);
               INSERT INTO "CategoryItems" VALUES ('ASM', 'Áo Sơ Mi Nam', 1);
               INSERT INTO "CategoryItems" VALUES ('QJE', 'Quần Jeans Nam', 1);
               INSERT INTO "CategoryItems" VALUES ('CVA', 'Cà Vạt Nam', 1);
               INSERT INTO "CategoryItems" VALUES ('QSH', 'Quần Short Nam', 1);

               INSERT INTO "CategoryItems" VALUES ('ATN', 'Áo Thun Nữ', 2);
               INSERT INTO "CategoryItems" VALUES ('AKN', 'Áo Khoác Nữ', 2);
               INSERT INTO "CategoryItems" VALUES ('ASN', 'Áo Sơ Mi Nữ', 2);
               INSERT INTO "CategoryItems" VALUES ('DLN', 'Đầm/Váy', 2);
               INSERT INTO "CategoryItems" VALUES ('QJN', 'Quần Jeans Nữ', 2);
               INSERT INTO "CategoryItems" VALUES ('QSN', 'Quần Short Nữ', 2);

               INSERT INTO "CategoryItems" VALUES ('GTT', 'Giày Thể thao Nam',3);
               INSERT INTO "CategoryItems" VALUES ('GSN', 'Giày Sục Nam',3);
               INSERT INTO "CategoryItems" VALUES ('GTL', 'Giày Tây',3);
               INSERT INTO "CategoryItems" VALUES ('DSN', 'Sandals Nam',3);
               INSERT INTO "CategoryItems" VALUES ('DNM', 'Dép Nam',3);

               INSERT INTO "CategoryItems" VALUES ('GTN', 'Giày Thể thao Nữ',4);
               INSERT INTO "CategoryItems" VALUES ('GDB', 'Giày Đế bằng',4);
               INSERT INTO "CategoryItems" VALUES ('GCG', 'Giày Cao Gót',4);
               INSERT INTO "CategoryItems" VALUES ('SDN', 'Sandals Nữ',4);
               INSERT INTO "CategoryItems" VALUES ('DNN', 'Dép Nữ',4);

               INSERT INTO "CategoryItems" VALUES ('BLN', 'Balo Nam',5);
               INSERT INTO "CategoryItems" VALUES ('TTN', 'Túi Tote Nam',5);
               INSERT INTO "CategoryItems" VALUES ('TDC', 'Túi Đeo Chéo Nam',5);
               INSERT INTO "CategoryItems" VALUES ('BVM', 'Bóp/Ví Nam',5);

               INSERT INTO "CategoryItems" VALUES ('BAN', 'Balo nữ',6);
               INSERT INTO "CategoryItems" VALUES ('VDT', 'Ví Dự tiệc & Ví cằm tay',6);
               INSERT INTO "CategoryItems" VALUES ('TQX', 'Túi Quai Xách',6);
               INSERT INTO "CategoryItems" VALUES ('TDH', 'Túi Đeo Hông',6);
               INSERT INTO "CategoryItems" VALUES ('PKT', 'Phụ kiện túi',6);

               INSERT INTO "CategoryItems" VALUES ('DHA', 'Đồng Hồ Nam',7);
               INSERT INTO "CategoryItems" VALUES ('DNU', 'Đồng Hồ Nữ',7);
               COMMIT;
        
               -- ----------------------------
               -- Table structure for Products
               -- ----------------------------
               DROP TABLE IF EXISTS "Products";
               CREATE TABLE "Products" (
                 "id" text NOT NULL,
                 "name" varchar(150) NOT NULL,
                 "tinyDes" varchar(150),
                 "fullDes" text,
                 "price" integer NOT NULL,
                 "item" text ,
                 "count" integer NOT NULL,
                 "producer" text,
                 "discount" double precision,
                 "images" text
                )
               ;
               
               -- ----------------------------
               -- Records of Products
               -- ----------------------------
               BEGIN;
            
               INSERT INTO "Products" VALUES ('ATH01','Áo Thun Cổ Rộng','Style đơn giản, thanh lịch, luôn là lựa chọn hàng đầu với số đông mọi người!',
               'Áo Thun Nam hay còn có tên gọi khác là Áo Phông Nam hoặc Áo T Shirt Nam là một trong những item cơ bản không còn xa lạ đối với phong cách thời trang thường ngày của các bạn trẻ hiện nay.               
               Chất vải được dùng trong các thiết kế áo thun essentials bao gồm:               
               Cotton: là chất vải dệt từ sợi bông tự nhiên với tính năng ưu việt thoáng mát, thấm mồ hôi tốt, đây cũng là loại vải phù hợp để sử dụng cho những sản phẩm thể thao nam.
               Cotton pha: là loại vải pha với poly giúp giảm nhăn và tăng độ bền cho sản phẩm.
               Linen: là loại vải 100% dệt từ sợi lanh tự nhiên nên cực kỳ thoáng mát và thấm hút tốt.
               Viscose: là loại vải được chế từ bột giấy hoặc sợi bông với ưu điểm nhẹ và rất thoáng mát.
               Polyester: là sợi vải nhân tạo có khả năng chống nhăn và giữ form tốt.',65000,'ATH', 20,'Coolmate',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/33.jpg?alt=media&token=0a196490-22b5-46c8-aa4e-ce6423a97e61');
               
			   INSERT INTO "Products" VALUES ('ATH02','Áo Thun Len','Áo len nam được sản xuất từ những sợi len chất lượng hàng đầu, đa dạng các mẫu',' 🔰 Chi tiết ÁO LEN CỔ TRÒN
               - Chất liệu: len đan sợi. mềm mịn, không bai xù, không phai màu, không bai dão
               Chính vì được may bằng chất liệu cao cấp nên khi khách hàng sử dụng sẽ không bị ngứa cổ, gây cảm giác khó chịu khi dựng cao cổ áo vào những ngày lạnh.
               - Áo len cổ tròn chắc chắn là item không thể thiếu cho các chàng trai khi mùa đông sắp đến vì tính tiện dụng và khả năng giữ ấm vượt trội. Chỉ cần mặc một chiếc áo len cổ cao bên trong, khoác áo phao siêu nhẹ hoặc áo phao lông vũ bên ngoài là đã đủ để đi qua mùa đông giá buốt này rồi.
               ⏩  Cách chọn size: Shop có bảng size mẫu. Bạn NÊN INBOX, cung cấp chiều cao, cân nặng để SHOP TƯ VẤN SIZE.
               ⏩  Bảng size mẫu
                thông số chọn size cơ bản, tùy thuộc và vào mỗi người mà có thể +/- 1 Size               
               🔰 Hướng dẫn sử dụng sản phẩm
               -Khéo léo kết hợp trang phục cùng phụ kiện, bạn dễ dàng mang lại một set đồ hài hòa, thể hiện được cá tính riêng của bạn
               🔸  Mẹo Nhỏ Giúp Bạn Bảo Quản Quần áo nam : 
               -  Đối với sản phẩm quần áo mới mua về, nên giặt tay lần đâu tiên để tránh phai màu sang quần áo khác
               -  Khi giặt nên lộn mặt trái ra để đảm bảo độ bền 
               -  Sản phẩm phù hợp cho giặt máy/giặt tay
                - Không giặt chung đồ Trắng và đồ Tối màu ',90000,'ATH', 10,'T&T',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/34.jpg?alt=media&token=95d86f7f-b1ec-44dc-aaab-b0266d3d3b82');

               INSERT INTO "Products" VALUES ('ATH03','Áo Polo'
               ,'Áo polo nam đa dạng phong cách, kiểu dáng trẻ trung'
               ,'⭐Bảng size bên shop các bạn tham khảo ạ:
               Size S: Dành cho khách dưới 45 kg    
               Size M: Dành cho khách dưới 50 kg               
               Size L:  Dành cho khách dưới 60 kg               
               Size XL : Dành cho khách dưới 70 cân               
               Size 2XL: Dành cho khách dưới 80 kg                                         
               Bảng size chỉ mang tính chất tham khảo vì còn tùy thuộc vào cơ địa của mỗi bạn ạ               
               👉 Bảng size mang tính chất tham khảo bạn có thể lấy size to hơn hoặc nhỏ theo yêu cầu của bạn!              
               III. MÔ TẢ SẢN PHẨM               
               ⭐ Tên sản phẩm : Áo Polo thun unisex               
               ⭐ Chất Liệu: chất Cotton               
               ⭐ Màu Sắc:   ĐEN, Xanh               
               ⭐ Đặc Tính:  Chất vải áo là chất cotton mặc thoáng mát thấm hút mồ hôi'
               ,85000,'ATH', 65,'Routine',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/35.jpg?alt=media&token=7d722dcb-d48d-4351-ae02-f9ed68d4172e');
               
               INSERT INTO "Products" VALUES ('ATH04','Áo Thun Hoạ Tiết Siêu Nhân'
               ,'Áo thun nam cổ tròn họa tiết siêu nhân giá cực tốt'
               ,'Mô tả
               Chất liệu: Cotton co giãn 4 chiều (95% cotton, 5% spandex) không bai, không xù.
               Áo tay ngắn, cổ tròn, họa tiết cá tính
               Hướng dẫn sử dụng
               Giặt tay trong lần giặt đầu tiên, mẹ nên ngâm và giặt riêng, không giặt chung đồ tối và sáng màu. Sau đó giặt bằng nước lạnh không có xà phòng để hình in mềm hơn, khó bong tróc hơn. Nên giặt sản phẩm bằng nước lạnh hoặc nước ấm dưới 40 độ C. Giặt bằng nước quá nóng có thể làm giãn vải và làm lỏng sản phẩm.
               Bảo quản: Sản phẩm có tính hút ẩm và thấm nước cao. Nên bảo quản áo thun nơi khô ráo.'
               ,78000,'ATH', 30,'Yame',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/36.jpg?alt=media&token=7ce8fea5-f791-4ee0-8329-f90e59920bcb');
               
               INSERT INTO "Products" VALUES ('ATH05','Áo Thun Tay Lỡ'
               ,'Áo thun tay lỡ form rộng, áo phông form rộng'
               ,'Form áo: Các mẫu sản phẩm của shop được thiết kế theo size: siza 4XS ( <5 kg) Size M ( 40kg - 51kg ), Size L ( 52kg - 57kg ), Size XL ( 58kg - 68kg ) mặc đẹp như hình bạn nhé
               CHẤT LIỆU : Chất thun Tici mịn mát, không co rút, dày vừa ko bí, PHÙ HỢP GIÁ TIỀN.
               Màu sắc có thể đậm hoặc nhạt 1-5% do hiệu ứng ánh sáng (có thể do bóng râm, đèn sáng hoặc tối, độ phân giải của máy)           
               - Giặt mặt trái, nhẹ tay, giặt xong phơi ngay, không ngâm áo trong nước quá lâu.               
               - Áo trắng - áo màu nên chia ra giặt riêng, không giặt chung.            
               - Nếu giặt máy thì hình in có thể sẽ tróc theo thời gian'
               ,70000,'ATH', 10,'SLY',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/37.jpg?alt=media&token=586490b6-2c8a-4844-a15b-c28625f12f50');
               
               INSERT INTO "Products" VALUES ('ATH06','Áo Thun Care & Share'
               ,'Áo thun nam Cotton Compact đẹp, thấm hút tốt'
               ,''
               ,109000,'ATH', 11,'Coolmate',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/38.jpg?alt=media&token=bee836ec-5cdc-40a2-b040-45bdd7f8cc22');
               
               INSERT INTO "Products" VALUES ('ATH07','Áo Thun ADTStore'
               ,''
               ,''
               ,50000,'ATH', 5,'ADTStore',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/39.jpg?alt=media&token=5e5f2e7b-3109-4741-bd78-80c9f0742d3a');
               
               INSERT INTO "Products" VALUES ('ATH08','Áo Thun KPOP In Hình Nhóm Nhạc BLACKPINK'
               ,''
               ,''
               ,150000,'ATH', 5,'Coolmate',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/40.jpg?alt=media&token=6b804db6-caa9-44cf-9873-f4da80eeaa64');
               
               INSERT INTO "Products" VALUES ('ATH09','Áo Thun Trơn'
               ,''
               ,''
               ,45000,'ATH', 10,'Yame',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/41.jpg?alt=media&token=8dc49c36-4bed-4fad-89aa-1bfd2a7ae52f');

               INSERT INTO "Products" VALUES ('AKH01','Áo Khoác Jean'
               ,'Áo polo nam đa dạng phong cách, kiểu dáng trẻ trung'
               ,'⭐Bảng size bên shop các bạn tham khảo ạ:
               Size M: Dành cho khách dưới 50 kg               
               Size L:  Dành cho khách dưới 60 kg               
               Size XL : Dành cho khách dưới 70 cân               
               Size 2XL: Dành cho khách dưới 80 kg                                         
               Bảng size chỉ mang tính chất tham khảo vì còn tùy thuộc vào cơ địa của mỗi bạn ạ               
               👉 Bảng size mang tính chất tham khảo bạn có thể lấy size to hơn hoặc nhỏ theo yêu cầu của bạn!              
               III. MÔ TẢ SẢN PHẨM               
               ⭐ Tên sản phẩm : Áo Polo thun unisex               
               ⭐ Chất Liệu: chất Cotton               
               ⭐ Màu Sắc:   ĐEN, Xanh               
               ⭐ Đặc Tính:  Chất vải áo là chất cotton mặc thoáng mát thấm hút mồ hôi'
               ,145000,'AKH',5,'Tommy Hilfiger',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/06.webp?alt=media&token=b79c1f82-6075-42be-8788-504a3718541d');
               
               INSERT INTO "Products" VALUES ('AKH02','Áo Khoác Nỉ'
               ,''
               ,''
               ,20500,'AKH',12,'Ralph Lauren',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/07.jpg?alt=media&token=ac046549-5bab-4c0d-9bef-7d4f7a733057');
               
               INSERT INTO "Products" VALUES ('AKH03','Áo Khoác Bomber'
               ,''
               ,''
               ,153000,'AKH',14,'GRIMM DC',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/08.jpg?alt=media&token=0d46bfa6-cf8b-4b67-a385-a201fe234e85');
               
               INSERT INTO "Products" VALUES ('AKH04','Áo Khoác Phao Da Trơn Có Mũ','','',192500,'AKH',9,'Now SaiGon',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/09.jpg?alt=media&token=0c42caf9-2a05-40e2-a377-d0a117e5863f');
               
               INSERT INTO "Products" VALUES ('AKH05','Áo Khoác Sọc Caro','','',99500,'AKH',23,'Hades',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/10.jpg?alt=media&token=23e1d110-b57d-49ae-8928-6b17420e1b52');
               
               INSERT INTO "Products" VALUES ('AKH06','Áo Khoác In Hình Sơn Tùng MTP','','',156500,'AKH',5,'Yame',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/11.jpg?alt=media&token=33e279a5-2de3-4ae9-a5a4-0fa04a93aa1d');
               
               INSERT INTO "Products" VALUES ('AKH07','Áo Khoác Trung Niên Dày','','',215000,'AKH',13,'Yame',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/12.jpg?alt=media&token=5fc0dd19-b063-4e7d-afec-abe2b4136dc9');
               
               INSERT INTO "Products" VALUES ('AKH08','Áo Khoác Style Hàn Quốc','','',137500,'AKH',9,'Coolmate',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/13.jpg?alt=media&token=22f0c7a6-33ff-42ff-8c8a-681d8bcbdfaf');

               
               INSERT INTO "Products" VALUES ('QTA01','Quần Tây Dáng Baggy','','',250000,'QTA',4,'5S Fashion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QTA01.jpg?alt=media&token=a7b8de80-e445-4633-ab45-92eb6c5db372');
               
               INSERT INTO "Products" VALUES ('QTA02','Quần Tây Vải Thun Lạnh','','',205000,'QTA',22,'Yame',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QTA02.jpg?alt=media&token=8354f28d-5a9f-48b9-9fc2-4977c4a99e1e');
               
               INSERT INTO "Products" VALUES ('QTA03','Quần Tây Âu Sọc Trắng','','',197000,'QTA',15,'SLY',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QTA03.jpg?alt=media&token=15f59593-a9fa-431f-85e6-4a1c077b5935');
               
               INSERT INTO "Products" VALUES ('QTA04','Quần Tây Cap Chun','','',180000,'QTA',7,'5S Fashion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QTA04.webp?alt=media&token=eb644868-b42c-40ef-b6ab-0ce0a402abbe');
               
               INSERT INTO "Products" VALUES ('QTA05','Quần Tây Ôm Body','','',230000,'QTA',36,'Routine',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QTA05.jpg?alt=media&token=26de424b-f7a8-4240-ba29-2a7964d572fb');
               
               INSERT INTO "Products" VALUES ('QTA06','Quần Tây Âu Bam Tab Quần Siêu Co Giãn','','',190000,'QTA',56,'Rountine',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QTA06.jpg?alt=media&token=c66eb49d-8cf4-4869-b7b1-81c7c1475065');

               INSERT INTO "Products" VALUES ('ASM01','Áo Sơ Mi Trắng','','',100000,'ASM',8,'TEELAB',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/14.jpg?alt=media&token=c031cff7-c018-446e-846c-743778d50591');
               
               INSERT INTO "Products" VALUES ('ASM02','Áo Sơ Mi In Hoạ Tiết Phượng Hoàng','','',115000,'ASM',15,'TEELAB',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/15.jpg?alt=media&token=0a92934b-ce61-4217-ac3c-8f9517ba22a6');
               
               INSERT INTO "Products" VALUES ('ASM03','Áo Sơ Mi Vân Vuông Viền Cổ','','',185000,'ASM',45,'TEELAB',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/17.jpg?alt=media&token=cc2e7426-55e0-4d8c-8100-0816a0c6481d');
               
               INSERT INTO "Products" VALUES ('ASM04','Áo Sơ Mi Tay Dài','','',175000,'ASM',25,'YODY',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/18.jpg?alt=media&token=9f775bfc-48b8-4bb8-aed2-30a95947eaa5');
               
               INSERT INTO "Products" VALUES ('ASM05','Áo Sơ Mi Tay Ngắn','','',150000,'ASM',7,'YODY',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/19.jpg?alt=media&token=76710aae-8aeb-4028-9566-943183a38086');
               
               INSERT INTO "Products" VALUES ('ASM06','Áo Sơ Mi Sọc Caro','','',135000,'ASM',18,'Coolmate',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/20.jpg?alt=media&token=81fbea7d-ed5a-4ee2-ae89-0aad16503464');

               INSERT INTO "Products" VALUES ('QJE01','Quần Jeans Ống Suông','','',300000,'QJE',24,'Aristino',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QJE01.jpg?alt=media&token=c4fd68bb-9971-4080-8b69-0367eaf13118');
               
               INSERT INTO "Products" VALUES ('QJE02','Quần Jeans Ống Đứng Phong Cách Hàn Quốc','','',285000,'QJE',12,'Yame',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QJE02.jpg?alt=media&token=bf206b8f-dc92-4901-8d81-f3e12a66d5c8');
               
               INSERT INTO "Products" VALUES ('QJE03','Quần Jeans Ôm','','',235000,'QJE',12,'Aristino ',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QJE03.webp?alt=media&token=bf04ebeb-56ed-4b32-9e41-3f92f8178d51');
               
               INSERT INTO "Products" VALUES ('QJE04','Quần Jeans Form Rộng','','',178000,'QJE',24,'5S Fashion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QJE04.jpg?alt=media&token=7e9e4214-51c7-46b8-b1ba-dac5c3271b29');
               
               INSERT INTO "Products" VALUES ('QJE05','Quần Jeans Rách Gối Hiphop','','',234000,'QJE',10,'Aristino ',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QJE05.jpg?alt=media&token=c34794af-fb7a-4616-8e42-daf4a3137201');
               
               INSERT INTO "Products" VALUES ('QJE06','Quần Jeans Baggy','','',150000,'QJE',31,'Coolmate',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QJE06.jpg?alt=media&token=7b8a1280-a95b-4788-9c1c-175f06ec7353');

               INSERT INTO "Products" VALUES ('CVA01','Cà Vạt Cao Cấp, Chấm Bi','','',80000,'CVA',25,'Shibumi',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/58.jpg?alt=media&token=cd54346d-6413-4707-adce-4e1a5fd64606');
               
               INSERT INTO "Products" VALUES ('CVA02','Cà Vạt Caro Dáng Ôm Thời Trang','','',99000,'CVA',31,'Shibumi',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/CVA02.jpg?alt=media&token=feab930f-d9bc-4e91-9ac2-b15e6e903387');
               
               INSERT INTO "Products" VALUES ('CVA03','Cà Vạt Trung Tiên Cao Cấp','','',115000,'CVA',25,'Marinella',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/CVA03.jpg?alt=media&token=ac1b9f66-48ff-45f5-b9ce-4bebaf0b279f');
               
               INSERT INTO "Products" VALUES ('CVA04','Cà Vạt Phong Cách Hàn Quốc','','',98000,'CVA',36,'Marinella',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/CVA04.jpg?alt=media&token=156dc521-9b78-4dd7-ada8-142d4b07444a');
               
               INSERT INTO "Products" VALUES ('CVA05','Combo 3 Cà Vạt','','',250000,'CVA',38,'Marinella',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/CVA05.webp?alt=media&token=059bccd5-d933-4b32-b7b9-20c0ffe80055');


               INSERT INTO "Products" VALUES ('QSH01','Quần Short Tắm Biển Nam Thời Trang Phong Cách','','',150000,'QSH',31,'5S Fashion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QSH01.jpg?alt=media&token=017e5cb9-f5e7-4f30-9c21-3c40f29bd16d');
               
               INSERT INTO "Products" VALUES ('QSH02','Quần Short Baggy Trẻ Trung Năng Động','','',125000,'QSH',34,'Coolmate',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QSH02.jpg?alt=media&token=0c71ee97-20e6-4251-a9fc-d358a65f6f94');
               
               INSERT INTO "Products" VALUES ('QSH03','Quần Thun Đá Banh','','',100000,'QSH',31,'5S Fashion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QSH03.jpg?alt=media&token=5f452afe-2516-4dbf-a81f-2dd851da54cb');
               
               INSERT INTO "Products" VALUES ('QSH04', 'Quần Short Nam Dáng Âu','','',175000,'QSH',24,'Routine',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QSH04.jpg?alt=media&token=792dc9e2-def8-4f29-aea0-20b77b8235a7');
               
               INSERT INTO "Products" VALUES ('QSH05', 'Quần Short Nam Mát Mẻ Cho Mùa Hè','','',85000,'QSH',40,'Routine',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QSH05.webp?alt=media&token=457dbc55-069b-44fd-bd14-ee79166b9663');

               
               INSERT INTO "Products" VALUES ('ATN01','Áo Thun Cổ Tròn Cá Tính','','',150000,'ATN',35,'Demi',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/26.jpg?alt=media&token=52fd34f8-0792-4a54-9533-759b7ec5d1cb');
               
               INSERT INTO "Products" VALUES ('ATN02','Áo Thun Nữ Tay Ngắn Cotton Tinh Khiết','','',115000,'ATN',55,'5S Fashion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/27.jpg?alt=media&token=5d42191f-d103-4807-98de-83d197020dc5');
               
               INSERT INTO "Products" VALUES ('ATN03','Áo Gigle Logo Phoxe','','',185000,'ATN',34,'5S Fashion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/28.jpg?alt=media&token=803228c5-52b8-41bb-853e-790695b08302');
               
               INSERT INTO "Products" VALUES ('ATN04','Áo Thun Dài Tay Cổ Chữ V','','',198000,'ATN',29,'5S Fashion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/29.jpg?alt=media&token=950b1202-dfb8-4ea9-ac76-7c197e8d5b07');
               
               INSERT INTO "Products" VALUES ('ATN05','Áo Thun Tay Lỡ Màu Trơn In Hình BTS','','',85000,'ATN',34,'Demi',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/30.jpg?alt=media&token=03607585-5ec4-4cfa-b7fa-8df8067a3f06');
               
               INSERT INTO "Products" VALUES ('ATN06', 'Áo Thun Ngắn Tay Sọc Caro Phong Cách','','',95000,'ATN',15,'Demi',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/32.jpg?alt=media&token=eea706ed-3654-471b-9300-0a9d10264d7a');
               
               INSERT INTO "Products" VALUES ('ATN07','Áo Thun Cotton Polo Nhí Nhảnh','','',175000,'ATN',8,'Coolmate',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/31.jpg?alt=media&token=4570f126-da5e-41ca-a2f8-d4e7c810d9c7');


               INSERT INTO "Products" VALUES ('AKN01','Áo Khoác Nỉ Thể Thao','','',195000,'AKN',25,'Adidas',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/01.webp?alt=media&token=a916509b-ef13-44d0-8079-c40983d56b5b');
               
               INSERT INTO "Products" VALUES ('AKN02','Áo Khoác Dù Nữ Kiểu 2 Lớp Form Rộng','','',215000,'AKN',38,'Yame',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/02.webp?alt=media&token=d9380a66-14d9-46b6-b39b-6d77591f7679');
               
               INSERT INTO "Products" VALUES ('AKN03','Áo Khoác Gió Nữ 2 Lớp Chống Nước, Có Mũ','','',225000,'AKN',30,'Yame',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/03.webp?alt=media&token=bb63630c-960b-4ba3-85a5-b0323bbba520');
               
               INSERT INTO "Products" VALUES ('AKN04','Áo Khoác Có Nón, Vải Thun Giữ Ấm','','',300000,'AKN',34,'Coolmate',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/04.webp?alt=media&token=e8e4d8cb-0de8-409a-984d-140b74bc9202');
               
               INSERT INTO "Products" VALUES ('AKN05','Áo Khoác Jeans Cá Tính','','',275000,'AKN',14,'Routine',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/05.webp?alt=media&token=74946a73-4d41-43a2-84f9-cbe913ab8318');

               INSERT INTO "Products" VALUES ('ASN01','Áo Sơ Mi Công Sở Dài Tay','','',275000,'ASN',14,'Routine',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/20.jpg?alt=media&token=81fbea7d-ed5a-4ee2-ae89-0aad16503464');
               
               INSERT INTO "Products" VALUES ('ASN02','Áo Sơ Mi Nữ Form Rộng Kiểu Hàn','','',275000,'ASN',11,'Routine',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/21.jpg?alt=media&token=15010354-947d-4253-ba1e-3300617533ac');
               
               INSERT INTO "Products" VALUES ('ASN03','Áo Sơ Mi Trắng','','',275000,'ASN',11,'Routine',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/22.jpg?alt=media&token=eecb1dbf-fd9b-4378-9fac-e85f4928f553');
               
               INSERT INTO "Products" VALUES ('ASN04','Áo Sơ Mi Nữ Kẻ Sọc','','',275000,'ASN',11,'Routine',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/23.jpg?alt=media&token=24f9db43-5c3f-4f09-aa3c-e4556c6b371f');
               
               INSERT INTO "Products" VALUES ('ASN05','Áo Sơ Mi Nhung Quốc Dân','','',275000,'ASN',12,'Routine',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/24.jpg?alt=media&token=2ff52261-e6b5-4575-bfa2-9b42e0597d17');
               
               INSERT INTO "Products" VALUES ('ASN06','Áo Sơ Mi Tay Ngắn','','',275000,'ASN',14,'Routine',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/25.jpg?alt=media&token=e5d273aa-7f61-4396-86e6-2e3b5cad7aab');

               INSERT INTO "Products" VALUES ('DLN01','Đầm Voan Cao Cấp, 3 Tầng Thời Trang','','',255000,'DLN',14,'Fleur Studio',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DLN01.jpg?alt=media&token=c33d79d2-e4ec-4f5f-b945-2e0e9bcd1b3a');
               
               INSERT INTO "Products" VALUES ('DLN02','Đầm Chữ A Tay Ngắn Cổ Tròn','','',285000,'DLN',25,'Fleur Studio',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DLN02.webp?alt=media&token=9d5fe036-643b-4b51-a7af-51c7e3bc29c9');
               
               INSERT INTO "Products" VALUES ('DLN03','Đầm Váy Trắng Cổ V','','',180000,'DLN',12,'Fleur Studio',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DLN03.jpg?alt=media&token=8533b16e-f3c4-4247-bb28-00c6ebccb1a7');
               
               INSERT INTO "Products" VALUES ('DLN04','Váy Công Chúa Gấm Xốp Phối Voan','','',300000,'DLN',25,'Fleur Studio',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DLN04.jpg?alt=media&token=2021c4dd-7daf-46d3-b781-f585cea2c830');
               
               INSERT INTO "Products" VALUES ('DLN05','Đầm Nữ Thời Trang','','',260000,'DLN',17,'Dottie',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DLN05.jpg?alt=media&token=756bec0f-8a41-4b62-8035-a703a38750d4');
               
               INSERT INTO "Products" VALUES ('DLN06','Váy Suông Sơ Mi Túi Hộp','','',275000,'DLN',28,'Dottie',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DLN06.jpg?alt=media&token=7e959a7c-1beb-46dc-b31a-9d3f17bcddbb');

               INSERT INTO "Products" VALUES ('QJN01','Quần Jeans Ống Rộng Nữ','','',295000,'QJN',12,'Fleur Studio',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QJN01.jpg?alt=media&token=4695e5f2-0d8e-449e-a3d8-eaf95c496ea8');
               
               INSERT INTO "Products" VALUES ('QJN02','Quần Jeans Baggy 2 Túi Trước','','',270000,'QJN',24,'Dottie',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QJN02.jpg?alt=media&token=34a68a61-d5a7-4046-b8e4-a36ec32e6970');
               
               INSERT INTO "Products" VALUES ('QJN03','Quần Jeans Nữ Ống Đứng Hơi Ôm','','',180000,'QJN',30,'Fleur Studio',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QJN03.jpg?alt=media&token=5b9d68e0-1f52-451f-b47e-358ca5f8bc04');
               
               INSERT INTO "Products" VALUES ('QJN04','Quần Jeans Nữ Thời Trang Cá Tính','','',199000,'QJN',19,'Dottie',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QJN04.jpg?alt=media&token=d7df1b18-7f2a-432f-988b-a302a7e4f6c1');
               
               INSERT INTO "Products" VALUES ('QJN05','Quần Jeans Nữ Baggy Ống Suông','','',189000,'QJN',9,'Fleur Studio',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QJN05.jpg?alt=media&token=c1d763c5-8cda-4f65-bd73-2e96ed912ac5');

               INSERT INTO "Products" VALUES ('QSN01','Quần Đùi Nữ Chất Kaki','','',167000,'QSN',7,'Dottie',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QSN01.jpg?alt=media&token=f50f187d-f3a3-4e6d-8723-ab01ccef5328');
               
               INSERT INTO "Products" VALUES ('QSN02','Quần Short Nữ Cạp Chun','','',243000,'QSN',31,'Fleur Studio',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QSN02.jpg?alt=media&token=6e59cb03-1b16-42c6-89e4-15ee5815bb94');
               
               INSERT INTO "Products" VALUES ('QSN03','Quần Short Đùi Đan Dây Hai Bên','','',210000,'QSN',4,'Fleur Studio',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QSN03.jpg?alt=media&token=8704ed64-a9be-41d4-910d-92a7ff6489ec');
               
               INSERT INTO "Products" VALUES ('QSN04','Quần Short Jeans','','',285000,'QSN',38,'Dottie',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QSN04.jpg?alt=media&token=48faaeb2-e5e2-43e5-8f9f-f69fe290f669');
               
               INSERT INTO "Products" VALUES ('QSN05','Quần Short Nữ Ống Rộng','','',185000,'QSN',33,'Routine',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QSN05.jpg?alt=media&token=562fb91e-8f48-4f2c-a4dc-cfe5aadbcdf4');

               INSERT INTO "Products" VALUES ('GTT01','Giày Thể Thao Nam Bitis','','',1250000,'GTT',19,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTT01.webp?alt=media&token=23b34057-a6eb-4f05-97e6-0245dcbde750');
               
               INSERT INTO "Products" VALUES ('GTT02','Giày Thể Thao Chạy Bộ Nam Adidas','','',980000,'GTT',25,'Adidas',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTT02.jpg?alt=media&token=756ff0c6-795b-4111-ab50-feb7c4aca325');
               
               INSERT INTO "Products" VALUES ('GTT03','Giày Thể Thao Thông Dụng Nam Bitis','','',1750000,'GTT',24,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTT03.webp?alt=media&token=1817d44c-0a83-49ec-bbcf-3e582081da5b');
               
               INSERT INTO "Products" VALUES ('GTT04','Giày Chạy Bộ Nam','','',1150000,'GTT',16,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTT04.jpg?alt=media&token=3ab4cf5b-b5a1-4441-a22b-9080916ae99b');
               
               INSERT INTO "Products" VALUES ('GTT05','Giày Đi Bộ Thể Dục Cho Nam','','',1850000,'GTT',15,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTT05.jpg?alt=media&token=e593c622-0134-4a12-a313-79995c021352');
               
               INSERT INTO "Products" VALUES ('GTT06','Giày Leo Núi Dã Ngoại Chống Thấm Nước','','',1600000,'GTT',26,'Adidas',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTT06.jpg?alt=media&token=5ee653dd-5a47-433e-843d-0ce19e6e52de');

               INSERT INTO "Products" VALUES ('GSN01','Giày Sục Nam','','',1100000,'GSN',19,'Thế Giới Đồ Da',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GSN01.jpg?alt=media&token=fc0eaaae-f931-470b-b76d-210ef1ae6ae8');
               
               INSERT INTO "Products" VALUES ('GSN02','Giày Sục Nam Da Thật Quai Chữ H','','',1450000,'GSN',24,'Thế Giới Đồ Da',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GSN02.jpg?alt=media&token=9ef328ae-13a4-43f6-847d-fa9a8fd5b41c');
               
               INSERT INTO "Products" VALUES ('GSN03','Giày Mules Nam Mũi Tròn Hở Gót Thời Trang','','',1950000,'GSN',30,'Thế Giới Đồ Da',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GSN03.webp?alt=media&token=93717899-aeb5-4bab-919d-2d4968b2056c');
               
               INSERT INTO "Products" VALUES ('GSN04','Giày Mule Thời Trang Playball Monogram','','',1350000,'GSN',31,'Thế Giới Đồ Da',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GSN04.webp?alt=media&token=b14c983c-01b4-4f9f-a725-fb5125b25f20');
               
               INSERT INTO "Products" VALUES ('GSN05','Giày Sục Nam Da Bò Chính Hãng','','',1250000,'GSN',22,'Thế Giới Đồ Da',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GSN05.jpg?alt=media&token=b8b5c174-2059-40dd-a1a8-9579c13a09db');


               INSERT INTO "Products" VALUES ('GTL01','Giày Tây Nam Zuciani Derby Thắt Dây Da Dập Vân','','',980000,'GTL',18,'Đông Hải',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTL01.webp?alt=media&token=bab992ba-0953-449a-95a7-c2e99dfd4bbf');
               
               INSERT INTO "Products" VALUES ('GTL02','Giày Tây MCKAY Đế Phối Da','','',1750000,'GTL',16,'Đông Hải',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTL02.webp?alt=media&token=11b20323-cdab-4fc5-84f0-4f2321d2c5a2');
               
               INSERT INTO "Products" VALUES ('GTL03','Giày Tây Nam Zuciani Hoạ Tiến Đục Lỗ Thắt Dây Da Dập Vuông','','',1150000,'GTL',26,'Đông Hải',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTL03.jpg?alt=media&token=175aed36-8d03-4a84-8cf0-b776b3e9373f');
               
               INSERT INTO "Products" VALUES ('GTL04','Giày Tây Nam Bitis','','',1850000,'GTL',14,'Đông Hải',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTL04.jpg?alt=media&token=4202e4e9-613c-48e5-80e9-009aa2e4fda7');
               
               INSERT INTO "Products" VALUES ('GTL05','Giày Tây Boot Nam Bitis','','',1700000,'GTL',22,'Đông Hải',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTL05.webp?alt=media&token=9bbf278d-a699-407f-b610-3eb51e69a89f');

               INSERT INTO "Products" VALUES ('DSN01','Sandal Thể Thao Eva Phun Nam Bitis Hunter','','',1550000,'DSN',19,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DSN01.jpg?alt=media&token=5288e62a-d650-448f-9a72-e9ca6f89753e');
               
               INSERT INTO "Products" VALUES ('DSN02','Sandal Nam Bitis Hunter Tonic','','',1200000,'DSN',16,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DSN02.webp?alt=media&token=1cea3059-4fab-4227-8740-5d122ae832e9');
               
               INSERT INTO "Products" VALUES ('DSN03','Sandal Nam Hunter X Blazin Neon Collection','','',1650000,'DSN',24,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DSN03.jpg?alt=media&token=ad784b8e-8636-4c85-8f75-57926d13eafd');
               
               INSERT INTO "Products" VALUES ('DSN04','Sandal Si Cao Su Nam Bitis','','',1900000,'DSN',30,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DSN04.jpg?alt=media&token=09061883-c8b1-4743-b406-4290c3135e78');
               
               INSERT INTO "Products" VALUES ('DSN05','Sandal Quai Ngang Thời Trang Kiểu Dáng Streetwear Mang Đi Học','','',1400000,'DSN',31,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DSN05.jpg?alt=media&token=2667bb32-cc6b-4457-a82a-d4806cb492b4');


               INSERT INTO "Products" VALUES ('DNM01','Dép Da Nam Bitis','','',1120000,'DNM',14,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DNM01.webp?alt=media&token=2e6184c4-47cd-4681-b4ac-0ce33b8b343e');
               
               INSERT INTO "Products" VALUES ('DNM02','Dép Thông Dụng Si Đế TPR Nam Bitis','','',1800000,'DNM',19,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DNM02.jpg?alt=media&token=02ab69f7-409f-4d6e-871e-b89c92dfd1bf');
               
               INSERT INTO "Products" VALUES ('DNM03','DÉP NAM ĐÔNG HẢI QUAI NGANG CÁCH ĐIỆU ĐAN CHÉO','','',950000,'DNM',16,'Đông Hải',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DNM03.jpg?alt=media&token=a5ecf483-655d-4e6c-bb50-16a2831810a3');
               
               INSERT INTO "Products" VALUES ('DNM04','DÉP NAM ĐÔNG HẢI QUAI NGANG CUT-OUT CÁCH ĐIỆU','','',1700000,'DNM',22,'Đông Hải',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DNM04.webp?alt=media&token=d78163f5-daa4-42b0-9965-7c334e978a58');
               
               INSERT INTO "Products" VALUES ('DNM05','DÉP QUAI NGANG ĐÔNG HẢI CHẦN CHỈ THỜI TRANG','','',1300000,'DNM',30,'Đông Hải',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DNM05.jpg?alt=media&token=d35e3edb-7067-4afc-80ec-30e936973407');

               INSERT INTO "Products" VALUES ('GTN01','Giày Thể Thao Nữ Gosto','','',1250000,'GTN',18,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTN01.webp?alt=media&token=a770e58e-abe4-46b0-8035-57732c118631');
               
               INSERT INTO "Products" VALUES ('GTN02','Giày Thông Dụng Nữ Bitis','','',980000,'GTN',16,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTN02.webp?alt=media&token=4a99470f-f582-46a4-825a-68dcfe9f50c4');
               
               INSERT INTO "Products" VALUES ('GTN03','Giày Thể Thao Nữ Bitis Êmbrace','','',1150000,'GTN',24,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTN03.jpg?alt=media&token=c7b8a7e6-8a4a-4e22-9ed1-73680a8a85f5');
               
               INSERT INTO "Products" VALUES ('GTN04','Giày Thể Thao Kháng Khuẩn','','',1450000,'GTN',14,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTN04.jpg?alt=media&token=c2101520-efa1-45c4-bf2c-ae8419a2fc5d');
               
               INSERT INTO "Products" VALUES ('GTN05','Giày Thể Thao Êm Chân Siêu Nhẹ','','',950000,'GTN',22,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTN05.jpg?alt=media&token=166b87a9-816c-43ef-8ecc-6c9a6ba91b38');

               INSERT INTO "Products" VALUES ('GDB01','Giày Đế Bằng Thời Trang Nữ Hiệu Exull','','',1350000,'GDB',26,'Exull Mode',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GDB01.jpg?alt=media&token=6c53b9e4-ab26-468a-97ca-cd78ee71240c');
               
               INSERT INTO "Products" VALUES ('GDB02','Giày Sling Back Đế Vuông Nữ Exull','','',1120000,'GDB',19,'Exull Mode',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GDB02.webp?alt=media&token=95979887-d2d1-4ff5-99d6-fec5974b9f39');
               
               INSERT INTO "Products" VALUES ('GDB03','Giày Loafer Đế Bằng Thời Trang','','',1200000,'GDB',16,'Exull Mode',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GDB03.webp?alt=media&token=5aa2eb9f-ec04-4bce-8cca-4bc6403f58ea');
               
               INSERT INTO "Products" VALUES ('GDB04','Giày Búp Bê Mũi Nhọn','','',1250000,'GDB',30,'Exull Mode',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GDB04.jpg?alt=media&token=72898bcb-4ee9-4241-899b-ca3c805dc469');
               
               INSERT INTO "Products" VALUES ('GDB05','Giày Sục Đế Bằng Exull','','',980000,'GDB',22,'Exull Mode',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GDB05.webp?alt=media&token=193d92c9-0f35-48d9-9ac6-ebd57ff521db');

               INSERT INTO "Products" VALUES ('GCG01','Giày Bít Mũi Nhọn Stiletto Heel','','',1150000,'GCG',15,'Vascara',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GCG01.jpeg?alt=media&token=eb511583-0f46-4f7c-9243-54971986a12a');
               
               INSERT INTO "Products" VALUES ('GCG02','Giày Cao Gót Gót Trụ Phối Khoá','','',1450000,'GCG',28,'Juno',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GCG02.webp?alt=media&token=5a3ec229-19ff-454c-ac77-7c3ad1cc885c');
               
               INSERT INTO "Products" VALUES ('GCG03','Giày Cao Gót Khoá Trang Trí Kim Loại','','',1400000,'GCG',21,'Juno',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GCG03.jpg?alt=media&token=648ee059-4d4d-48a6-9162-104aaa6e94de');
               
               INSERT INTO "Products" VALUES ('GCG04','Giày Cao Gót Pump Mũi Nhọn Gót Thanh','','',1050000,'GCG',22,'Juno',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GCG04.jpg?alt=media&token=db5cf1ba-19da-463e-9cec-0a96fe29e412');
               
               INSERT INTO "Products" VALUES ('GCG05','Giày Cao Gót Bít Mũi Gót Thanh','','',1550000,'GCG',15,'Juno',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GCG05.webp?alt=media&token=4133c433-7d57-410d-8839-736afe59653e');

               INSERT INTO "Products" VALUES ('SDN01','Sandal Thời Trang Nữ Bitis','','',1280000,'SDN',13,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/SDN01.webp?alt=media&token=836701fe-7611-4fce-82b6-5635e422a7f1');
               
               INSERT INTO "Products" VALUES ('SDN02','Giày Sandal Mũi Vuông Gót Si Hiệu Ứng Aluminium','','',930000,'SDN',19,'Vascara',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/SDN02.jpg?alt=media&token=a8236a29-672d-4135-b2b0-9f505ea78a38');
               
               INSERT INTO "Products" VALUES ('SDN03','Sandal Strappy Quai Phồng','','',1320000,'SDN',19,'Vascara',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/SDN03.jpg?alt=media&token=822721ec-2c2c-4b7b-b8e6-9c7b94ce7a76');
               
               INSERT INTO "Products" VALUES ('SDN04','Sandal Si Cao Su Nữ Bitis','','',1180000,'SDN',16,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/SDN04.webp?alt=media&token=87866d55-0d05-481d-a25d-6c9ef0ecec77');
               
               INSERT INTO "Products" VALUES ('SDN05','Giày Sandal Đế Chunky Phối Vân Da Kỳ Đà','','',1500000,'SDN',24,'Balo Mini Nhấn Túi Phụ Vân Da Kỳ Đ',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/SDN05.jpg?alt=media&token=a23559b8-72c7-4ab9-9954-83f1d31b5c91');

               INSERT INTO "Products" VALUES ('DNN01','DÉP XUỒNG ZUCIA ĐẾ GIẢ GỖ QUAI THỜI TRANG','','',1420000,'DNN',30,'Đông Hải',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DNN01.jpg?alt=media&token=9567a5f9-274d-447b-91db-4834f3da789b');
               
               INSERT INTO "Products" VALUES ('DNN02','DÉP NỮ ZUCIA QUAI CÁCH ĐIỆU CUT-OUT','','',990000,'DNN',22,'Đông Hải',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DNN02.jpg?alt=media&token=fa8693fc-119b-45b8-b815-82ff94fa818c');
               
               INSERT INTO "Products" VALUES ('DNN03','DÉP NỮ ZUCIA DA MỀM HỌA TIẾT ĐAN CHÉO','','',1030000,'DNN',82,'Đông Hải',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DNN03.jpg?alt=media&token=af04ea40-b416-4238-a4b3-bf5174db82bf');
               
               INSERT INTO "Products" VALUES ('DNN04','DÉP NỮ ZUCIA KHÓA TRÒN GIẢ GỖ THỜI TRANG','','',1100000,'DNN',16,'Đông Hải',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DNN04.jpg?alt=media&token=576086f1-1744-4771-a210-04019786c9a2');
               
               INSERT INTO "Products" VALUES ('DNN05','DÉP XUỒNG NỮ QUAI DÂY BẢNG NGANG','','',1210000,'DNN',30,'Đông Hải',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DNN05.jpg?alt=media&token=312fbac3-9064-4166-a215-21f84f5368f8');

               INSERT INTO "Products" VALUES ('BLN01','Túi Đeo Chéo Style Mạnh Mẽ, Phong Cách Cực Chất BANGE GEKMAN','','',1210000,'BLN',30,'Big Bag',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/47.jpg?alt=media&token=f9058be4-7793-4c0a-baba-a6a34a312f2b');
               
               INSERT INTO "Products" VALUES ('BLN02','Balo Du Lịch Cao Cấp, Sức Chứa Khủng Hơn Vali','','',1210000,'BLN',30,'Big Bag',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/48.jpg?alt=media&token=2a13fba0-fcb9-4059-9bd2-99bb921a753f');
               
               INSERT INTO "Products" VALUES ('BLN03','Balo Đa Năng Cao Cấp, Thiết Kế Siêu Thông Minh','','',1210000,'BLN',51,'Big Bag',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/49.jpg?alt=media&token=f3dfab45-b38d-46de-bc41-dadb9d0e0eeb');
               
               INSERT INTO "Products" VALUES ('BLN04','Balo Đa Năng Cao Cấp ROKIN MASTER','','',1210000,'BLN',50,'Big Bag',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/50.jpg?alt=media&token=f0a6271f-e6fd-469e-bd10-58846057b5b2');
               
               INSERT INTO "Products" VALUES ('BLN05','Balo Laptop Cao Cấp, Style Cực Chất Sành Điệu BANGE GRANDE','','',1210000,'BLN',32,'Big Bag',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/51.jpg?alt=media&token=c526064e-2eb1-493f-a88b-7f22cbbd9c1b');
               
               INSERT INTO "Products" VALUES ('BLN06','Balo Chống Trộm, Thiết Kế Đẳng Cấp MARK RYDEN DELTA','','',1210000,'BLN',42,'Big Bag',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/52.jpg?alt=media&token=4e8c6960-1b0a-424e-988a-22144f1ff1f2');            

               INSERT INTO "Products" VALUES ('TTN01','Túi Georges Tote MM','','',1210000,'TTN',27,'Louis Vuitton',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/TTN01.png?alt=media&token=98fbfe24-810e-4490-b7e3-7272fd2ac417');
               
               INSERT INTO "Products" VALUES ('TTN02','Túi Shopper Bag MM','','',1210000,'TTN',29,'Louis Vuitton',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/TTN02.jpg?alt=media&token=432a414c-5eb6-4acf-8a8e-d09afe3292c7');
               
               INSERT INTO "Products" VALUES ('TTN03','PEDRO - Túi Tote Nam Form Vuông Thời Trang','','',1210000,'TTN',24,'Masion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/TTN03.jpg?alt=media&token=787c2984-f207-4b6f-8725-312961043a7b');
               
               INSERT INTO "Products" VALUES ('TTN04','MLB - Túi Tote Unisex Chữ Nhật Canvas Vertical','','',1210000,'TTN',28,'Masion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/TTN04.jpg?alt=media&token=f0486418-45ca-4c8c-81b0-72cab73c27ed');
               
               INSERT INTO "Products" VALUES ('TTN05','Túi Tote Nam Form Chữ Nhật Recycled Leather','','',1210000,'TTN',20,'Masion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/TTN05.jpg?alt=media&token=164f2c7f-f87a-4eb8-96f6-007609b6b42d');

               INSERT INTO "Products" VALUES ('TDC01','Túi Đeo Chéo Ngang MIKKOR THE FELIX','','',1210000,'TDC',35,'Big Bag',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/TDC01.webp?alt=media&token=28c56408-7144-406d-9065-2dd462e3ab7c');
               
               INSERT INTO "Products" VALUES ('TDC02','Túi Đeo Chéo Thiết Kế Tối Giản MARK RYDEN SECRET','','',1210000,'TDC',31,'Big Bag',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/TDC02.webp?alt=media&token=48c285f8-af13-4846-b635-3fc8c10ea6c7');
               
               INSERT INTO "Products" VALUES ('TDC03','Túi Đeo Chéo Mini, Thiết kế Siêu Gọn & Nhẹ MARK RYDEN AIR','','',1210000,'TDC',52,'Big Bag',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/TDC03.webp?alt=media&token=23ee5d6d-1433-48be-870a-61893323eab8');
               
               INSERT INTO "Products" VALUES ('TDC04','Túi Đeo Chéo Tối Giản, Thiết Kế Nhỏ Gọn','','',1210000,'TDC',56,'Big Bag',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/TDC04.webp?alt=media&token=a89542fd-a876-4701-8375-0fd13f34a503');
               
               INSERT INTO "Products" VALUES ('TDC05','Túi Đeo Chéo Đơn Giản, Nhỏ Gọn','','',1210000,'TDC',24,'Big Bag',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/TDC05.webp?alt=media&token=f7c87a32-6c5c-47d1-9e7c-46b498c8af78');

               INSERT INTO "Products" VALUES ('BVM01','Ví Mini Leo De Gol','','',1210000,'BVM',44,'Leonardo',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/53.jpg?alt=media&token=8ba83b02-915b-4605-9238-244e99c229a1');
               
               INSERT INTO "Products" VALUES ('BVM02','Ví Card Monogram Carlos','','',1210000,'BVM',40,'Leonardo',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/54.jpg?alt=media&token=88f131b5-8ea2-4230-958a-06a137831fcd');
               
               INSERT INTO "Products" VALUES ('BVM03','Ví Card Livermore','','',1210000,'BVM',43,'Leonardo',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/55.jpg?alt=media&token=a6113041-b0e8-431b-9ffd-3f1c88170491');
               
               INSERT INTO "Products" VALUES ('BVM04','Ví Cầm Tay Nam Da Cá Sấu','','',1210000,'BVM',34,'Gento',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/56.jpg?alt=media&token=1e0069ed-ce4a-4294-9fb7-db34e50bf894');
               
               INSERT INTO "Products" VALUES ('BVM05','Ví Cầm Tay Nam Da Cá Sấu Cao Cấp Gento ','','',1210000,'BVM',32,'Gento',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/57.jpg?alt=media&token=0e17ceab-617e-4960-847d-59b87f76c903');

               INSERT INTO "Products" VALUES ('BAN01','Balo Mini Nhấn Túi Phụ Vân Da Kỳ Đà','','',1210000,'BAN',22,'Vascara',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/42.jpg?alt=media&token=71946121-da23-4423-b750-e2a4eeef728a');
               
               INSERT INTO "Products" VALUES ('BAN02','Balo Mini Nhấn Khóa Túi Hộp','','',1210000,'BAN',33,'Vascara',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/43.jpg?alt=media&token=63ffc3c1-5fb7-4498-b3e5-a6cfc6bb5a00');
               
               INSERT INTO "Products" VALUES ('BAN03','Ba Lô Nữ TJW Essential Backpack','','',1210000,'BAN',44,'ACFC',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/44.jpg?alt=media&token=7a7af0ec-5384-4987-bd54-779f891186b7');
               
               INSERT INTO "Products" VALUES ('BAN04','Balo Nữ IM Latam Corp Backpack','','',1210000,'BAN',55,'ACFC',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/45.jpg?alt=media&token=1e9ff3f4-9019-4168-a61f-6d8da83d689e');
               
               INSERT INTO "Products" VALUES ('BAN05','Ba Lô Nữ Ryan Travel','','',1210000,'BAN',11,'ACFC',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/46.jpg?alt=media&token=1148f1fb-60f5-4e31-bd12-21bf2d948290');

               INSERT INTO "Products" VALUES ('VDT01','Ví Cầm Tay Top-Zip Nhiều Ngăn','','',1210000,'VDT',56,'Vascara',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/VDT01.jpeg?alt=media&token=a63590ac-7ee9-48f9-9675-a112d3387fff');
               
               INSERT INTO "Products" VALUES ('VDT02','Ví Cầm Tay May Chần Bông Hình Thoi','','',1210000,'VDT',45,'Vascara',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/VDT02.jpeg?alt=media&token=369c6205-ac22-4479-9b43-f40674ef1bab');
               
               INSERT INTO "Products" VALUES ('VDT03','Ví Mini Dập Nổi Square Pattern ','','',1210000,'VDT',34,'Vascara',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/VDT03.jpeg?alt=media&token=6862d093-8a13-4dca-a090-471c0df2433a');
               
               INSERT INTO "Products" VALUES ('VDT04','Ví Cầm Tay Zip-Around Dập Vân Cá Sấu','','',1210000,'VDT',23,'Vascara',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/VDT04.jpeg?alt=media&token=ec4b1790-8470-4c7f-bcd9-7e911e3c1434');

               INSERT INTO "Products" VALUES ('PKT01','Móc Khóa Nữ Hình Thú Bông Phối Lông Vũ','','',1210000,'PKT',12,'Masion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/PKT01.jpg?alt=media&token=c534cb8a-d6ef-41e6-86f4-d197a76dfbb3');
               
               INSERT INTO "Products" VALUES ('PKT02','Móc Khóa Nữ Hình Thú Bông Lông Xù Cute','','',1210000,'PKT',21,'Masion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/PKT02.webp?alt=media&token=601f573a-60f5-4c2b-873b-513b902790a9');
               
               INSERT INTO "Products" VALUES ('PKT03','Dây Đeo Túi Xách Bản Rộng','','',1210000,'PKT',32,'Masion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/PKT03.webp?alt=media&token=62503f9e-4721-4fb4-a2d2-0e9446097a54');
               
               INSERT INTO "Products" VALUES ('PKT04','Móc Khóa Nữ Hình Thú Bông','','',1210000,'PKT',54,'Masion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/PKT04.webp?alt=media&token=24323730-709b-4a07-a36b-14712242c301');
               
               INSERT INTO "Products" VALUES ('PKT05','Dây Đeo Túi Xách Vải Bản Vừa','','',1210000,'PKT',34,'Masion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/PKT05.jpg?alt=media&token=8a198242-b5ff-4968-895a-eed9a97933b5');

               INSERT INTO "Products" VALUES ('DHA01','Longines - Nam','','',1210000,'DHA',51,'Longines',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DHA01.jpg?alt=media&token=7527e9e8-521d-4ece-984b-87e9b5596547');
               
               INSERT INTO "Products" VALUES ('DHA02','Olym Pianus - Nam','','',1210000,'DHA',27,'Olym Pianus',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DHA02.webp?alt=media&token=3533620e-e40d-4837-806d-d076c5bc1d99');
               
               INSERT INTO "Products" VALUES ('DHA03','Casio - Nam','','',1210000,'DHA',26,'Casio',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DHA03.jpg?alt=media&token=0dfa4897-9ac3-4381-954c-cb260d4deaac');
               
               INSERT INTO "Products" VALUES ('DHA04','Tissot - Nam','','',1210000,'DHA',22,'Tissot',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DHA04.jpg?alt=media&token=57d74da0-c39d-4833-8a92-230af10a0d18');
               
               INSERT INTO "Products" VALUES ('DHA05','Bonest Gatti - Nam','','',1210000,'DHA',20,'Bonest Gatti',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DHA05.webp?alt=media&token=c95c3f12-4261-4ab3-845d-a24dc85ee96e');

               INSERT INTO "Products" VALUES ('DNU01','SRWatch - Nữ','','',1210000,'DNU',37,'SRWatch',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DNU01.jpg?alt=media&token=859b566c-6ba9-47fb-b769-db32432c7ba2');
               
               INSERT INTO "Products" VALUES ('DNU02','Casio - Nữ','','',1210000,'DNU',38,'Casio',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DNU02.jpg?alt=media&token=b4818520-a938-4540-b012-35ae0f5d7861');
               
               INSERT INTO "Products" VALUES ('DNU03','Tissot - Nữ','','',1210000,'DNU',39,'Tissot',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DNU03.png?alt=media&token=427e9332-0230-4564-851d-7e5707de0e7e');
               
               INSERT INTO "Products" VALUES ('DNU04','Seiko - Nữ','','',1210000,'DNU',40,'Seiko',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DNU04.jpg?alt=media&token=dbca24f0-2d79-4482-917a-a81b321cc08a');
               
               INSERT INTO "Products" VALUES ('DNU05','Orient - Nữ','','',1210000,'DNU',5,'Orient',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DNU05.jpg?alt=media&token=f033cd65-6903-48db-9afe-7c1616640565');

               COMMIT;
                              
               -- ----------------------------
               -- Table structure for Users
               -- ----------------------------
               DROP TABLE IF EXISTS "Users";
               CREATE TABLE "Users" (
                "Username" text NOT NULL,
                "Password" text NOT NULL,
                "isAdmin" boolean NOT NULL,
                "Email" text
               )
               ;
           
                INSERT INTO "Users" ("Username", "Password", "isAdmin", "Email") VALUES
                ('12', '$2b$10$7u5D8nN.a.ffUYmnjkrs9uiSnkKHCQK3t5M/KD1hhyaLRnMbgdFXe', false, '123@ok'),
                ('usernam1', '$2b$10$7u5D8nN.a.ffUYmnjkrs9uiSnkKHCQK3t5M/KD1hhyaLRnMbgdFXe', false, 'example@gmail.com'),
                ('user1', '$2b$10$7u5D8nN.a.ffUYmnjkrs9uiSnkKHCQK3t5M/KD1hhyaLRnMbgdFXe', false, 'example1@gmail.com'),
                ('un1', '$2b$10$7u5D8nN.a.ffUYmnjkrs9uiSnkKHCQK3t5M/KD1hhyaLRnMbgdFXe', false, 'example2@gmail.com'),
                ('un2', '$2b$10$7u5D8nN.a.ffUYmnjkrs9uiSnkKHCQK3t5M/KD1hhyaLRnMbgdFXe', false, 'markjohn@gmail.com'),
                ('username2', '$2b$10$7u5D8nN.a.ffUYmnjkrs9uiSnkKHCQK3t5M/KD1hhyaLRnMbgdFXe', false, 'davidle@gmail.com'),
                ('Admin', '$2b$10$7u5D8nN.a.ffUYmnjkrs9uiSnkKHCQK3t5M/KD1hhyaLRnMbgdFXe', true, NULL),
                ('Admin1', '$2b$10$7u5D8nN.a.ffUYmnjkrs9uiSnkKHCQK3t5M/KD1hhyaLRnMbgdFXe', true, NULL),
                ('Admin2', '$2b$10$7u5D8nN.a.ffUYmnjkrs9uiSnkKHCQK3t5M/KD1hhyaLRnMbgdFXe', true, NULL),
                ('Admin3', '$2b$10$7u5D8nN.a.ffUYmnjkrs9uiSnkKHCQK3t5M/KD1hhyaLRnMbgdFXe', true, NULL);

                -- ----------------------------
                -- Table structure for GoogleAccount
                -- ----------------------------
                DROP TABLE IF EXISTS "GoogleAccount";
                CREATE TABLE "GoogleAccount" (
                    "Name" text NOT NULL,
                    "Email" text PRIMARY KEY,
                    "Avatar" text
                );
               -- ----------------------------
               -- Primary Key structure for table Categories
               -- ----------------------------
               ALTER TABLE "Categories" ADD CONSTRAINT "PK__Categori" PRIMARY KEY ("catID") WITH (fillfactor=80);
               ALTER TABLE "CategoryItems" ADD CONSTRAINT "PK__CategoryItems" PRIMARY KEY ("itemID") WITH (fillfactor=80);

               -- ----------------------------
               -- Primary Key structure for table Products
               -- ----------------------------
               ALTER TABLE "Products" ADD CONSTRAINT "PK__Products" PRIMARY KEY ("id") WITH (fillfactor=80);
               
               -- ----------------------------
               -- Primary Key structure for table Users
               -- ----------------------------
               ALTER TABLE "Users" ADD CONSTRAINT "PK__Users" PRIMARY KEY ("Username") WITH (fillfactor=80);
               
               -- ----------------------------
               -- Foreign Keys structure for table OrderDetails
               -- ----------------------------
               
               
               -- ----------------------------
               -- Foreign Keys structure for table Products
               -- ----------------------------
               ALTER TABLE "Products" ADD CONSTRAINT "FK_Cat" FOREIGN KEY ("item") REFERENCES "CategoryItems" ("itemID") ON DELETE CASCADE;
               
               ALTER TABLE "CategoryItems" ADD CONSTRAINT "FK_CatItem" FOREIGN KEY ("catID") REFERENCES "Categories" ("catID") ON DELETE CASCADE;

                `);

                console.log(`Tables created inside '${process.env.DB_NAME}' database.`);
                console.log(`Data imported into '${process.env.DB_NAME}' database.`);
            }
            else {
                db.$pool.options.database = process.env.DB_NAME;
                await db.connect();
                console.log(`Database '${process.env.DB_NAME}' already exists. Cannot create database.`);
            }
        }
        catch (error) {
            console.log(error);
        }
    },
    //db: db,
}