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

                
                ---------CREATE TABLE ThongTinHoaDon
                DROP TABLE IF EXISTS "ThongTinHoaDon";
                CREATE TABLE "ThongTinHoaDon" (
                
                "MaThongTinHD" serial PRIMARY KEY,     
                "MaHoaDon" int4 NOT NULL,             
                    "MaSP" text,
                    "SoLuong" int4
                )
                ;

                INSERT INTO "HoaDon" ("username", "NgayLap", "ThanhTien", "TrangThai") VALUES
                ('username1', '02/01/2024', 3250000,0),
                ('user1', '02/02/2024', 1100000,1),
                ('12', '02/03/2024', 2420000,1),
                ('un1', '02/04/2024', 3630000,0),
                ('12', '02/05/2024', 2750000,0),
                ('un2', '03/01/2024', 2780000,0),
                ('un1', '03/02/2024', 1950000,0),
                ('un2', '03/03/2024', 3100000,0),
                ('user1', '03/04/2024', 2500000,0),
                ('12', '03/05/2024', 4100000,0),
                ('user1', '04/01/2024', 3400000,0),
                ('username1', '04/02/2024', 4100000,0),
                ('12', '04/03/2024', 2900000,0),
                ('un1', '04/04/2024', 3600000,0),
                ('user1', '04/05/2024', 2800000,1),
                ('user1', '05/01/2024', 4200000,0),
                ('un1', '05/02/2024', 3100000,0),
                ('12', '05/03/2024', 3800000,1),
                ('un2', '05/04/2024', 2900000,1),
                ('username1', '05/05/2024', 3500000,0),
                ('un1', '06/01/2024', 4100000,0),
                ('un2', '06/02/2024', 3200000,0),
                ('un2', '06/03/2024', 3900000,0),
                ('12', '06/04/2024', 3000000,0),
                ('username2', '06/05/2024', 3600000,0),
                ('12', '07/01/2024', 3100000,0),
                ('un2', '07/02/2024', 4200000,0),
                ('12', '07/03/2024', 3300000,0),
                ('user1', '07/04/2024', 3800000,0),
                ('user1', '07/05/2024', 2900000,0),
                ('un2', '08/01/2024', 4500000,0),
                ('username2', '08/02/2024', 2800000,0),
                ('username2', '08/03/2024', 4100000,1),
                ('un2', '08/04/2024', 3300000,0),
                ('username2', '08/05/2024', 3700000,0),
                ('username1', '09/01/2024', 4900000,0),
                ('12', '09/02/2024', 3100000,0),
                ('username1', '09/03/2024', 4200000,1),
                ('un2', '09/04/2024', 3400000,0),
                ('un2', '09/05/2024', 3900000,0),
                ('un1', '10/01/2024', 4800000,0),
                ('un1', '10/02/2024', 3200000,0),
                ('user1', '10/03/2024', 4100000,0),
                ('12', '10/04/2024', 3300000,0),
                ('username1', '10/05/2024', 4000000,1),
                ('un1', '11/01/2024', 2800000,0),
                ('username1', '11/02/2024', 4100000,0),
                ('12', '11/03/2024', 3500000,0),
                ('username2', '11/04/2024', 2900000,1),
                ('user1', '11/05/2024', 3800000,1),
                ('user1', '12/01/2024', 3200000,0),
                ('12', '12/02/2024', 2800000,0),
                ('username1', '12/03/2024', 4100000,1),
                ('un1', '12/04/2024', 3500000,0),
                ('un1', '12/05/2024', 2900000,0);
                
                INSERT INTO "ThongTinHoaDon" ("MaHoaDon", "MaSP", "SoLuong") VALUES
                (1, 'SDN02', 1),
                (1, 'DNN03', 2),
                (2, 'BLN04', 1),
                (3, 'VDT01', 3),
                (4, 'BAN02', 1),
                (5, 'DHA04', 2),
                (5, 'DNU02', 1),
                (6, 'DNN04', 2),
                (6, 'BLN03', 1),
                (7, 'VDT02', 1),
                (8, 'PKT01', 3),
                (9, 'TDC01', 2),
                (10, 'BVM03', 1),
                (10, 'DHA05', 1),
                (11, 'DNN01', 2),
                (11, 'SDN02', 1),
                (12, 'BVM05', 1),
                (13, 'BLN01', 3),
                (14, 'TDC03', 2),
                (15, 'DNU03', 1),
                (15, 'PKT04', 1),
                (16, 'DNN03', 2),
                (16, 'SDN04', 1),
                (17, 'BVM02', 1),
                (18, 'BLN02', 2),
                (19, 'TDC04', 1),
                (20, 'DNU04', 1),
                (20, 'PKT05', 1),
                (21, 'DNN04', 2),
                (21, 'SDN05', 1),
                (22, 'BVM03', 1),
                (23, 'BLN03', 2),
                (24, 'TDC05', 1),
                (25, 'DNU05', 1),
                (25, 'PKT01', 1),
                (26, 'DNU03', 1),
                (26, 'TDC02', 2),
                (27,'BVM02', 1),
                (28,'VDT03', 1),
                (29, 'BAN03', 2),
                (30,'PKT04', 1),
                (30,'DHA05', 1),
                (31, 'DNU02', 1),
                (32, 'VDT01', 2),
                (32, 'PKT05', 1),
                (33, 'BAN04', 1),
                (34, 'VDT04', 2),
                (35, 'BVM05', 1),
                (35,'PKT01', 1),
                (36, 'DNU03', 1),
                (36, 'VDT02', 2),
                (37, 'PKT04', 1),
                (38, 'BAN03', 1),
                (38,'VDT03', 2),
                (39, 'BVM04', 1),
                (40, 'PKT02', 1),
                (41, 'DNU05', 1),
                (42, 'VDT01', 2),
                (42,'PKT01', 1),
                (43,'BAN04', 1),
                (44,'VDT04', 2),
                (45,'BVM05', 1),
                (45,'PKT03', 1),
                (46,'TDC02', 1),
                (47,'BVM03', 2),
                (18,'DNU03', 1),
                (49, 'VDT03', 1),
                (50, 'PKT05', 2),
                (50, 'BLN02', 1),
                (51,'DHA03', 1),
                (52,'BVM04', 2),
                (53,'TDC01', 1),
                (54,'BLN03', 1),
                (55,'VDT04', 2),
                (55, 'PKT01', 1);
                

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
               ,'MÔ TẢ SẢN PHẨM               
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
               ,'Áo Thun Care & Share là một thương hiệu thời trang nổi tiếng với sứ mệnh và triết lý kinh doanh độc đáo. Với sự kết hợp tinh tế giữa phong cách hiện đại và tinh tế, Áo Thun Care & Share không chỉ là một nhãn hiệu mà còn là biểu tượng của sự chia sẻ và quan tâm đến cộng đồng.

               Sản phẩm của Áo Thun Care & Share không chỉ đẹp mắt mà còn mang thông điệp sâu sắc về tình yêu thương và sự chăm sóc. Mỗi chiếc áo thun không chỉ là một món đồ mặc mà còn là một cách để thể hiện tinh thần đồng điệu và sự quan tâm đến môi trường.
               
               Với mỗi sản phẩm bán ra, Áo Thun Care & Share cam kết một phần lợi nhuận sẽ được đóng góp vào các hoạt động từ thiện và những dự án xã hội có ý nghĩa. Điều này không chỉ giúp nâng cao nhận thức về vấn đề xã hội mà còn thúc đẩy tinh thần cộng đồng và trách nhiệm xã hội trong mỗi cá nhân.
               
               Với phong cách độc đáo và ý nghĩa sâu sắc, Áo Thun Care & Share không chỉ là một lựa chọn thời trang mà còn là biểu tượng của sự chia sẻ và tình nguyện, từng đường kim mũi chỉ đều kể lại câu chuyện đằng sau sự quan tâm và sẻ chia với cộng đồng. '
               ,109000,'ATH', 11,'Coolmate',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/38.jpg?alt=media&token=bee836ec-5cdc-40a2-b040-45bdd7f8cc22');
               
               INSERT INTO "Products" VALUES ('ATH07','Áo Thun ADTStore'
               ,''
               ,'Áo Thun ADTStore là điểm đến lý tưởng cho những người yêu thích phong cách năng động và cá tính. Với sự đa dạng về mẫu mã và chất liệu, ADTStore mang đến cho bạn những bộ sưu tập áo thun độc đáo và phong phú. Sản phẩm của ADTStore không chỉ là sự kết hợp hoàn hảo giữa thẩm mỹ và thoải mái mà còn thể hiện phong cách riêng biệt và sự tự tin của người mặc.'
               ,50000,'ATH', 5,'ADTStore',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/39.jpg?alt=media&token=5e5f2e7b-3109-4741-bd78-80c9f0742d3a');
               
               INSERT INTO "Products" VALUES ('ATH08','Áo Thun KPOP In Hình Nhóm Nhạc BLACKPINK'
               ,''
               ,'Áo Thun KPOP in hình nhóm nhạc BLACKPINK là biểu tượng của sự ưa chuộng và đam mê với âm nhạc và văn hóa Hàn Quốc. Với thiết kế độc đáo và hình ảnh độc lạ của BLACKPINK, chiếc áo thun không chỉ là một sản phẩm thời trang mà còn là cách thể hiện lòng yêu mến và hâm mộ đối với nhóm nhạc này.'
               ,150000,'ATH', 5,'Coolmate',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/40.jpg?alt=media&token=6b804db6-caa9-44cf-9873-f4da80eeaa64');
               
               INSERT INTO "Products" VALUES ('ATH09','Áo Thun Trơn'
               ,''
               ,'Áo thun trơn là loại áo đơn giản nhưng phổ biến trong thời trang hiện đại. Chúng thường làm từ vải cotton thoáng khí, êm ái và dễ chịu khi mặc. Với các màu sắc đa dạng, áo thun trơn dễ dàng kết hợp với nhiều phong cách và trang phục khác nhau, từ trang trí đơn giản đến phong cách cá nhân. Được ưa chuộng bởi sự tiện lợi và phong cách không kém phần thời thượng.'
               ,45000,'ATH', 10,'Yame',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/41.jpg?alt=media&token=8dc49c36-4bed-4fad-89aa-1bfd2a7ae52f');

               INSERT INTO "Products" VALUES ('AKH01','Áo Khoác Jean'
               ,'Áo polo nam đa dạng phong cách, kiểu dáng trẻ trung'
               ,'Áo khoác jean là biểu tượng của phong cách cá nhân và sự ấm áp. Chúng được làm từ vải jean bền chắc, thường có các chi tiết may mắn và túi tiện lợi. Áo khoác jean mang lại vẻ năng động và trẻ trung, phối cùng nhiều trang phục khác nhau từ áo thun đơn giản đến váy dài nữ tính. Với sự đa dạng về kiểu dáng và màu sắc, áo khoác jean là item không thể thiếu trong tủ đồ của mọi người.' 
               ,145000,'AKH',5,'Tommy Hilfiger',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/06.webp?alt=media&token=b79c1f82-6075-42be-8788-504a3718541d');
               
               INSERT INTO "Products" VALUES ('AKH02','Áo Khoác Nỉ'
               ,''
               ,'Áo khoác nỉ là lựa chọn lý tưởng cho sự ấm áp và thoải mái trong mùa đông. Chúng được làm từ chất liệu nỉ mềm mại, giữ ấm tốt và thoáng khí. Áo khoác nỉ thường có các chi tiết túi và khoen kéo tiện lợi. Với sự đa dạng về kiểu dáng và màu sắc, áo khoác nỉ dễ dàng kết hợp với nhiều trang phục khác nhau từ sporty đến casual, tạo nên phong cách cá nhân và ấm áp cho mọi hoàn cảnh.'
               ,20500,'AKH',12,'Ralph Lauren',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/07.jpg?alt=media&token=ac046549-5bab-4c0d-9bef-7d4f7a733057');
               
               INSERT INTO "Products" VALUES ('AKH03','Áo Khoác Bomber'
               ,''
               ,'Áo khoác bomber là biểu tượng của phóng khoáng và phối hợp dễ dàng trong thời trang. Chúng thường có cổ bản và bo sát tay, đặc trưng bởi chất liệu nylon hoặc da. Áo khoác bomber mang lại vẻ lịch lãm và cá tính, phù hợp với nhiều dịp từ casual đến semi-formal. Với sự đa dạng về màu sắc và chi tiết, áo bomber là điểm nhấn hoàn hảo cho bất kỳ trang phục nào, tạo nên phong cách thời trang độc đáo và hiện đại.'
               ,153000,'AKH',14,'GRIMM DC',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/08.jpg?alt=media&token=0d46bfa6-cf8b-4b67-a385-a201fe234e85');
               
               INSERT INTO "Products" VALUES ('AKH04','Áo Khoác Phao Da Trơn Có Mũ',
               '','Áo khoác phao da trơn có mũ là sự kết hợp hoàn hảo giữa phong cách và tính ứng dụng. Chúng được làm từ chất liệu da tổng hợp chống nước và lớp phao ấm áp bên trong. Áo có mũ giúp bảo vệ đầu khỏi gió và lạnh. Với thiết kế trơn và đơn giản, áo khoác này dễ dàng kết hợp với nhiều trang phục khác nhau, từ casual đến street style. Đây là lựa chọn không thể thiếu cho mùa đông.',192500,'AKH',9,'Now SaiGon',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/09.jpg?alt=media&token=0c42caf9-2a05-40e2-a377-d0a117e5863f');
               
               INSERT INTO "Products" VALUES ('AKH05','Áo Khoác Sọc Caro','','Áo khoác sọc caro là biểu tượng của phóng khoáng và phóng khoáng trong thời trang. Với các họa tiết caro truyền thống, chúng tạo điểm nhấn nổi bật cho trang phục. Áo khoác này thường được làm từ vải dày hoặc len, mang lại cảm giác ấm áp và thoải mái. Phối hợp dễ dàng với nhiều loại trang phục từ casual đến semi-formal, áo khoác sọc caro là lựa chọn hoàn hảo cho mùa thu và đông, tạo nên phong cách cá nhân và độc đáo.',99500,'AKH',23,'Hades',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/10.jpg?alt=media&token=23e1d110-b57d-49ae-8928-6b17420e1b52');
               
               INSERT INTO "Products" VALUES ('AKH06','Áo Khoác In Hình Sơn Tùng MTP','','Áo khoác in hình Sơn Tùng MTP là biểu tượng của sự ủng hộ và niềm đam mê với nghệ sĩ. Với hình ảnh Sơn Tùng MTP được in trên áo, nó trở thành một phần của văn hóa fanbase và cách thể hiện sự ủng hộ đối với nghệ sĩ. Áo này thường được làm từ vải cotton hoặc polyester, phổ biến trong giới trẻ yêu thích âm nhạc. Đây cũng là cách thể hiện sự cá nhân và phong cách độc đáo của người mặc.',156500,'AKH',5,'Yame',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/11.jpg?alt=media&token=33e279a5-2de3-4ae9-a5a4-0fa04a93aa1d');
               
               INSERT INTO "Products" VALUES ('AKH07','Áo Khoác Trung Niên Dày','','Áo khoác trung niên dày là lựa chọn lý tưởng cho mùa đông giúp giữ ấm và thoải mái. Thường được làm từ chất liệu vải dày như len, lông cừu, hoặc chất liệu tổng hợp chống gió. Áo có kiểu dáng đơn giản, thoải mái và phù hợp với tuổi trung niên. Với sự chú trọng vào tính ấm áp và tiện ích, áo khoác này thường có các chi tiết như túi rộng và cổ cao giữ ấm, tạo cảm giác thoải mái và an toàn cho người mặc.               ',215000,'AKH',13,'Yame',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/12.jpg?alt=media&token=5fc0dd19-b063-4e7d-afec-abe2b4136dc9');
               
               INSERT INTO "Products" VALUES ('AKH08','Áo Khoác Style Hàn Quốc','','Áo khoác style Hàn Quốc là biểu tượng của sự phóng khoáng và cá tính trong thời trang. Thường được thiết kế theo xu hướng hiện đại và độc đáo, áo khoác này có thể làm từ các chất liệu như vải dày hoặc da tổng hợp. Kiểu dáng thường có sự kết hợp giữa các đường cắt và màu sắc sắc nét, tạo nên phong cách cá nhân và ấn tượng. Áo khoác style Hàn Quốc thường được ưa chuộng bởi sự trẻ trung và phóng khoáng, phản ánh tinh thần của giới trẻ Hàn Quốc.',137500,'AKH',9,'Coolmate',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/13.jpg?alt=media&token=22f0c7a6-33ff-42ff-8c8a-681d8bcbdfaf');

               
               INSERT INTO "Products" VALUES ('QTA01','Quần Tây Dáng Baggy','','Quần tây dáng baggy là sự kết hợp giữa phong cách thời trang và sự thoải mái. Với dáng baggy, quần có phần rộng rãi ở phần chân, tạo cảm giác thoải mái và phóng khoáng. Thường làm từ vải thoáng khí như cotton hoặc linen, quần tây baggy mang lại sự linh hoạt và tiện ích cho người mặc. Phù hợp với nhiều hoàn cảnh từ công việc đến cuộc sống hàng ngày, quần tây dáng baggy là lựa chọn phổ biến trong thế giới thời trang hiện đại.',250000,'QTA',4,'5S Fashion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QTA01.jpg?alt=media&token=a7b8de80-e445-4633-ab45-92eb6c5db372');
               
               INSERT INTO "Products" VALUES ('QTA02','Quần Tây Vải Thun Lạnh','','Quần tây vải thun lạnh là sự lựa chọn hoàn hảo cho sự thoải mái và phong cách. Chúng được làm từ vải thun lạnh, mềm mại và thoáng mát, giúp thoải mái suốt cả ngày. Với sự linh hoạt của vải thun, quần tây này thích hợp cho nhiều hoàn cảnh từ công việc đến dạo phố. Đặc biệt, với kiểu dáng truyền thống của quần tây, kết hợp với vải thun lạnh, mang lại sự thoải mái và phong cách đẳng cấp cho người mặc',205000,'QTA',22,'Yame',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QTA02.jpg?alt=media&token=8354f28d-5a9f-48b9-9fc2-4977c4a99e1e');
               
               INSERT INTO "Products" VALUES ('QTA03','Quần Tây Âu Sọc Trắng','','Quần tây Âu sọc trắng là biểu tượng của phong cách lịch lãm và thanh lịch. Với sọc trắng trên nền đen hoặc màu sáng, chúng tạo điểm nhấn sang trọng và độc đáo. Quần thường được làm từ vải chất lượng cao như lụa, len hoặc vải đũi, mang lại cảm giác mềm mại và êm ái. Phù hợp cho nhiều dịp từ công sở đến các sự kiện quan trọng, quần tây Âu sọc trắng là biểu tượng của phong cách đẳng cấp và sự tự tin.',197000,'QTA',15,'SLY',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QTA03.jpg?alt=media&token=15f59593-a9fa-431f-85e6-4a1c077b5935');
               
               INSERT INTO "Products" VALUES ('QTA04','Quần Tây Cap Chun','','Quần tây Cap Chun là sự kết hợp hoàn hảo giữa phong cách và thoải mái. Chúng thường được làm từ chất liệu vải chun co giãn, tạo cảm giác linh hoạt và thoải mái cho người mặc. Với dáng cắt cổ điển, quần tây Cap Chun thích hợp cho nhiều dịp từ công việc đến cuộc họp hay dạo phố. Sự đa dạng trong màu sắc và kiểu dáng giúp quần tạo nên phong cách riêng biệt cho người mặc, mang lại sự tự tin và thoải mái suốt cả ngày.',180000,'QTA',7,'5S Fashion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QTA04.webp?alt=media&token=eb644868-b42c-40ef-b6ab-0ce0a402abbe');
               
               INSERT INTO "Products" VALUES ('QTA05','Quần Tây Ôm Body','','Quần tây ôm body là lựa chọn của những người thích sự sang trọng và gọn gàng. Thiết kế ôm sát với dáng vóc, quần tạo nên sự gọn gàng và lịch lãm. Thường được làm từ vải co giãn như spandex hoặc polyester, chúng mang lại sự thoải mái và linh hoạt trong di chuyển. Phù hợp cho các dịp công sở hoặc các sự kiện chính thức, quần tây ôm body tôn lên vẻ đẳng cấp và phong cách của người mặc.',230000,'QTA',36,'Routine',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QTA05.jpg?alt=media&token=26de424b-f7a8-4240-ba29-2a7964d572fb');
               
               INSERT INTO "Products" VALUES ('QTA06','Quần Tây Âu Bam Tab Quần Siêu Co Giãn','','Quần tây Âu Bam Tab Siêu Co Giãn là sự kết hợp giữa phom dáng truyền thống và công nghệ vải hiện đại. Với chất liệu siêu co giãn, quần tạo cảm giác thoải mái và linh hoạt trong mọi hoạt động. Thiết kế Bam Tab thêm vào sự sang trọng và phong cách. Phù hợp cho cả công việc và các dịp quan trọng, quần tây này là biểu tượng của sự thoải mái và phong cách trong thế giới thời trang nam giới.               ',190000,'QTA',56,'Rountine',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QTA06.jpg?alt=media&token=c66eb49d-8cf4-4869-b7b1-81c7c1475065');

               INSERT INTO "Products" VALUES ('ASM01','Áo Sơ Mi Trắng','','Áo sơ mi trắng là biểu tượng của sự thanh lịch và tinh tế trong thời trang nam giới. Với màu trắng tinh khôi, áo sơ mi trở thành lựa chọn hoàn hảo cho nhiều dịp từ công sở đến các sự kiện trang trọng. Chất liệu thường là cotton thoáng mát, tạo cảm giác dễ chịu và thoải mái cho người mặc. Kiểu dáng đa dạng từ cổ button-down đến cổ cúc cổ điển, áo sơ mi trắng luôn là item cần có trong tủ đồ của mọi quý ông.',100000,'ASM',8,'TEELAB',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/14.jpg?alt=media&token=c031cff7-c018-446e-846c-743778d50591');
               
               INSERT INTO "Products" VALUES ('ASM02','Áo Sơ Mi In Hoạ Tiết Phượng Hoàng','','Áo sơ mi in hoạ tiết phượng hoàng là biểu tượng của sức mạnh và vẻ đẹp tinh tế. Với họa tiết phượng hoàng, áo mang lại sự lịch lãm và độc đáo cho người mặc. Thường làm từ chất liệu cotton hoặc polyester, áo sơ mi này kết hợp giữa phần trước trang nhã và phần sau nổi bật với hoạ tiết phượng hoàng. Đây là lựa chọn phù hợp để thể hiện phong cách và sự tự tin của người đàn ông hiện đại.',115000,'ASM',15,'TEELAB',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/15.jpg?alt=media&token=0a92934b-ce61-4217-ac3c-8f9517ba22a6');
               
               INSERT INTO "Products" VALUES ('ASM03','Áo Sơ Mi Vân Vuông Viền Cổ','','Áo sơ mi vân vuông viền cổ là sự kết hợp tinh tế giữa hoa văn truyền thống và phá cách hiện đại. Với vẻ ngoài độc đáo của vân vuông và viền cổ, áo tạo điểm nhấn sang trọng và cá tính. Thường làm từ chất liệu cotton thoáng mát, áo sơ mi này vừa mang lại sự thoải mái vừa giữ được phong cách lịch lãm cho người mặc. Lựa chọn hoàn hảo cho các dịp từ công sở đến các sự kiện thường nhật.',185000,'ASM',45,'TEELAB',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/17.jpg?alt=media&token=cc2e7426-55e0-4d8c-8100-0816a0c6481d');
               
               INSERT INTO "Products" VALUES ('ASM04','Áo Sơ Mi Tay Dài','','Áo sơ mi tay dài là item cơ bản và linh hoạt trong tủ đồ của mọi quý ông. Với thiết kế tay dài, nó phù hợp cho nhiều dịp từ công sở đến dạo phố. Chất liệu thường là cotton thoáng mát và dễ chịu. Áo sơ mi tay dài có thể kết hợp với quần tây hoặc quần jean tạo nên phong cách lịch lãm và trẻ trung. Với sự đa dạng về kiểu dáng và màu sắc, áo sơ mi tay dài là lựa chọn phổ biến và thời thượng',175000,'ASM',25,'YODY',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/18.jpg?alt=media&token=9f775bfc-48b8-4bb8-aed2-30a95947eaa5');
               
               INSERT INTO "Products" VALUES ('ASM05','Áo Sơ Mi Tay Ngắn','','Áo sơ mi tay ngắn là biểu tượng của phong cách thoải mái và trẻ trung. Với thiết kế tay ngắn, nó phù hợp cho các hoạt động ngoài trời và môi trường nhiệt đới. Chất liệu thường là cotton thoáng khí, tạo cảm giác dễ chịu trong ngày hè nắng nóng. Áo sơ mi tay ngắn có thể kết hợp với quần short hoặc quần jean, tạo nên phong cách năng động và trẻ trung. Đây là lựa chọn phổ biến cho những người yêu thích sự thoải mái và tự do trong diện mạo.',150000,'ASM',7,'YODY',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/19.jpg?alt=media&token=76710aae-8aeb-4028-9566-943183a38086');
               
               INSERT INTO "Products" VALUES ('ASM06','Áo Sơ Mi Sọc Caro','','Áo sơ mi sọc caro là biểu tượng của phóng khoáng và lịch lãm trong thế giới thời trang nam. Với họa tiết caro truyền thống, áo tạo điểm nhấn nổi bật và phá cách cho trang phục. Chất liệu thường là cotton hoặc vải thoáng khí, mang lại cảm giác thoải mái và dễ chịu khi mặc. Áo sơ mi sọc caro dễ dàng kết hợp với quần tây hoặc quần jean, phù hợp cho nhiều dịp từ công sở đến dạo phố, tạo nên phong cách cá nhân và độc đáo',135000,'ASM',18,'Coolmate',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/20.jpg?alt=media&token=81fbea7d-ed5a-4ee2-ae89-0aad16503464');

               INSERT INTO "Products" VALUES ('QJE01','Quần Jeans Ống Suông','','Quần jeans ống suông là biểu tượng của phong cách retro và tự tin. Với ống quần rộng, chúng mang lại sự thoải mái và phóng khoáng cho người mặc. Chất liệu jeans bền bỉ và đa dạng màu sắc, kết hợp với kiểu dáng ống suông, tạo nên vẻ ngoài thời trang và cá tính. Quần jeans này thường phù hợp với nhiều loại áo từ sơ mi đến áo thun, tạo nên phong cách độc đáo và sành điệu.',300000,'QJE',24,'Aristino',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QJE01.jpg?alt=media&token=c4fd68bb-9971-4080-8b69-0367eaf13118');
               
               INSERT INTO "Products" VALUES ('QJE02','Quần Jeans Ống Đứng Phong Cách Hàn Quốc','','Quần jeans ống đứng phong cách Hàn Quốc là biểu tượng của sự hiện đại và cá tính. Với ống quần thẳng và form dáng ôm vừa vặn, chúng tôn lên vẻ đẹp tự nhiên của đôi chân. Kiểu dáng này thường được kết hợp với các chi tiết thời trang sành điệu như rộng bụng, các đường may sắc sảo và các chi tiết đính kèm. Quần jeans ống đứng phong cách Hàn Quốc thường phù hợp với nhiều phong cách thời trang và là lựa chọn ưa thích của giới trẻ.',285000,'QJE',12,'Yame',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QJE02.jpg?alt=media&token=bf206b8f-dc92-4901-8d81-f3e12a66d5c8');
               
               INSERT INTO "Products" VALUES ('QJE03','Quần Jeans Ôm','','Quần jeans ôm là biểu tượng của phong cách thời trang năng động và hiện đại. Với form ôm sát, chúng thường tôn lên đường cong tự nhiên của người mặc. Chất liệu jeans co giãn giúp tạo cảm giác thoải mái và linh hoạt trong mọi hoạt động. Quần jeans ôm thường đi kèm với nhiều kiểu dáng và màu sắc, phù hợp cho nhiều dịp từ đi làm đến đi chơi, là sự lựa chọn yêu thích của giới trẻ và người yêu thời trang.',235000,'QJE',12,'Aristino ',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QJE03.webp?alt=media&token=bf04ebeb-56ed-4b32-9e41-3f92f8178d51');
               
               INSERT INTO "Products" VALUES ('QJE04','Quần Jeans Form Rộng','','Đậm chất retro, quần jeans form rộng mang lại sự thoải mái và phong cách độc đáo. Dáng rộng thoải mái tạo cảm giác tự do cho người mặc, phù hợp cho nhiều hoạt động và phong cách thời trang.',178000,'QJE',24,'5S Fashion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QJE04.jpg?alt=media&token=7e9e4214-51c7-46b8-b1ba-dac5c3271b29');
               
               INSERT INTO "Products" VALUES ('QJE05','Quần Jeans Rách Gối Hiphop','','Quần jeans độc đáo với chi tiết rách gối thể hiện phong cách cá nhân và năng động. Phù hợp với những người yêu thích phong cách Hiphop và muốn tự do biểu đạt bản thân.',234000,'QJE',10,'Aristino ',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QJE05.jpg?alt=media&token=c34794af-fb7a-4616-8e42-daf4a3137201');
               
               INSERT INTO "Products" VALUES ('QJE06','Quần Jeans Baggy','','Với dáng baggy rộng rãi, quần jeans này tạo ra phong cách thoải mái và cá tính. Là lựa chọn lý tưởng cho những người ưa thích sự thoải mái và tự nhiên.',150000,'QJE',31,'Coolmate',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QJE06.jpg?alt=media&token=7b8a1280-a95b-4788-9c1c-175f06ec7353');

               INSERT INTO "Products" VALUES ('CVA01','Cà Vạt Cao Cấp, Chấm Bi','',' Cà vạt cao cấp với chi tiết chấm bi tinh tế là điểm nhấn hoàn hảo cho bộ trang phục lịch lãm và sang trọng, thích hợp cho các dịp quan trọng.',80000,'CVA',25,'Shibumi',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/58.jpg?alt=media&token=cd54346d-6413-4707-adce-4e1a5fd64606');
               
               INSERT INTO "Products" VALUES ('CVA02','Cà Vạt Caro Dáng Ôm Thời Trang','','Sự kết hợp giữa hoa văn caro và dáng ôm tạo nên phong cách thời trang và cá tính, phù hợp cho những người muốn thể hiện sự tự tin và phong độ.',99000,'CVA',31,'Shibumi',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/CVA02.jpg?alt=media&token=feab930f-d9bc-4e91-9ac2-b15e6e903387');
               
               INSERT INTO "Products" VALUES ('CVA03','Cà Vạt Trung Tiên Cao Cấp','','Cà vạt trung tính và sang trọng, là điểm nhấn hoàn hảo cho bộ trang phục công sở hoặc các buổi tiệc, thể hiện gu thẩm mỹ và phong cách đẳng cấp.',115000,'CVA',25,'Marinella',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/CVA03.jpg?alt=media&token=ac1b9f66-48ff-45f5-b9ce-4bebaf0b279f');
               
               INSERT INTO "Products" VALUES ('CVA04','Cà Vạt Phong Cách Hàn Quốc','','Sự kết hợp giữa phong cách Hàn Quốc và chất lượng cao cấp, tạo nên vẻ đẳng cấp và hiện đại, phản ánh cá tính và gu thời trang riêng.',98000,'CVA',36,'Marinella',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/CVA04.jpg?alt=media&token=156dc521-9b78-4dd7-ada8-142d4b07444a');
               
               INSERT INTO "Products" VALUES ('CVA05','Combo 3 Cà Vạt','','Sự lựa chọn linh hoạt và tiết kiệm cho các kiểu cà vạt khác nhau, phù hợp với nhiều phong cách và dịp khác nhau, tiết kiệm chi phí và thời gian mua sắm.',250000,'CVA',38,'Marinella',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/CVA05.webp?alt=media&token=059bccd5-d933-4b32-b7b9-20c0ffe80055');


               INSERT INTO "Products" VALUES ('QSH01','Quần Short Tắm Biển Nam Thời Trang Phong Cách','','Với thiết kế hiện đại và chất liệu thoáng mát, quần short tắm biển nam là sự lựa chọn hoàn hảo cho những ngày nghỉ dưỡng, mang lại phong cách và thoải mái tối đa.',150000,'QSH',31,'5S Fashion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QSH01.jpg?alt=media&token=017e5cb9-f5e7-4f30-9c21-3c40f29bd16d');
               
               INSERT INTO "Products" VALUES ('QSH02','Quần Short Baggy Trẻ Trung Năng Động','','Với dáng baggy trẻ trung và năng động, quần short này là lựa chọn tuyệt vời cho những hoạt động ngoài trời và thể thao, tạo nên phong cách cá nhân và tự tin.',125000,'QSH',34,'Coolmate',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QSH02.jpg?alt=media&token=0c71ee97-20e6-4251-a9fc-d358a65f6f94');
               
               INSERT INTO "Products" VALUES ('QSH03','Quần Thun Đá Banh','','Quần Thun Đá Banh là lựa chọn lý tưởng cho những hoạt động thể thao và giải trí ngoài trời. Với chất liệu thun co giãn tốt, chiếc quần này mang lại sự thoải mái và linh hoạt trong mọi chuyển động, giúp bạn dễ dàng tham gia vào các hoạt động thể thao mà không bị hạn chế.

               Thiết kế đơn giản nhưng thời trang của Quần Thun Đá Banh tạo điểm nhấn năng động và trẻ trung. Bạn có thể dễ dàng kết hợp quần này cùng áo thun hoặc áo polo để tạo ra những bộ trang phục thể thao phong cách.
               
               Với tính linh hoạt và đa dạng trong phong cách, Quần Thun Đá Banh không chỉ phục vụ cho việc tập luyện mà còn là một item thời trang đường phố đầy cá tính. Hãy để chiếc quần này làm nổi bật phong cách thể thao của bạn mỗi khi ra ngoài.
               
               Dù bạn đang tập luyện, đi dạo phố hay tham gia các hoạt động ngoài trời, Quần Thun Đá Banh sẽ luôn là sự lựa chọn đáng tin cậy cho mọi người yêu thể thao và phong cách thời trang.',100000,'QSH',31,'5S Fashion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QSH03.jpg?alt=media&token=5f452afe-2516-4dbf-a81f-2dd851da54cb');
               
               INSERT INTO "Products" VALUES ('QSH04', 'Quần Short Nam Dáng Âu','','Được thiết kế theo phong cách dáng Âu, Quần Short Nam Dáng Âu là điểm nhấn cho bất kỳ bộ trang phục nào trong mùa hè. Với kiểu dáng ôm sát nhưng vẫn thoải mái, chúng tôn lên vẻ nam tính và thể thao cho người mặc. Chất liệu thoáng mát giúp bạn luôn cảm thấy thoải mái và tự tin trong mọi hoàn cảnh, từ dạo phố đến dạo biển. Những chiếc quần short này cũng dễ dàng kết hợp với các loại áo và giày khác nhau, tạo ra nhiều phong cách độc đáo cho người mặc.',175000,'QSH',24,'Routine',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QSH04.jpg?alt=media&token=792dc9e2-def8-4f29-aea0-20b77b8235a7');
               
               INSERT INTO "Products" VALUES ('QSH05', 'Quần Short Nam Mát Mẻ Cho Mùa Hè','','Mang lại sự thoải mái và phong cách cho người mặc, Quần Short Nam Mát Mẻ Cho Mùa Hè là lựa chọn hoàn hảo trong những ngày nắng nóng. Chúng được làm từ chất liệu nhẹ nhàng và thoáng mát, giúp giữ cho cơ thể luôn mát mẻ và thoải mái. Với kiểu dáng thời trang và hiện đại, quần short này dễ dàng phối hợp với các loại áo và phụ kiện khác nhau, từ áo thun đơn giản đến áo sơ mi lịch lãm. Cho dù đi dạo phố hay dự tiệc, Quần Short Nam Mát Mẻ Cho Mùa Hè luôn là sự lựa chọn hàng đầu của các quý ông.',85000,'QSH',40,'Routine',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QSH05.webp?alt=media&token=457dbc55-069b-44fd-bd14-ee79166b9663');

               
               INSERT INTO "Products" VALUES ('ATN01','Áo Thun Cổ Tròn Cá Tính','','Áo Thun Cổ Tròn Cá Tính là một phần không thể thiếu trong tủ đồ của bất kỳ ai muốn thể hiện phong cách riêng của mình. Với thiết kế cổ tròn đơn giản nhưng đầy cá tính, chiếc áo này thích hợp cho cả nam và nữ. Chất liệu vải cotton mềm mại và thoáng mát, cho cảm giác thoải mái suốt cả ngày dài. Sự đa dạng trong màu sắc và họa tiết cũng giúp bạn dễ dàng kết hợp với các trang phục khác nhau, từ jeans đến quần short hay chân váy. Với Áo Thun Cổ Tròn Cá Tính, phong cách của bạn sẽ luôn nổi bật và cuốn hút.',150000,'ATN',35,'Demi',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/26.jpg?alt=media&token=52fd34f8-0792-4a54-9533-759b7ec5d1cb');
               
               INSERT INTO "Products" VALUES ('ATN02','Áo Thun Nữ Tay Ngắn Cotton Tinh Khiết','','Áo Thun Nữ Tay Ngắn Cotton Tinh Khiết là sự lựa chọn hoàn hảo cho phụ nữ muốn thoải mái nhưng vẫn duyên dáng trong mùa hè. Với chất liệu cotton tinh khiết, áo mang lại cảm giác mềm mại và thoáng đãng, phù hợp cho mọi hoạt động hàng ngày. Thiết kế tay ngắn và cổ tròn tạo nên sự nhẹ nhàng và thanh lịch, dễ dàng kết hợp với quần jean, chân váy hoặc quần short. Đồng thời, các màu sắc tươi sáng và phong cách trẻ trung của áo thêm phần nổi bật và thu hút ánh nhìn. Áo Thun Nữ Tay Ngắn Cotton Tinh Khiết là biểu tượng của sự năng động và sành điệu.',115000,'ATN',55,'5S Fashion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/27.jpg?alt=media&token=5d42191f-d103-4807-98de-83d197020dc5');
               
               INSERT INTO "Products" VALUES ('ATN03','Áo Gigle Logo Phoxe','','Áo Gigle Logo Phoxe là biểu tượng của sự phóng khoáng và cá tính. Với logo phoxe nổi bật được in trên áo, chiếc áo này không chỉ là một món đồ thời trang mà còn là biểu tượng của phong cách cá nhân. Chất liệu vải cao cấp và đường may tỉ mỉ mang lại sự thoải mái và bền bỉ trong suốt thời gian dài sử dụng. Thiết kế đơn giản nhưng đầy ấn tượng, áo Gigle Logo Phoxe dễ dàng kết hợp với nhiều loại quần và giày khác nhau, phản ánh sự tự tin và sáng tạo của người mặc.',185000,'ATN',34,'5S Fashion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/28.jpg?alt=media&token=803228c5-52b8-41bb-853e-790695b08302');
               
               INSERT INTO "Products" VALUES ('ATN04','Áo Thun Dài Tay Cổ Chữ V','','Áo Thun Dài Tay Cổ Chữ V là sự lựa chọn lý tưởng cho những người muốn kết hợp giữa sự lịch lãm và thoải mái. Với thiết kế cổ chữ V tinh tế và tay áo dài, chiếc áo này tạo nên vẻ ngoài lịch lãm và thanh lịch. Chất liệu vải mềm mại và thoáng mát giúp bạn cảm thấy thoải mái suốt cả ngày. Áo Thun Dài Tay Cổ Chữ V phối hợp dễ dàng với quần jean, quần tây hoặc quần short, phù hợp cho nhiều dịp khác nhau từ công việc đến hẹn hò. Đây là một món đồ không thể thiếu trong tủ đồ của bạn.',198000,'ATN',29,'5S Fashion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/29.jpg?alt=media&token=950b1202-dfb8-4ea9-ac76-7c197e8d5b07');
               
               INSERT INTO "Products" VALUES ('ATN05','Áo Thun Tay Lỡ Màu Trơn In Hình BTS','','Áo Thun Tay Lỡ Màu Trơn In Hình BTS là sự kết hợp hoàn hảo giữa phong cách và sự ủng hộ cho nhóm nhạc BTS. Với hình ảnh in độc đáo và chất liệu vải cotton thoáng mát, áo này không chỉ là một món đồ thời trang mà còn là biểu tượng của sự hâm mộ. Thiết kế tay lỡ và màu trơn tạo nên vẻ ngoài trẻ trung và sành điệu. Áo Thun Tay Lỡ Màu Trơn In Hình BTS là sự lựa chọn lý tưởng cho các fan hâm mộ muốn thể hiện tình yêu và sự ủng hộ đối với nhóm nhạc hàng đầu.',85000,'ATN',34,'Demi',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/30.jpg?alt=media&token=03607585-5ec4-4cfa-b7fa-8df8067a3f06');
               
               INSERT INTO "Products" VALUES ('ATN06', 'Áo Thun Ngắn Tay Sọc Caro Phong Cách','','Với thiết kế sọc caro trẻ trung và phong cách, Áo Thun Ngắn Tay Sọc Caro là một phần không thể thiếu trong tủ đồ của bạn. Với chất liệu cotton thoáng mát và form dáng ôm vừa vặn, áo này mang lại sự thoải mái và tự tin cho người mặc. Thiết kế ngắn tay giúp bạn cảm thấy thoải mái trong những ngày nắng nóng. Áo Thun Ngắn Tay Sọc Caro Phong Cách dễ dàng kết hợp với quần jean, quần short hoặc chân váy, tạo nên những trang phục năng động và cá tính cho mọi hoàn cảnh.',95000,'ATN',15,'Demi',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/32.jpg?alt=media&token=eea706ed-3654-471b-9300-0a9d10264d7a');
               
               INSERT INTO "Products" VALUES ('ATN07','Áo Thun Cotton Polo Nhí Nhảnh','','Áo Thun Cotton Polo Nhí Nhảnh là sự kết hợp hoàn hảo giữa phong cách thể thao và sự thoải mái hàng ngày. Với chất liệu cotton cao cấp và kiểu dáng polo truyền thống, áo này mang lại cảm giác mềm mại và thoải mái cho người mặc. Thiết kế nhí nhảnh với các họa tiết và màu sắc tươi sáng, tạo điểm nhấn và sự vui tươi cho trang phục. Áo Thun Cotton Polo Nhí Nhảnh phù hợp cho nhiều hoạt động từ dạo phố đến tham gia các hoạt động thể thao nhẹ nhàng.',175000,'ATN',8,'Coolmate',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/31.jpg?alt=media&token=4570f126-da5e-41ca-a2f8-d4e7c810d9c7');


               INSERT INTO "Products" VALUES ('AKN01','Áo Khoác Nỉ Thể Thao','','Áo Khoác Nỉ Thể Thao là một lựa chọn lý tưởng cho những ngày se lạnh hoặc khi tham gia các hoạt động thể thao. Với chất liệu nỉ mềm mại và cách điệu, áo khoác này mang lại sự thoải mái và ấm áp cho người mặc. Thiết kế đơn giản với túi kangaroo tiện lợi và cổ áo cao giúp giữ ấm cơ thể. Áo Khoác Nỉ Thể Thao phối hợp dễ dàng với quần jean, quần thể thao hoặc legging, tạo nên phong cách trẻ trung và năng động.',195000,'AKN',25,'Adidas',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/01.webp?alt=media&token=a916509b-ef13-44d0-8079-c40983d56b5b');
               
               INSERT INTO "Products" VALUES ('AKN02','Áo Khoác Dù Nữ Kiểu 2 Lớp Form Rộng','','Áo Khoác Dù Nữ Kiểu 2 Lớp Form Rộng là sự kết hợp hoàn hảo giữa phong cách và tính tiện ích. Với thiết kế 2 lớp, bên trong là áo phông, bên ngoài là áo khoác dù chống nước, bạn có thể dễ dàng điều chỉnh theo điều kiện thời tiết. Form rộng giúp bạn cảm thấy thoải mái và linh hoạt trong mọi hoạt động. Áo Khoác Dù Nữ Kiểu 2 Lớp Form Rộng phù hợp cho các hoạt động ngoài trời, từ đi dạo đến leo núi.',215000,'AKN',38,'Yame',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/02.webp?alt=media&token=d9380a66-14d9-46b6-b39b-6d77591f7679');
               
               INSERT INTO "Products" VALUES ('AKN03','Áo Khoác Gió Nữ 2 Lớp Chống Nước, Có Mũ','','Áo Khoác Gió Nữ 2 Lớp Chống Nước, Có Mũ là sự lựa chọn hoàn hảo cho mùa đông. Với thiết kế 2 lớp, bên trong là lớp lót ấm áp, bên ngoài là lớp vải chống gió và chống nước, áo khoác này giúp bạn bảo vệ khỏi thời tiết khắc nghiệt. Đặc biệt, áo có mũ giúp bảo vệ đầu và cổ khỏi gió lạnh. Thiết kế form dáng thời trang, phối màu sắc trẻ trung, Áo Khoác Gió Nữ 2 Lớp Chống Nước, Có Mũ là sự kết hợp hoàn hảo giữa tính tiện ích và phong cách.',225000,'AKN',30,'Yame',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/03.webp?alt=media&token=bb63630c-960b-4ba3-85a5-b0323bbba520');
               
               INSERT INTO "Products" VALUES ('AKN04','Áo Khoác Có Nón, Vải Thun Giữ Ấm','','Áo Khoác Có Nón là một lựa chọn xuất sắc để giữ ấm trong mùa đông. Chất liệu vải thun cao cấp giữ cho cơ thể luôn ấm áp và thoải mái. Thiết kế có nón giúp bảo vệ đầu khỏi gió lạnh và mưa nhỏ. Với form dáng thoải mái và trẻ trung, áo khoác này dễ dàng phối hợp với nhiều trang phục khác nhau. Cho dù là đi làm, dạo phố hay tham gia các hoạt động ngoài trời, Áo Khoác Có Nón là sự lựa chọn hoàn hảo để bạn luôn ấm áp và phong cách.',300000,'AKN',34,'Coolmate',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/04.webp?alt=media&token=e8e4d8cb-0de8-409a-984d-140b74bc9202');
               
               INSERT INTO "Products" VALUES ('AKN05','Áo Khoác Jeans Cá Tính','','Áo Khoác Jeans là biểu tượng của sự cá tính và phong cách thời trang. Với chất liệu jean bền đẹp và dáng áo form rộng, áo khoác này mang lại sự thoải mái và tự tin cho người mặc. Thiết kế cá tính với các chi tiết như túi và khuy cài tạo điểm nhấn độc đáo. Áo Khoác Jeans phối hợp dễ dàng với nhiều loại trang phục từ quần jean đến váy đầm, tạo nên phong cách năng động và ấn tượng. Đối với những ai yêu thích sự tự do và cá tính, Áo Khoác Jeans là sự lựa chọn không thể bỏ qua.',275000,'AKN',14,'Routine',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/05.webp?alt=media&token=74946a73-4d41-43a2-84f9-cbe913ab8318');

               INSERT INTO "Products" VALUES ('ASN01','Áo Sơ Mi Công Sở Dài Tay','','Áo Sơ Mi Công Sở Dài Tay là biểu tượng của sự lịch lãm và chuyên nghiệp trong môi trường công việc. Với chất liệu vải mềm mại và kiểu dáng dài tay truyền thống, áo sơ mi này mang lại sự thoải mái và tự tin cho người mặc. Thiết kế đơn giản nhưng sang trọng với cổ áo bẻ, túi ngực và các nút cài trước tạo nên vẻ ngoài chỉn chu và chuyên nghiệp. Áo Sơ Mi Công Sở Dài Tay dễ dàng kết hợp với quần tây hoặc quần jeans, phù hợp cho mọi dịp từ buổi họp công việc đến các sự kiện quan trọng.',275000,'ASN',14,'Routine',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/20.jpg?alt=media&token=81fbea7d-ed5a-4ee2-ae89-0aad16503464');
               
               INSERT INTO "Products" VALUES ('ASN02','Áo Sơ Mi Nữ Form Rộng Kiểu Hàn','','Áo Sơ Mi Nữ Form Rộng Kiểu Hàn là một biểu tượng của phong cách Hàn Quốc trẻ trung và sành điệu. Với form dáng rộng rãi và kiểu dáng thoải mái, áo sơ mi này mang lại sự thoải mái và phong cách cho phái đẹp. Chất liệu vải mềm mại và dễ chịu giúp bạn cảm thấy thoải mái suốt cả ngày. Thiết kế kiểu Hàn với các chi tiết như cổ áo rộng và tay áo puff tạo nên vẻ ngoài độc đáo và cá tính. Áo Sơ Mi Nữ Form Rộng Kiểu Hàn dễ dàng kết hợp với quần jean, chân váy hoặc quần âu, phù hợp cho nhiều dịp khác nhau từ đi làm đến dạo phố.',275000,'ASN',11,'Routine',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/21.jpg?alt=media&token=15010354-947d-4253-ba1e-3300617533ac');
               
               INSERT INTO "Products" VALUES ('ASN03','Áo Sơ Mi Trắng','','Áo Sơ Mi Trắng là một item cần có trong tủ đồ của mọi người, không chỉ bởi vẻ đẹp thanh lịch mà còn bởi tính ứng dụng cao. Với màu trắng tinh khôi và kiểu dáng đơn giản, áo sơ mi trắng dễ dàng kết hợp với nhiều trang phục khác nhau, từ quần jeans đến chân váy công sở. Chất liệu vải cotton thoáng mát giúp bạn cảm thấy dễ chịu trong mọi hoàn cảnh. Áo Sơ Mi Trắng phản ánh sự sạch sẽ, lịch lãm và sang trọng, là lựa chọn hoàn hảo cho những buổi gặp gỡ quan trọng hoặc ngày làm việc hàng ngày.',275000,'ASN',11,'Routine',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/22.jpg?alt=media&token=eecb1dbf-fd9b-4378-9fac-e85f4928f553');
               
               INSERT INTO "Products" VALUES ('ASN04','Áo Sơ Mi Nữ Kẻ Sọc','','Áo Sơ Mi Nữ Kẻ Sọc mang đến sự phá cách và cá tính cho phong cách của bạn. Với họa tiết kẻ sọc trẻ trung và phóng khoáng, áo sơ mi này là một điểm nhấn độc đáo trong tủ đồ của bạn. Chất liệu vải mềm mại và thoáng mát giúp bạn cảm thấy thoải mái suốt cả ngày. Thiết kế trẻ trung với cổ áo bẻ và tay áo lượn hút mắt, tạo nên vẻ ngoài cá tính và sành điệu. Áo Sơ Mi Nữ Kẻ Sọc phối hợp dễ dàng với quần jean, chân váy hoặc quần tây, phù hợp cho nhiều dịp từ công việc đến dạo phố.',275000,'ASN',11,'Routine',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/23.jpg?alt=media&token=24f9db43-5c3f-4f09-aa3c-e4556c6b371f');
               
               INSERT INTO "Products" VALUES ('ASN05','Áo Sơ Mi Nhung Quốc Dân','','Áo Sơ Mi Nhung Quốc Dân là biểu tượng của văn hóa truyền thống và đẳng cấp. Với chất liệu nhung cao cấp và hoa văn truyền thống, áo sơ mi này mang đến sự sang trọng và lịch lãm cho người mặc. Thiết kế truyền thống với cổ áo bẻ và tay áo dài tạo nên vẻ ngoài thanh lịch và quý phái. Áo Sơ Mi Nhung Quốc Dân là lựa chọn hoàn hảo cho những dịp quan trọng và đòi hỏi phong cách đẳng cấp.',275000,'ASN',12,'Routine',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/24.jpg?alt=media&token=2ff52261-e6b5-4575-bfa2-9b42e0597d17');
               
               INSERT INTO "Products" VALUES ('ASN06','Áo Sơ Mi Tay Ngắn','','Áo Sơ Mi Tay Ngắn là một sự lựa chọn thời trang và năng động cho mùa hè. Với thiết kế tay ngắn và chất liệu vải mềm mại, áo sơ mi này mang lại cảm giác thoải mái và thoáng mát trong ngày nắng. Thiết kế đơn giản nhưng trẻ trung, cùng các họa tiết và màu sắc phong phú, tạo nên vẻ ngoài sành điệu và cá tính. Áo Sơ Mi Tay Ngắn dễ dàng phối hợp với quần jean, quần short hoặc chân váy, tạo nên phong cách thời trang và năng động cho mọi ngày.',275000,'ASN',14,'Routine',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/25.jpg?alt=media&token=e5d273aa-7f61-4396-86e6-2e3b5cad7aab');

               INSERT INTO "Products" VALUES ('DLN01','Đầm Voan Cao Cấp, 3 Tầng Thời Trang','','Đầm Voan Cao Cấp, 3 Tầng Thời Trang là biểu tượng của sự nữ tính và lịch lãm. Với chất liệu voan mềm mại và cảm giác nhẹ nhàng, đầm mang lại sự thoải mái và quý phái cho người mặc. Thiết kế 3 tầng xếp lớp tạo nên sự sang trọng và duyên dáng, phản ánh phong cách thời trang hiện đại. Đầm Voan Cao Cấp, 3 Tầng Thời Trang là lựa chọn hoàn hảo cho các buổi tiệc hoặc sự kiện quan trọng, khi bạn muốn tỏa sáng và thu hút mọi ánh nhìn.',255000,'DLN',14,'Fleur Studio',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DLN01.jpg?alt=media&token=c33d79d2-e4ec-4f5f-b945-2e0e9bcd1b3a');
               
               INSERT INTO "Products" VALUES ('DLN02','Đầm Chữ A Tay Ngắn Cổ Tròn','','Đầm Chữ A Tay Ngắn Cổ Tròn là sự kết hợp hoàn hảo giữa sự thoải mái và phong cách thời trang. Với kiểu dáng chữ A rộng rãi và thiết kế tay ngắn cổ tròn, đầm tạo ra vẻ ngoài dễ mặc và thanh lịch. Chất liệu vải mềm mại và co giãn giúp bạn cảm thấy thoải mái suốt cả ngày. Thiết kế đơn giản nhưng không kém phần duyên dáng và quyến rũ, đầm chữ A là sự lựa chọn hoàn hảo cho những buổi đi chơi, hẹn hò hay gặp gỡ bạn bè.               ',285000,'DLN',25,'Fleur Studio',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DLN02.webp?alt=media&token=9d5fe036-643b-4b51-a7af-51c7e3bc29c9');
               
               INSERT INTO "Products" VALUES ('DLN03','Đầm Váy Trắng Cổ V','','Đầm Váy Trắng Cổ V là biểu tượng của sự tinh khôi và nữ tính. Với màu trắng thanh lịch và kiểu dáng cổ V sâu, đầm này mang lại vẻ đẹp dịu dàng và cuốn hút. Chất liệu vải mềm mại và phom dáng ôm sát tôn lên vóc dáng của bạn một cách duyên dáng. Thiết kế đơn giản nhưng tinh tế, đầm váy trắng cổ V là lựa chọn lý tưởng cho các buổi tiệc, dự tiệc hoặc dạo phố.',180000,'DLN',12,'Fleur Studio',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DLN03.jpg?alt=media&token=8533b16e-f3c4-4247-bb28-00c6ebccb1a7');
               
               INSERT INTO "Products" VALUES ('DLN04','Váy Công Chúa Gấm Xốp Phối Voan','','Váy Công Chúa Gấm Xốp Phối Voan là sự kết hợp hoàn hảo giữa sự lộng lẫy và dịu dàng. Với chất liệu gấm xốp cao cấp và voan mềm mại, váy mang lại vẻ đẹp sang trọng và nữ tính. Thiết kế công chúa với đường xếp ly phối voan tạo ra sự duyên dáng và quyến rũ, phản ánh phong cách thời trang cao cấp. Váy Công Chúa Gấm Xốp Phối Voan là lựa chọn tuyệt vời cho các dịp quan trọng như tiệc cưới, tiệc tối hoặc dự tiệc.',300000,'DLN',25,'Fleur Studio',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DLN04.jpg?alt=media&token=2021c4dd-7daf-46d3-b781-f585cea2c830');
               
               INSERT INTO "Products" VALUES ('DLN05','Đầm Nữ Thời Trang','','Đầm Nữ Thời Trang là biểu tượng của sự thanh lịch và quý phái. Với chất liệu vải mềm mại và kiểu dáng trẻ trung, đầm này mang lại vẻ đẹp dịu dàng và nữ tính. Thiết kế đơn giản nhưng tinh tế, cùng với các chi tiết như cổ áo bẻ, tay áo xếp ly, tạo nên sự duyên dáng và quyến rũ. Đầm Nữ Thời Trang là sự lựa chọn hoàn hảo cho các buổi tiệc, dự tiệc hay dạo phố.
               ',260000,'DLN',17,'Dottie',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DLN05.jpg?alt=media&token=756bec0f-8a41-4b62-8035-a703a38750d4');
               
               INSERT INTO "Products" VALUES ('DLN06','Váy Suông Sơ Mi Túi Hộp','','Váy Suông Sơ Mi Túi Hộp là sự kết hợp độc đáo giữa phong cách sơ mi và kiểu dáng váy suông. Với chất liệu vải mềm mại và kiểu dáng rộng rãi, váy này mang lại sự thoải mái và năng động. Thiết kế túi hộp tiện lợi và phong cách tạo điểm nhấn độc đáo, làm tôn lên vẻ đẹp hiện đại và cá tính của phụ nữ. Váy Suông Sơ Mi Túi Hộp là sự lựa chọn hoàn hảo cho những buổi gặp gỡ bạn bè, đi chơi hay mua sắm.',275000,'DLN',28,'Dottie',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DLN06.jpg?alt=media&token=7e959a7c-1beb-46dc-b31a-9d3f17bcddbb');

               INSERT INTO "Products" VALUES ('QJN01','Quần Jeans Ống Rộng Nữ','','Quần Jeans Ống Rộng Nữ là biểu tượng của sự thoải mái và phóng khoáng. Với kiểu dáng ống rộng thoải mái, quần jeans này mang lại cảm giác tự do và thoải mái cho phái đẹp. Chất liệu denim bền bỉ và co giãn giúp bạn cảm thấy thoải mái suốt cả ngày. Thiết kế đơn giản nhưng vẫn thời trang, phù hợp cho nhiều dịp từ dạo phố đến dự tiệc. Quần Jeans Ống Rộng Nữ là lựa chọn hoàn hảo cho những người phụ nữ yêu thích sự thoải mái và phong cách.
               ',295000,'QJN',12,'Fleur Studio',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QJN01.jpg?alt=media&token=4695e5f2-0d8e-449e-a3d8-eaf95c496ea8');
               
               INSERT INTO "Products" VALUES ('QJN02','Quần Jeans Baggy 2 Túi Trước','','Quần Jeans Baggy 2 Túi Trước là sự kết hợp giữa phong cách thời trang và tiện ích. Với kiểu dáng baggy rộng rãi và 2 túi trước tiện lợi, quần jeans này mang lại sự thoải mái và tiện dụng cho người mặc. Chất liệu denim mềm mại và bền bỉ giúp bạn cảm thấy thoải mái suốt cả ngày. Thiết kế baggy hiện đại và cá tính, phù hợp cho những người yêu thích phong cách năng động và tự do.',270000,'QJN',24,'Dottie',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QJN02.jpg?alt=media&token=34a68a61-d5a7-4046-b8e4-a36ec32e6970');
               
               INSERT INTO "Products" VALUES ('QJN03','Quần Jeans Nữ Ống Đứng Hơi Ôm','','Quần Jeans Nữ Ống Đứng Hơi Ôm là lựa chọn lý tưởng cho những người phụ nữ muốn thể hiện vóc dáng quyến rũ và thời trang. Với kiểu dáng ống đứng hơi ôm, quần jeans này tôn lên đường cong của cơ thể một cách tự nhiên và quyến rũ. Chất liệu denim co giãn giúp bạn cảm thấy thoải mái và tự tin suốt cả ngày. Thiết kế đơn giản nhưng vẫn sang trọng, phù hợp cho nhiều dịp từ đi làm đến dạo phố.',180000,'QJN',30,'Fleur Studio',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QJN03.jpg?alt=media&token=5b9d68e0-1f52-451f-b47e-358ca5f8bc04');
               
               INSERT INTO "Products" VALUES ('QJN04','Quần Jeans Nữ Thời Trang Cá Tính','','Quần Jeans Nữ Thời Trang Cá Tính là biểu tượng của sự phóng khoáng và tự do. Với kiểu dáng thời trang cá tính, quần jeans này mang lại vẻ ngoài năng động và cá tính cho phái đẹp. Chất liệu denim cao cấp giúp bạn cảm thấy thoải mái và tự tin suốt cả ngày. Thiết kế độc đáo và hiện đại, phối hợp dễ dàng với nhiều trang phục khác nhau. Quần Jeans Nữ Thời Trang Cá Tính là sự lựa chọn hoàn hảo cho những cô gái yêu thích phong cách riêng và đầy cá tính.',199000,'QJN',19,'Dottie',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QJN04.jpg?alt=media&token=d7df1b18-7f2a-432f-988b-a302a7e4f6c1');
               
               INSERT INTO "Products" VALUES ('QJN05','Quần Jeans Nữ Baggy Ống Suông','','Quần Jeans Nữ Baggy Ống Suông là một sự kết hợp tuyệt vời giữa phong cách cá nhân và sự thoải mái hàng ngày. Với kiểu dáng baggy và ống quần suông, chiếc quần này không chỉ mang lại sự thoải mái mà còn tạo điểm nhấn cho bộ trang phục của bạn.

               Chất liệu jeans cao cấp và độ co giãn linh hoạt giúp bạn dễ dàng vận động mà vẫn giữ được form dáng đẹp mắt. Đặc biệt, đường may tỉ mỉ và chắc chắn giúp sản phẩm bền bỉ theo thời gian.
               
               Quần Jeans Nữ Baggy Ống Suông phản ánh phong cách cá nhân và sự tự tin của người phụ nữ hiện đại. Dù bạn kết hợp cùng áo thun basic hay áo sơ mi trẻ trung, chiếc quần này luôn là lựa chọn hoàn hảo cho những buổi gặp gỡ bạn bè, dạo phố hay thậm chí là các sự kiện thời trang.
               
               Nếu bạn đang tìm kiếm một chiếc quần jeans phong cách và độc đáo, Quần Jeans Nữ Baggy Ống Suông chắc chắn sẽ là một trong những lựa chọn hàng đầu của bạn.',189000,'QJN',9,'Fleur Studio',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QJN05.jpg?alt=media&token=c1d763c5-8cda-4f65-bd73-2e96ed912ac5');

               INSERT INTO "Products" VALUES ('QSN01','Quần Đùi Nữ Chất Kaki','','Quần Đùi Nữ Chất Kaki là sự kết hợp hoàn hảo giữa phong cách thời trang và sự thoải mái hàng ngày. Với chất liệu kaki cao cấp, quần đùi này mang lại cảm giác mềm mại và êm ái cho người mặc, đồng thời vẫn giữ được form dáng và sự thoải mái trong mọi hoạt động.

               Thiết kế đơn giản nhưng không kém phần tinh tế của Quần Đùi Nữ Chất Kaki tạo điểm nhấn cho bộ trang phục của bạn. Với các màu sắc trung tính và dễ phối đồ, chiếc quần này phản ánh sự thanh lịch và cá tính của phái đẹp.
               
               Quần Đùi Nữ Chất Kaki là lựa chọn hoàn hảo cho những ngày hè nóng bức. Bạn có thể kết hợp cùng áo thun basic hoặc áo sơ mi để tạo nên những bộ trang phục phong cách và thoải mái.
               
               Với sự linh hoạt và đa dạng trong cách phối đồ, Quần Đùi Nữ Chất Kaki là một item không thể thiếu trong tủ đồ của bạn, đặc biệt là trong những chuyến du lịch, dạo phố hay những buổi gặp gỡ bạn bè. Hãy để chiếc quần này làm nổi bật phong cách cá nhân của bạn mỗi ngày!',167000,'QSN',7,'Dottie',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QSN01.jpg?alt=media&token=f50f187d-f3a3-4e6d-8723-ab01ccef5328');
               
               INSERT INTO "Products" VALUES ('QSN02','Quần Short Nữ Cạp Chun','','Quần Short Nữ Cạp Chun là sự kết hợp hoàn hảo giữa phong cách và thoải mái. Với kiểu dáng short ngắn và cạp chun linh hoạt, quần này mang lại sự thoải mái và dễ chịu cho người mặc. Chất liệu vải mềm mại và thoáng khí giúp bạn cảm thấy thoải mái trong mọi hoạt động. Thiết kế đơn giản nhưng thời trang, phù hợp cho những buổi dạo chơi, đi picnic hoặc thậm chí là các buổi tập thể dục ngoài trời.',243000,'QSN',31,'Fleur Studio',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QSN02.jpg?alt=media&token=6e59cb03-1b16-42c6-89e4-15ee5815bb94');
               
               INSERT INTO "Products" VALUES ('QSN03','Quần Short Đùi Đan Dây Hai Bên','','Quần Short Đùi Đan Dây Hai Bên là lựa chọn năng động và trẻ trung cho mùa hè. Với thiết kế đùi ngắn và dây rút hai bên, quần này tạo nên vẻ ngoài phóng khoáng và cá tính. Chất liệu vải thoáng mát và co giãn giúp bạn cảm thấy thoải mái và tự tin khi hoạt động. Thiết kế đơn giản nhưng đầy cá tính, quần short đùi đan dây hai bên phù hợp cho các buổi dạo phố, đi biển hoặc tham gia các hoạt động thể thao ngoài trời.',210000,'QSN',4,'Fleur Studio',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QSN03.jpg?alt=media&token=8704ed64-a9be-41d4-910d-92a7ff6489ec');
               
               INSERT INTO "Products" VALUES ('QSN04','Quần Short Jeans','','Quần Short Jeans là biểu tượng của sự trẻ trung và thời trang. Với chất liệu denim bền đẹp và kiểu dáng ngắn gọn, quần này mang lại vẻ ngoài sành điệu và cá tính cho người mặc. Thiết kế đơn giản nhưng vẫn thời trang, phối hợp dễ dàng với nhiều loại áo và giày khác nhau. Quần Short Jeans là sự lựa chọn lý tưởng cho mùa hè, khi bạn muốn thoải mái và năng động mà vẫn giữ được phong cách.',285000,'QSN',38,'Dottie',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QSN04.jpg?alt=media&token=48faaeb2-e5e2-43e5-8f9f-f69fe290f669');
               
               INSERT INTO "Products" VALUES ('QSN05','Quần Short Nữ Ống Rộng','','Quần Short Nữ Ống Rộng là sự kết hợp hoàn hảo giữa phong cách retro và sự thoải mái hiện đại. Với kiểu dáng ống rộng và cạp cao, quần này tạo ra vẻ ngoài độc đáo và phóng khoáng. Chất liệu vải mềm mại và co giãn giúp bạn cảm thấy thoải mái suốt cả ngày. Thiết kế nữ tính và hiện đại, quần short này dễ dàng kết hợp với áo thun, áo sơ mi hoặc áo crop top, phù hợp cho nhiều dịp từ dạo phố đến dự tiệc.',185000,'QSN',33,'Routine',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/QSN05.jpg?alt=media&token=562fb91e-8f48-4f2c-a4dc-cfe5aadbcdf4');

               INSERT INTO "Products" VALUES ('GTT01','Giày Thể Thao Nam Bitis','','Giày Thể Thao Nam Bitis là sự lựa chọn hoàn hảo cho những người đàn ông yêu thể thao và hoạt động ngoài trời. Với thiết kế thời trang và công nghệ tiên tiến, giày này mang lại sự thoải mái và ổn định cho đôi chân trong mọi hoàn cảnh. Chất liệu cao cấp và đế giày êm ái giúp giảm thiểu sự mệt mỏi và cung cấp sự hỗ trợ tối đa cho các hoạt động thể thao. Giày Thể Thao Nam Bitis là sự kết hợp tinh tế giữa phong cách và tính năng, phù hợp cho mọi người từ người mới tập luyện đến những vận động viên chuyên nghiệp.',1250000,'GTT',19,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTT01.webp?alt=media&token=23b34057-a6eb-4f05-97e6-0245dcbde750');
               
               INSERT INTO "Products" VALUES ('GTT02','Giày Thể Thao Chạy Bộ Nam Adidas','','Giày Thể Thao Chạy Bộ Nam Adidas là sự lựa chọn hàng đầu cho những người yêu thích hoạt động chạy bộ. Với công nghệ tiên tiến và thiết kế độc đáo của Adidas, đôi giày này mang lại sự thoải mái và hiệu suất tối ưu cho mỗi bước chạy. Chất liệu cao cấp và đế giày linh hoạt giúp giảm sốc và tăng độ bền của đế. Thiết kế thời trang và đa dạng màu sắc cho phép bạn tự tin trong mọi bước chạy. Giày Thể Thao Chạy Bộ Nam Adidas là sự kết hợp hoàn hảo giữa phong cách và hiệu suất, đồng hành cùng bạn trên mọi nẻo đường.',980000,'GTT',25,'Adidas',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTT02.jpg?alt=media&token=756ff0c6-795b-4111-ab50-feb7c4aca325');
               
               INSERT INTO "Products" VALUES ('GTT03','Giày Thể Thao Thông Dụng Nam Bitis','','Giày Thể Thao Thông Dụng Nam Bitis là lựa chọn linh hoạt và đa dụng cho các hoạt động thể thao và hàng ngày. Với thiết kế đơn giản và tiện lợi, đôi giày này phản ánh phong cách trẻ trung và năng động. Chất liệu chất lượng và đế giày êm ái giúp cung cấp sự thoải mái và hỗ trợ cho đôi chân suốt cả ngày dài. Thiết kế đa dạng màu sắc và kiểu dáng phù hợp với nhiều phong cách thời trang và hoạt động. Giày Thể Thao Thông Dụng Nam Bitis là sự kết hợp hoàn hảo giữa phong cách và tính năng, là người bạn đồng hành đáng tin cậy trong mọi hoàn cảnh.',1750000,'GTT',24,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTT03.webp?alt=media&token=1817d44c-0a83-49ec-bbcf-3e582081da5b');
               
               INSERT INTO "Products" VALUES ('GTT04','Giày Chạy Bộ Nam','','Giày Chạy Bộ Nam là công cụ không thể thiếu cho mọi người đam mê chạy bộ. Với thiết kế nhẹ nhàng và thoải mái, đôi giày này giúp bạn vượt qua mọi thách thức trong từng bước chạy. Chất liệu đế giày linh hoạt và êm ái giúp giảm sốc và cung cấp sự hỗ trợ tối đa cho đôi chân. Thiết kế đơn giản và chắc chắn mang lại sự ổn định và thoải mái trong mỗi chạm đất. Giày Chạy Bộ Nam là sự kết hợp hoàn hảo giữa hiệu suất và phong cách, giúp bạn vươn xa hơn mỗi ngày.',1150000,'GTT',16,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTT04.jpg?alt=media&token=3ab4cf5b-b5a1-4441-a22b-9080916ae99b');
               
               INSERT INTO "Products" VALUES ('GTT05','Giày Đi Bộ Thể Dục Cho Nam','','Giày Đi Bộ Thể Dục Cho Nam là sự lựa chọn thông minh cho mọi người muốn duy trì sức khỏe và thể dục hàng ngày. Với thiết kế thoải mái và đa dụng, đôi giày này làm cho mỗi bước đi trở nên dễ dàng và thoải mái. Chất liệu cao cấp và đế giày êm ái giúp giảm thiểu mệt mỏi và giữ cho đôi chân luôn được bảo vệ. Thiết kế trẻ trung và hiện đại phù hợp với nhiều phong cách thời trang. Giày Đi Bộ Thể Dục Cho Nam là người bạn đồng hành đáng tin cậy trong hành trình chăm sóc sức khỏe của bạn.',1850000,'GTT',15,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTT05.jpg?alt=media&token=e593c622-0134-4a12-a313-79995c021352');
               
               INSERT INTO "Products" VALUES ('GTT06','Giày Leo Núi Dã Ngoại Chống Thấm Nước','','Giày Leo Núi Dã Ngoại Chống Thấm Nước là trợ thủ đắc lực cho những người đam mê khám phá tự nhiên và leo núi. Với chất liệu chống thấm nước và đế chống trượt, đôi giày này giữ cho bạn luôn khô ráo và an toàn trong môi trường dã ngoại khắc nghiệt. Thiết kế bền bỉ và đa chức năng giúp bạn vượt qua mọi khó khăn trên đường đi. Đôi giày này là sự kết hợp hoàn hảo giữa tính năng và phong cách, đồng hành cùng bạn khám phá những cung đường mới mẻ và hấp dẫn.',1600000,'GTT',26,'Adidas',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTT06.jpg?alt=media&token=5ee653dd-5a47-433e-843d-0ce19e6e52de');

               INSERT INTO "Products" VALUES ('GSN01','Giày Sục Nam','','Giày Sục Nam là lựa chọn lý tưởng cho những người đàn ông yêu thích sự thoải mái và tiện ích. Với thiết kế đơn giản và dễ dàng mặc, đôi giày này là sự kết hợp hoàn hảo giữa phong cách và tiện lợi. Chất liệu cao cấp và đế giày êm ái giúp giảm mệt mỏi và tạo cảm giác thoải mái cho đôi chân. Thiết kế đa dạng màu sắc và kiểu dáng phù hợp với nhiều hoạt động hàng ngày từ đi làm đến đi chơi. Giày Sục Nam là người bạn đồng hành đáng tin cậy trong mọi hoàn cảnh.',1100000,'GSN',19,'Thế Giới Đồ Da',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GSN01.jpg?alt=media&token=fc0eaaae-f931-470b-b76d-210ef1ae6ae8');
               
               INSERT INTO "Products" VALUES ('GSN02','Giày Sục Nam Da Thật Quai Chữ H','','Giày Sục Nam Da Thật Quai Chữ H là biểu tượng của sự sang trọng và đẳng cấp. Với chất liệu da thật cao cấp và thiết kế quai chữ H tinh tế, đôi giày này tạo ra vẻ ngoài lịch lãm và thanh lịch. Đế giày êm ái và chắc chắn giúp bạn cảm thấy tự tin và thoải mái suốt cả ngày. Thiết kế đơn giản nhưng đầy tinh tế, phù hợp cho các dịp từ đi làm đến dự tiệc. Giày Sục Nam Da Thật Quai Chữ H là sự lựa chọn hoàn hảo cho những người đàn ông muốn thể hiện phong cách đẳng cấp và sang trọng.',1450000,'GSN',24,'Thế Giới Đồ Da',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GSN02.jpg?alt=media&token=9ef328ae-13a4-43f6-847d-fa9a8fd5b41c');
               
               INSERT INTO "Products" VALUES ('GSN03','Giày Mules Nam Mũi Tròn Hở Gót Thời Trang','','Giày Mules Nam Mũi Tròn Hở Gót Thời Trang là biểu tượng của sự phong cách và tiện ích. Với thiết kế mũi tròn và gót hở, đôi giày này tạo ra vẻ ngoài hiện đại và thời trang. Chất liệu cao cấp và đế giày êm ái giúp bạn cảm thấy thoải mái và tự tin khi di chuyển. Thiết kế đơn giản và tiện lợi phù hợp với nhiều phong cách thời trang và hoàn cảnh. Giày Mules Nam là sự lựa chọn hoàn hảo cho những người đàn ông muốn kết hợp phong cách và thoải mái trong từng bước đi.',1950000,'GSN',30,'Thế Giới Đồ Da',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GSN03.webp?alt=media&token=93717899-aeb5-4bab-919d-2d4968b2056c');
               
               INSERT INTO "Products" VALUES ('GSN04','Giày Mule Thời Trang Playball Monogram','','Giày Mule Thời Trang Playball Monogram là biểu tượng của sự phong cách và đẳng cấp. Với thiết kế monogram độc đáo và kiểu dáng mule thời trang, đôi giày này tạo ra vẻ ngoài sang trọng và lịch lãm. Chất liệu cao cấp và đế giày êm ái giúp bạn cảm thấy thoải mái và tự tin khi di chuyển. Thiết kế đơn giản nhưng đầy tính ứng dụng, phù hợp với nhiều bộ trang phục khác nhau từ dạo phố đến dự tiệc. Giày Mule Thời Trang Playball Monogram là sự kết hợp hoàn hảo giữa phong cách và tiện ích, làm nổi bật phom dáng và gu thẩm mỹ của bạn.',1350000,'GSN',31,'Thế Giới Đồ Da',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GSN04.webp?alt=media&token=b14c983c-01b4-4f9f-a725-fb5125b25f20');
               
               INSERT INTO "Products" VALUES ('GSN05','Giày Sục Nam Da Bò Chính Hãng','','Giày Sục Nam Da Bò Chính Hãng là lựa chọn đáng tin cậy cho sự thoải mái hàng ngày. Với chất liệu da bò chính hãng và thiết kế đơn giản nhưng sang trọng, đôi giày này tạo ra vẻ ngoài đẳng cấp và lịch lãm. Đế giày êm ái và bền bỉ giúp bạn cảm thấy thoải mái suốt cả ngày dài. Thiết kế đa dạng màu sắc và kiểu dáng phù hợp với nhiều phong cách thời trang. Giày Sục Nam Da Bò là sự lựa chọn hoàn hảo cho những người đàn ông muốn kết hợp giữa sự thoải mái và đẳng cấp trong từng bước đi.',1250000,'GSN',22,'Thế Giới Đồ Da',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GSN05.jpg?alt=media&token=b8b5c174-2059-40dd-a1a8-9579c13a09db');


               INSERT INTO "Products" VALUES ('GTL01','Giày Tây Nam Zuciani Derby Thắt Dây Da Dập Vân','','Giày Tây Nam Zuciani Derby Thắt Dây Da Dập Vân là biểu tượng của sự lịch lãm và phong cách. Với chất liệu da cao cấp và thiết kế derby truyền thống, đôi giày này tạo ra vẻ ngoài đẳng cấp và sang trọng. Đế giày êm ái và chắc chắn giúp bạn cảm thấy tự tin và thoải mái suốt cả ngày. Thiết kế đa dạng vân da và chi tiết thắt dây tinh tế tạo điểm nhấn sang trọng cho bộ trang phục của bạn. Giày Tây Nam Zuciani Derby là lựa chọn lý tưởng cho các dịp quan trọng và các buổi gặp gỡ quan trọng.',980000,'GTL',18,'Đông Hải',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTL01.webp?alt=media&token=bab992ba-0953-449a-95a7-c2e99dfd4bbf');
               
               INSERT INTO "Products" VALUES ('GTL02','Giày Tây MCKAY Đế Phối Da','','Giày Tây MCKAY Đế Phối Da là sự kết hợp tinh tế giữa phong cách và độ bền. Với chất liệu da cao cấp và đế giày phối da, đôi giày này tạo ra vẻ ngoài lịch lãm và đẳng cấp. Thiết kế đơn giản nhưng sang trọng, phù hợp với nhiều dịp từ công việc đến các sự kiện chính trị hay dự tiệc. Đế giày êm ái và bền bỉ giúp bạn tự tin và thoải mái suốt cả ngày. Giày Tây MCKAY là biểu tượng của sự thanh lịch và sự tự tin.',1750000,'GTL',16,'Đông Hải',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTL02.webp?alt=media&token=11b20323-cdab-4fc5-84f0-4f2321d2c5a2');
               
               INSERT INTO "Products" VALUES ('GTL03','Giày Tây Nam Zuciani Hoạ Tiến Đục Lỗ Thắt Dây Da Dập Vuông','','Giày Tây Nam Zuciani Hoạ Tiến Đục Lỗ Thắt Dây Da Dập Vuông là sự kết hợp tinh tế giữa phong cách hiện đại và đẳng cấp. Với thiết kế đục lỗ độc đáo và chi tiết thắt dây độc đáo, đôi giày này tạo điểm nhấn độc đáo cho bộ trang phục của bạn. Chất liệu da cao cấp và đế giày chắc chắn giúp bạn tự tin và thoải mái suốt cả ngày. Thiết kế vuông vuông và cổ điển tạo ra vẻ ngoài thanh lịch và sang trọng, phù hợp với nhiều dịp khác nhau từ công việc đến các sự kiện quan trọng.',1150000,'GTL',26,'Đông Hải',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTL03.jpg?alt=media&token=175aed36-8d03-4a84-8cf0-b776b3e9373f');
               
               INSERT INTO "Products" VALUES ('GTL04','Giày Tây Nam Bitis','','Giày Tây Nam Bitis là biểu tượng của sự lịch lãm và đẳng cấp. Với chất liệu da cao cấp và thiết kế đơn giản nhưng sang trọng, đôi giày này thể hiện phong cách thanh lịch và tinh tế của người mặc. Đế giày êm ái và bền bỉ giúp bạn tự tin và thoải mái suốt cả ngày. Thiết kế đa dạng màu sắc và kiểu dáng phù hợp với nhiều phong cách thời trang và hoàn cảnh khác nhau. Giày Tây Nam Bitis là sự lựa chọn lý tưởng cho các quý ông muốn thể hiện sự lịch lãm và tinh tế trong mọi dịp.',1850000,'GTL',14,'Đông Hải',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTL04.jpg?alt=media&token=4202e4e9-613c-48e5-80e9-009aa2e4fda7');
               
               INSERT INTO "Products" VALUES ('GTL05','Giày Tây Boot Nam Bitis','','Giày Tây Boot Nam Bitis là biểu tượng của sự nam tính và phóng khoáng. Với thiết kế boot đen cổ điển và phom dáng mạnh mẽ, đôi giày này tạo ra vẻ ngoài mạnh mẽ và cá tính cho người mặc. Chất liệu da cao cấp và đế giày chắc chắn giúp bạn tự tin và thoải mái trên mọi nẻo đường. Thiết kế linh hoạt và phù hợp với nhiều phong cách thời trang, từ công việc đến cuộc hẹn cuối tuần. Giày Tây Boot Nam Bitis là sự kết hợp hoàn hảo giữa phong cách và tính ứng dụng, thể hiện sự mạnh mẽ và đẳng cấp của người mặc.',1700000,'GTL',22,'Đông Hải',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTL05.webp?alt=media&token=9bbf278d-a699-407f-b610-3eb51e69a89f');

               INSERT INTO "Products" VALUES ('DSN01','Sandal Thể Thao Eva Phun Nam Bitis Hunter','','Sandal Thể Thao Eva Phun Nam Bitis Hunter là lựa chọn thông minh cho những hoạt động ngoài trời và thể thao. Với chất liệu nhựa EVA phun bọt nhẹ nhàng và đế giày chống trượt, đôi sandal này mang lại sự thoải mái và an toàn cho đôi chân của bạn. Thiết kế đơn giản và tiện lợi phù hợp với mọi hoàn cảnh, từ đi dạo đến tham gia các hoạt động thể thao. Sandal Thể Thao Eva Phun Nam Bitis Hunter là người bạn đồng hành đáng tin cậy trong mọi chuyến đi và hoạt động ngoài trời.',1550000,'DSN',19,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DSN01.jpg?alt=media&token=5288e62a-d650-448f-9a72-e9ca6f89753e');
               
               INSERT INTO "Products" VALUES ('DSN02','Sandal Nam Bitis Hunter Tonic','','Sandal Nam Bitis Hunter Tonic là biểu tượng của sự thoải mái và phong cách. Với thiết kế đơn giản nhưng hiện đại, đôi sandal này mang lại cảm giác thoải mái và tự tin cho người mang. Chất liệu nhựa cao cấp và đế giày chắc chắn giúp bạn thoải mái di chuyển trong mọi hoàn cảnh. Thiết kế đa dạng màu sắc và kiểu dáng phù hợp với nhiều phong cách thời trang và hoàn cảnh khác nhau. Sandal Nam Bitis Hunter Tonic là sự lựa chọn tối ưu cho những người muốn kết hợp giữa sự thoải mái và phong cách trong cuộc sống hàng ngày.',1200000,'DSN',16,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DSN02.webp?alt=media&token=1cea3059-4fab-4227-8740-5d122ae832e9');
               
               INSERT INTO "Products" VALUES ('DSN03','Sandal Nam Hunter X Blazin Neon Collection','','Sandal Nam Hunter X Blazin Neon Collection là sự kết hợp độc đáo giữa phong cách cá tính và sự thoải mái. Với thiết kế sắc nét và màu sắc neon rực rỡ, đôi sandal này nổi bật và thu hút ánh nhìn. Chất liệu nhựa cao cấp và đế giày chống trượt giúp bạn tự tin di chuyển trong mọi hoàn cảnh. Thiết kế năng động và hiện đại phù hợp với những người trẻ trung và sáng tạo. Sandal Nam Hunter X Blazin Neon Collection là sự lựa chọn tuyệt vời cho những buổi dạo chơi và thảo luận cùng bạn bè.',1650000,'DSN',24,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DSN03.jpg?alt=media&token=ad784b8e-8636-4c85-8f75-57926d13eafd');
               
               INSERT INTO "Products" VALUES ('DSN04','Sandal Si Cao Su Nam Bitis','','Sandal Si Cao Su Nam Bitis là lựa chọn thông minh cho sự thoải mái và tiện ích hàng ngày. Với thiết kế đơn giản và tiện lợi, đôi sandal này mang lại cảm giác thoải mái và dễ dàng cho người mang. Chất liệu cao su mềm mại và đế giày chống trượt giúp bạn tự tin bước đi trên mọi nền đất. Thiết kế tiện ích và bền bỉ phù hợp với những người ưa thích sự đơn giản và tiện dụng. Sandal Si Cao Su Nam Bitis là người bạn đồng hành đáng tin cậy trong mọi hoàn cảnh và thời tiết.',1900000,'DSN',30,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DSN04.jpg?alt=media&token=09061883-c8b1-4743-b406-4290c3135e78');
               
               INSERT INTO "Products" VALUES ('DSN05','Sandal Quai Ngang Thời Trang Kiểu Dáng Streetwear Mang Đi Học','','Sandal Quai Ngang Thời Trang Kiểu Dáng Streetwear Mang Đi Học là sự kết hợp độc đáo giữa phong cách thời trang và tính ứng dụng. Với thiết kế quai ngang đơn giản và kiểu dáng streetwear, đôi sandal này tạo nên phong cách cá nhân và năng động cho người mang. Chất liệu cao su và vải mềm mại mang lại cảm giác thoải mái và êm ái trong mọi hoàn cảnh. Thiết kế linh hoạt và tiện lợi phù hợp với những người trẻ trung và sáng tạo, đặc biệt là khi đi học hoặc tham gia các hoạt động ngoài trời. Sandal Quai Ngang Thời Trang là sự lựa chọn hoàn hảo cho mọi buổi đi chơi và học tập.',1400000,'DSN',31,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DSN05.jpg?alt=media&token=2667bb32-cc6b-4457-a82a-d4806cb492b4');


               INSERT INTO "Products" VALUES ('DNM01','Dép Da Nam Bitis','','Dép Da Nam Bitis là biểu tượng của sự sang trọng và đẳng cấp. Với chất liệu da cao cấp và thiết kế đơn giản nhưng tinh tế, đôi dép này tạo nên vẻ ngoài lịch lãm và thanh lịch cho phong cách của bạn. Đế dép êm ái và bền bỉ giúp bạn cảm thấy thoải mái và tự tin trong mọi bước đi. Thiết kế đa dạng màu sắc và kiểu dáng phù hợp với nhiều hoàn cảnh khác nhau từ đi làm đến dự tiệc. Dép Da Nam Bitis là sự lựa chọn hoàn hảo cho những người đàn ông muốn thể hiện sự lịch lãm và đẳng cấp trong mọi dịp.',1120000,'DNM',14,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DNM01.webp?alt=media&token=2e6184c4-47cd-4681-b4ac-0ce33b8b343e');
               
               INSERT INTO "Products" VALUES ('DNM02','Dép Thông Dụng Si Đế TPR Nam Bitis','','DÉP THÔNG DỤNG SI ĐẾ TPR NAM BITIS là lựa chọn tuyệt vời cho sự thoải mái và tiện ích hàng ngày. Với thiết kế đơn giản và chất liệu cao su, đôi dép này mang lại cảm giác thoải mái và linh hoạt cho đôi chân của bạn. Đế dép bền bỉ và không trơn trượt giúp bạn tự tin di chuyển trên mọi bề mặt. Thiết kế hiện đại và tiện dụng, phù hợp với nhiều hoàn cảnh từ dạo phố đến đi biển.
               ',1800000,'DNM',19,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DNM02.jpg?alt=media&token=02ab69f7-409f-4d6e-871e-b89c92dfd1bf');
               
               INSERT INTO "Products" VALUES ('DNM03','DÉP NAM ĐÔNG HẢI QUAI NGANG CÁCH ĐIỆU ĐAN CHÉO','','DÉP NAM ĐÔNG HẢI QUAI NGANG CÁCH ĐIỆU ĐAN CHÉO là sự kết hợp tinh tế giữa phong cách cá nhân và sự thoải mái. Với thiết kế quai ngang đan chéo độc đáo, đôi dép này tạo điểm nhấn độc đáo cho phong cách của bạn. Chất liệu cao su và đế dép chắc chắn, mang lại sự thoải mái và ổn định cho mỗi bước di chuyển.',950000,'DNM',16,'Đông Hải',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DNM03.jpg?alt=media&token=a5ecf483-655d-4e6c-bb50-16a2831810a3');
               
               INSERT INTO "Products" VALUES ('DNM04','DÉP NAM ĐÔNG HẢI QUAI NGANG CUT-OUT CÁCH ĐIỆU','','DÉP NAM ĐÔNG HẢI QUAI NGANG CUT-OUT CÁCH ĐIỆU là biểu tượng của sự hiện đại và phong cách. Với thiết kế quai ngang cut-out độc đáo, đôi dép này tạo ra sự thoải mái và năng động cho người mang. Chất liệu cao su và đế dép chắc chắn, giúp bạn tự tin và thoải mái trong mọi hoàn cảnh.',1700000,'DNM',22,'Đông Hải',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DNM04.webp?alt=media&token=d78163f5-daa4-42b0-9965-7c334e978a58');
               
               INSERT INTO "Products" VALUES ('DNM05','DÉP QUAI NGANG ĐÔNG HẢI CHẦN CHỈ THỜI TRANG','','DÉP QUAI NGANG ĐÔNG HẢI CHẦN CHỈ THỜI TRANG là sự kết hợp độc đáo giữa phong cách và sự thoải mái. Với thiết kế quai ngang đơn giản nhưng tinh tế, đôi dép này phản ánh gu thẩm mỹ và cá tính của bạn. Chất liệu cao su và đế dép chắc chắn, giúp bạn tự tin bước đi trên mọi nẻo đường',1300000,'DNM',30,'Đông Hải',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DNM05.jpg?alt=media&token=d35e3edb-7067-4afc-80ec-30e936973407');

               INSERT INTO "Products" VALUES ('GTN01','Giày Thể Thao Nữ Gosto','','Giày Thể Thao Nữ Gosto là sự lựa chọn hoàn hảo cho phong cách thể thao năng động và cá tính. Với thiết kế hiện đại và chất liệu cao cấp, đôi giày này mang lại sự thoải mái và linh hoạt cho đôi chân trong mọi hoạt động. Đế giày chắc chắn và êm ái giúp bạn tự tin vượt qua mọi thách thức. Thiết kế đa dạng màu sắc và phối màu sắc tinh tế làm nổi bật phong cách riêng của bạn, từ sân tập đến phố phường.',1250000,'GTN',18,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTN01.webp?alt=media&token=a770e58e-abe4-46b0-8035-57732c118631');
               
               INSERT INTO "Products" VALUES ('GTN02','Giày Thông Dụng Nữ Bitis','','Giày Thông Dụng Nữ Bitis là sự kết hợp hoàn hảo giữa phong cách và sự thoải mái. Với thiết kế đơn giản nhưng tinh tế, đôi giày này phản ánh phong cách thời trang của người mang. Chất liệu cao cấp và đế giày êm ái giúp bạn tự tin và thoải mái suốt cả ngày dài. Thiết kế đa dạng màu sắc và kiểu dáng phù hợp với nhiều phong cách thời trang và hoàn cảnh khác nhau.',980000,'GTN',16,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTN02.webp?alt=media&token=4a99470f-f582-46a4-825a-68dcfe9f50c4');
               
               INSERT INTO "Products" VALUES ('GTN03','Giày Thể Thao Nữ Bitis Êmbrace','','Giày Thể Thao Nữ Bitis Êmbrace là biểu tượng của sự thoải mái và phong cách. Với thiết kế êm ái và chất liệu cao cấp, đôi giày này mang lại cảm giác thoải mái và tự tin cho đôi chân của bạn. Đế giày êm ái và chắc chắn giúp bạn vận động linh hoạt trong mọi hoạt động thể thao. Thiết kế hiện đại và phong cách làm nổi bật phong cách thể thao của bạn, từ sân tập đến dạo phố.',1150000,'GTN',24,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTN03.jpg?alt=media&token=c7b8a7e6-8a4a-4e22-9ed1-73680a8a85f5');
               
               INSERT INTO "Products" VALUES ('GTN04','Giày Thể Thao Kháng Khuẩn','','Giày Thể Thao Kháng Khuẩn là sự lựa chọn hoàn hảo cho sức khỏe và tính thời trang. Với công nghệ kháng khuẩn tích hợp, đôi giày này giúp ngăn ngừa sự phát triển của vi khuẩn và mùi hôi, mang lại cảm giác thoải mái và sạch sẽ cho đôi chân suốt cả ngày. Thiết kế hiện đại và trẻ trung phù hợp với nhiều hoạt động thể thao và dạo phố, làm tôn lên phong cách thời trang của bạn.',1450000,'GTN',14,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTN04.jpg?alt=media&token=c2101520-efa1-45c4-bf2c-ae8419a2fc5d');
               
               INSERT INTO "Products" VALUES ('GTN05','Giày Thể Thao Êm Chân Siêu Nhẹ','','Giày Thể Thao Êm Chân Siêu Nhẹ là sự kết hợp tinh tế giữa tính năng và phong cách. Với thiết kế siêu nhẹ và đế giày linh hoạt, đôi giày này mang lại sự thoải mái và linh hoạt cho đôi chân của bạn. Chất liệu cao cấp và đường may chắc chắn giúp giày bền bỉ theo thời gian. Thiết kế trẻ trung và hiện đại phù hợp với nhiều hoạt động thể thao và dạo phố, làm nổi bật phong cách của bạn.',950000,'GTN',22,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GTN05.jpg?alt=media&token=166b87a9-816c-43ef-8ecc-6c9a6ba91b38');

               INSERT INTO "Products" VALUES ('GDB01','Giày Đế Bằng Thời Trang Nữ Hiệu Exull','','Giày Đế Bằng Thời Trang Nữ Hiệu Exull là biểu tượng của sự thanh lịch và sang trọng. Với thiết kế đế bằng và phần trên thời trang, đôi giày này tạo nên vẻ ngoài lịch lãm và tinh tế cho phong cách của bạn. Chất liệu cao cấp và đường may tỉ mỉ, giúp giày trở nên bền bỉ và đẳng cấp. Thiết kế đa dạng màu sắc và kiểu dáng phù hợp với nhiều trang phục và hoàn cảnh khác nhau. Giày Đế Bằng Thời Trang Nữ Hiệu Exull là sự lựa chọn hoàn hảo cho những người phụ nữ muốn thể hiện phong cách và đẳng cấp trong mọi dịp.',1350000,'GDB',26,'Exull Mode',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GDB01.jpg?alt=media&token=6c53b9e4-ab26-468a-97ca-cd78ee71240c');
               
               INSERT INTO "Products" VALUES ('GDB02','Giày Sling Back Đế Vuông Nữ Exull','','Giày Sling Back Đế Vuông Nữ Exull là sự kết hợp hoàn hảo giữa phong cách và thoải mái. Với thiết kế sling back và đế vuông, đôi giày này mang lại sự ổn định và thoải mái cho đôi chân của bạn. Chất liệu cao cấp và đường may tỉ mỉ giúp giày trở nên bền bỉ và đẳng cấp. Thiết kế trẻ trung và thời thượng phù hợp với nhiều trang phục và hoàn cảnh khác nhau, từ công việc đến dạo phố.',1120000,'GDB',19,'Exull Mode',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GDB02.webp?alt=media&token=95979887-d2d1-4ff5-99d6-fec5974b9f39');
               
               INSERT INTO "Products" VALUES ('GDB03','Giày Loafer Đế Bằng Thời Trang','','Giày Loafer Đế Bằng Thời Trang là biểu tượng của sự thanh lịch và sang trọng. Với thiết kế đế bằng và phần trên thời trang, đôi giày này tạo nên vẻ ngoài lịch lãm và đẳng cấp cho phong cách của bạn. Chất liệu cao cấp và đường may tỉ mỉ, giúp giày trở nên bền bỉ và đẳng cấp. Thiết kế đa dạng màu sắc và kiểu dáng phù hợp với nhiều trang phục và hoàn cảnh khác nhau, từ công sở đến dạo phố.',1200000,'GDB',16,'Exull Mode',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GDB03.webp?alt=media&token=5aa2eb9f-ec04-4bce-8cca-4bc6403f58ea');
               
               INSERT INTO "Products" VALUES ('GDB04','Giày Búp Bê Mũi Nhọn','','Giày Búp Bê Mũi Nhọn là sự lựa chọn tối ưu cho phong cách nữ tính và thanh lịch. Với thiết kế mũi nhọn và phần trên dập vân da, đôi giày này tạo nên vẻ đẹp tinh tế và lôi cuốn cho người mang. Chất liệu cao cấp và đường may chắc chắn giúp giày trở nên bền bỉ và đẳng cấp. Thiết kế đa dạng màu sắc và kiểu dáng phù hợp với nhiều phong cách thời trang và hoàn cảnh khác nhau, từ công việc đến dự tiệc.',1250000,'GDB',30,'Exull Mode',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GDB04.jpg?alt=media&token=72898bcb-4ee9-4241-899b-ca3c805dc469');
               
               INSERT INTO "Products" VALUES ('GDB05','Giày Sục Đế Bằng Exull','','Giày Sục Đế Bằng Exull là sự lựa chọn hoàn hảo cho sự thoải mái và tiện ích hàng ngày. Với thiết kế đế bằng và dây đai êm ái, đôi giày này mang lại sự thoải mái và linh hoạt cho đôi chân của bạn. Chất liệu cao su mềm mại và đế giày chắc chắn giúp bạn tự tin di chuyển trong mọi hoàn cảnh. Thiết kế đơn giản nhưng hiện đại phù hợp với nhiều hoạt động từ nghỉ ngơi đến dạo phố.',980000,'GDB',22,'Exull Mode',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GDB05.webp?alt=media&token=193d92c9-0f35-48d9-9ac6-ebd57ff521db');

               INSERT INTO "Products" VALUES ('GCG01','Giày Bít Mũi Nhọn Stiletto Heel','','Giày Bít Mũi Nhọn Stiletto Heel là biểu tượng của sự quyến rũ và sang trọng. Với thiết kế mũi nhọn và gót cao Stiletto, đôi giày này tạo nên vẻ đẹp tinh tế và thu hút cho người mang. Chất liệu da cao cấp và đường may tỉ mỉ giúp giày trở nên bền bỉ và đẳng cấp. Thiết kế đa dạng màu sắc và kiểu dáng phù hợp với nhiều trang phục và dịp khác nhau, từ buổi tiệc đến công việc.',1150000,'GCG',15,'Vascara',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GCG01.jpeg?alt=media&token=eb511583-0f46-4f7c-9243-54971986a12a');
               
               INSERT INTO "Products" VALUES ('GCG02','Giày Cao Gót Gót Trụ Phối Khoá','','Giày Cao Gót Gót Trụ Phối Khoá là sự kết hợp hoàn hảo giữa phong cách và sự thoải mái. Với thiết kế gót trụ và khoá phối, đôi giày này mang lại sự ổn định và tự tin cho đôi chân của bạn. Chất liệu cao cấp và đế giày êm ái giúp bạn vận động linh hoạt trong mọi dịp. Thiết kế sang trọng và quý phái phù hợp với các buổi tiệc hoặc sự kiện đặc biệt.',1450000,'GCG',28,'Juno',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GCG02.webp?alt=media&token=5a3ec229-19ff-454c-ac77-7c3ad1cc885c');
               
               INSERT INTO "Products" VALUES ('GCG03','Giày Cao Gót Khoá Trang Trí Kim Loại','','Giày cao gót khóa trang trí kim loại là một trong những xu hướng thời trang hot nhất hiện nay. Thiết kế giày với phần khóa trang trí kim loại sang trọng, tinh tế, mang đến vẻ đẹp thời thượng cho người mang.
               ',1400000,'GCG',21,'Juno',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GCG03.jpg?alt=media&token=648ee059-4d4d-48a6-9162-104aaa6e94de');
               
               INSERT INTO "Products" VALUES ('GCG04','Giày Cao Gót Pump Mũi Nhọn Gót Thanh','','Giày cao gót pump mũi nhọn gót thanh là một lựa chọn hoàn hảo cho những cô nàng yêu thích phong cách thanh lịch, quyến rũ. Thiết kế giày với phần mũi nhọn và gót thanh giúp tôn dáng hiệu quả, giúp bạn trở nên thon gọn và cao ráo hơn.',1050000,'GCG',22,'Juno',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GCG04.jpg?alt=media&token=db5cf1ba-19da-463e-9cec-0a96fe29e412');
               
               INSERT INTO "Products" VALUES ('GCG05','Giày Cao Gót Bít Mũi Gót Thanh','','Giày cao gót bít mũi gót thanh là một món đồ thời trang không thể thiếu trong tủ đồ của mọi cô nàng. Thiết kế giày với phần mũi bít và gót thanh giúp bảo vệ đôi chân khỏi bụi bẩn và tạo cảm giác thoải mái khi di chuyển.
               ',1550000,'GCG',15,'Juno',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/GCG05.webp?alt=media&token=4133c433-7d57-410d-8839-736afe59653e');

               INSERT INTO "Products" VALUES ('SDN01','Sandal Thời Trang Nữ Bitis','','Sandal Thời Trang Nữ Bitis là sự kết hợp tinh tế giữa phong cách và thoải mái. Với thiết kế đơn giản nhưng đẳng cấp, đôi sandal này là điểm nhấn hoàn hảo cho bất kỳ trang phục nào. Chất liệu cao cấp và đế êm ái giúp bạn thoải mái di chuyển trong suốt ngày dài. Thiết kế trẻ trung và thời thượng, phù hợp với nhiều dịp khác nhau từ đi làm đến dạo phố.',1280000,'SDN',13,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/SDN01.webp?alt=media&token=836701fe-7611-4fce-82b6-5635e422a7f1');
               
               INSERT INTO "Products" VALUES ('SDN02','Giày Sandal Mũi Vuông Gót Si Hiệu Ứng Aluminium','','Giày Sandal Mũi Vuông Gót Si Hiệu Ứng Aluminium là biểu tượng của sự độc đáo và sang trọng. Với thiết kế mũi vuông và gót siêu cao, đôi giày này tạo nên vẻ đẹp đặc biệt và cuốn hút cho người mang. Chất liệu da cao cấp và kiểu dáng hiện đại, giúp giày trở nên bền bỉ và đẳng cấp. Thiết kế độc đáo và quyến rũ, làm nổi bật phong cách cá nhân và sự tự tin của bạn.',930000,'SDN',19,'Vascara',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/SDN02.jpg?alt=media&token=a8236a29-672d-4135-b2b0-9f505ea78a38');
               
               INSERT INTO "Products" VALUES ('SDN03','Sandal Strappy Quai Phồng','','Sandal Strappy Quai Phồng là sự kết hợp độc đáo giữa phong cách và thoải mái. Với thiết kế quai phồng và đế êm ái, đôi sandal này mang lại sự thoải mái và nữ tính cho đôi chân của bạn. Chất liệu cao cấp và kiểu dáng thời trang giúp bạn tự tin diện sandal này trong mọi dịp từ dạo phố đến dự tiệc. Thiết kế đa dạng màu sắc và kiểu dáng, phù hợp với nhiều phong cách thời trang và cá nhân.',1320000,'SDN',19,'Vascara',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/SDN03.jpg?alt=media&token=822721ec-2c2c-4b7b-b8e6-9c7b94ce7a76');
               
               INSERT INTO "Products" VALUES ('SDN04','Sandal Si Cao Su Nữ Bitis','','Sandal Si Cao Su Nữ Bitis là sự lựa chọn đáng tin cậy cho sự thoải mái và tiện ích hàng ngày. Với chất liệu cao su mềm mại và thiết kế đơn giản, đôi sandal này mang lại cảm giác thoải mái và linh hoạt cho đôi chân của bạn. Đế giày chắc chắn và không trơn trượt giúp bạn tự tin di chuyển trên mọi bề mặt. Thiết kế tối giản nhưng thời trang phù hợp với nhiều hoàn cảnh từ đi học đến dạo phố.',1180000,'SDN',16,'Bitis',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/SDN04.webp?alt=media&token=87866d55-0d05-481d-a25d-6c9ef0ecec77');
               
               INSERT INTO "Products" VALUES ('SDN05','Giày Sandal Đế Chunky Phối Vân Da Kỳ Đà','','Giày Sandal Đế Chunky Phối Vân Da Kỳ Đà là sự kết hợp độc đáo giữa phong cách và thoải mái. Với thiết kế đế chunky và vân da kỳ đà, đôi sandal này là điểm nhấn thú vị cho bất kỳ trang phục nào. Chất liệu cao cấp và đế êm ái giúp bạn thoải mái di chuyển suốt cả ngày dài. Thiết kế độc đáo và thời trang, phù hợp với nhiều dịp từ dạo phố đến dự tiệc.',1500000,'SDN',24,'Balo Mini Nhấn Túi Phụ Vân Da Kỳ Đ',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/SDN05.jpg?alt=media&token=a23559b8-72c7-4ab9-9954-83f1d31b5c91');

               INSERT INTO "Products" VALUES ('DNN01','DÉP XUỒNG ZUCIA ĐẾ GIẢ GỖ QUAI THỜI TRANG','','DÉP XUỒNG ZUCIA ĐẾ GIẢ GỖ QUAI THỜI TRANG là biểu tượng của sự độc đáo và phong cách. Với thiết kế đế giả gỗ và quai đan chéo, đôi dép này tạo nên vẻ ngoài tự nhiên và hiện đại cho đôi chân của bạn. Chất liệu cao su mềm mại và kiểu dáng thời trang giúp bạn tự tin diện dép này trong mọi dịp từ đi học đến đi chơi. Thiết kế đa dạng màu sắc và kiểu dáng, phù hợp với nhiều phong cách thời trang và cá nhân.',1420000,'DNN',30,'Đông Hải',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DNN01.jpg?alt=media&token=9567a5f9-274d-447b-91db-4834f3da789b');
               
               INSERT INTO "Products" VALUES ('DNN02','DÉP NỮ ZUCIA QUAI CÁCH ĐIỆU CUT-OUT','','DÉP NỮ ZUCIA QUAI CÁCH ĐIỆU CUT-OUT là biểu tượng của sự nữ tính và thời trang. Với thiết kế quai cut-out độc đáo, đôi dép này tạo nên sự nổi bật và cuốn hút cho bất kỳ trang phục nào. Chất liệu cao su mềm mại và đế dép êm ái giúp bạn thoải mái di chuyển trong mọi hoàn cảnh. Thiết kế thanh lịch và trẻ trung, phù hợp với nhiều dịp từ đi biển đến dạo phố.',990000,'DNN',22,'Đông Hải',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DNN02.jpg?alt=media&token=fa8693fc-119b-45b8-b815-82ff94fa818c');
               
               INSERT INTO "Products" VALUES ('DNN03','DÉP NỮ ZUCIA DA MỀM HỌA TIẾT ĐAN CHÉO','','DÉP NỮ ZUCIA DA MỀM HỌA TIẾT ĐAN CHÉO là sự lựa chọn hoàn hảo cho phong cách cá nhân và thoải mái. Với thiết kế đan chéo độc đáo và họa tiết trang trí, đôi dép này tạo nên sự thu hút và phong cách cho người mang. Chất liệu da mềm mại và đế dép chắc chắn giúp bạn tự tin di chuyển trong mọi dịp từ đi chơi đến dự tiệc. Thiết kế đa dạng màu sắc và kiểu dáng, phù hợp với nhiều phong cách thời trang và cá nhân.',1030000,'DNN',82,'Đông Hải',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DNN03.jpg?alt=media&token=af04ea40-b416-4238-a4b3-bf5174db82bf');
               
               INSERT INTO "Products" VALUES ('DNN04','DÉP NỮ ZUCIA KHÓA TRÒN GIẢ GỖ THỜI TRANG','','DÉP NỮ ZUCIA KHÓA TRÒN GIẢ GỖ THỜI TRANG là biểu tượng của sự thanh lịch và độc đáo. Với thiết kế khóa tròn giả gỗ và phần trên thời trang, đôi dép này là điểm nhấn đặc biệt cho phong cách của bạn. Chất liệu cao su mềm mại và kiểu dáng thời trang giúp bạn tự tin và thoải mái suốt cả ngày dài. Thiết kế đơn giản nhưng đầy cá tính, phù hợp với nhiều dịp từ đi học đến dạo phố.',1100000,'DNN',16,'Đông Hải',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DNN04.jpg?alt=media&token=576086f1-1744-4771-a210-04019786c9a2');
               
               INSERT INTO "Products" VALUES ('DNN05','DÉP XUỒNG NỮ QUAI DÂY BẢNG NGANG','','DÉP XUỒNG NỮ QUAI DÂY BẢNG NGANG là sự kết hợp hoàn hảo giữa phong cách và thoải mái. Với thiết kế quai dây ngang và kiểu dáng đơn giản, đôi dép này mang lại sự thoải mái và linh hoạt cho đôi chân của bạn. Chất liệu cao su mềm mại và đế dép chắc chắn giúp bạn tự tin di chuyển trong mọi hoàn cảnh. Thiết kế trẻ trung và thời thượng, phù hợp với nhiều trang phục và hoàn cảnh khác nhau từ đi biển đến dạo phố.',1210000,'DNN',30,'Đông Hải',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DNN05.jpg?alt=media&token=312fbac3-9064-4166-a215-21f84f5368f8');

               INSERT INTO "Products" VALUES ('BLN01','Túi Đeo Chéo Style Mạnh Mẽ, Phong Cách Cực Chất BANGE GEKMAN','','Túi Đeo Chéo Style Mạnh Mẽ, Phong Cách Cực Chất BANGE GEKMAN là biểu tượng của sự lịch lãm và tiện ích. Với thiết kế đơn giản nhưng cá tính, túi đeo chéo này là phụ kiện không thể thiếu cho phong cách thời trang của bạn. Chất liệu chắc chắn và kiểu dáng đa năng giúp bạn tự tin và thoải mái mang theo mọi ngày dài. Thiết kế sang trọng và hiện đại, phù hợp với nhiều dịp từ đi làm đến dạo phố.',1210000,'BLN',30,'Big Bag',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/47.jpg?alt=media&token=f9058be4-7793-4c0a-baba-a6a34a312f2b');
               
               INSERT INTO "Products" VALUES ('BLN02','Balo Du Lịch Cao Cấp, Sức Chứa Khủng Hơn Vali','','Balo Du Lịch Cao Cấp, Sức Chứa Khủng Hơn Vali là sự lựa chọn hoàn hảo cho những chuyến du lịch dài ngày. Với thiết kế sang trọng và sức chứa rộng rãi, balo này là người bạn đồng hành đáng tin cậy cho mọi cuộc phiêu lưu. Chất liệu cao cấp và các ngăn chứa thông minh giúp bạn tổ chức hành lý một cách hiệu quả. Thiết kế tiện lợi và bền bỉ, phù hợp với mọi loại hành trình và hoàn cảnh.',1210000,'BLN',30,'Big Bag',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/48.jpg?alt=media&token=2a13fba0-fcb9-4059-9bd2-99bb921a753f');
               
               INSERT INTO "Products" VALUES ('BLN03','Balo Đa Năng Cao Cấp, Thiết Kế Siêu Thông Minh','','Balo Đa Năng Cao Cấp, Thiết Kế Siêu Thông Minh ROKIN MASTER là sự kết hợp hoàn hảo giữa tiện ích và phong cách. Với thiết kế thông minh và các ngăn chứa linh hoạt, balo này là người bạn đồng hành hoàn hảo cho mọi hoạt động từ đi học đến du lịch. Chất liệu cao cấp và đường may tỉ mỉ giúp balo trở nên bền bỉ và đẳng cấp. Thiết kế hiện đại và trẻ trung, phù hợp với nhiều đối tượng và phong cách thời trang.',1210000,'BLN',51,'Big Bag',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/49.jpg?alt=media&token=f3dfab45-b38d-46de-bc41-dadb9d0e0eeb');
               
               INSERT INTO "Products" VALUES ('BLN04','Balo Đa Năng Cao Cấp ROKIN MASTER','','Balo đa năng cao cấp ROKIN MASTER là một sản phẩm thời trang cao cấp, được làm từ chất liệu da PU cao cấp, bền đẹp. Balo có thiết kế đa năng, với nhiều ngăn đựng tiện lợi, giúp bạn dễ dàng sắp xếp đồ đạc.',1210000,'BLN',50,'Big Bag',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/50.jpg?alt=media&token=f0a6271f-e6fd-469e-bd10-58846057b5b2');
               
               INSERT INTO "Products" VALUES ('BLN05','Balo Laptop Cao Cấp, Style Cực Chất Sành Điệu BANGE GRANDE','','Balo Laptop Cao Cấp, Style Cực Chất Sành Điệu BANGE GRANDE là sự lựa chọn hoàn hảo cho công việc và du lịch. Với thiết kế sang trọng và sức chứa rộng rãi, balo này giúp bạn tổ chức công việc một cách hiệu quả và thoải mái di chuyển. Chất liệu cao cấp và đường may chắc chắn giúp balo bền bỉ theo thời gian. Thiết kế thời trang và tiện ích, phù hợp với nhiều đối tượng và hoàn cảnh sử dụng.',1210000,'BLN',32,'Big Bag',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/51.jpg?alt=media&token=c526064e-2eb1-493f-a88b-7f22cbbd9c1b');
               
               INSERT INTO "Products" VALUES ('BLN06','Balo Chống Trộm, Thiết Kế Đẳng Cấp MARK RYDEN DELTA','','Balo Chống Trộm, Thiết Kế Đẳng Cấp MARK RYDEN DELTA là sự kết hợp độc đáo giữa an toàn và phong cách. Với công nghệ chống trộm tiên tiến và thiết kế thông minh, balo này giữ an toàn cho các vật dụng cá nhân của bạn trong mọi hoàn cảnh. Chất liệu cao cấp và kiểu dáng thời trang giúp balo trở nên bền bỉ và đẳng cấp. Thiết kế đa năng và tiện lợi, phù hợp với nhiều đối tượng và hoàn cảnh sử dụng.',1210000,'BLN',42,'Big Bag',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/52.jpg?alt=media&token=4e8c6960-1b0a-424e-988a-22144f1ff1f2');            

               INSERT INTO "Products" VALUES ('TTN01','Túi Georges Tote MM','','Túi Georges Tote MM là biểu tượng của sự sang trọng và tiện ích. Với thiết kế rộng rãi và nhiều ngăn chứa, túi này là người bạn đồng hành hoàn hảo cho mọi ngày đi làm hay dạo phố. Chất liệu da cao cấp và đường may tỉ mỉ giúp túi trở nên bền bỉ và đẳng cấp. Thiết kế đơn giản nhưng tinh tế, phù hợp với nhiều phong cách thời trang và hoàn cảnh sử dụng.',1210000,'TTN',27,'Louis Vuitton',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/TTN01.png?alt=media&token=98fbfe24-810e-4490-b7e3-7272fd2ac417');
               
               INSERT INTO "Products" VALUES ('TTN02','Túi Shopper Bag MM','','Túi Shopper Bag MM là sự lựa chọn thông minh và thời trang cho phụ nữ hiện đại. Với thiết kế rộng rãi và phong cách, túi này không chỉ giúp bạn mang theo nhiều vật dụng một cách tiện lợi mà còn tôn lên phong cách của bạn. Chất liệu cao cấp và đường may chắc chắn giúp túi trở nên bền bỉ theo thời gian. Thiết kế đa dạng màu sắc và kiểu dáng, phù hợp với nhiều hoàn cảnh và phong cách.',1210000,'TTN',29,'Louis Vuitton',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/TTN02.jpg?alt=media&token=432a414c-5eb6-4acf-8a8e-d09afe3292c7');
               
               INSERT INTO "Products" VALUES ('TTN03','PEDRO - Túi Tote Nam Form Vuông Thời Trang','','PEDRO - Túi Tote Nam Form Vuông Thời Trang là biểu tượng của sự lịch lãm và tiện ích. Với thiết kế form vuông và sang trọng, túi này là điểm nhấn hoàn hảo cho phong cách của bạn. Chất liệu da cao cấp và kiểu dáng đẳng cấp giúp túi trở nên bền bỉ và đa dạng. Thiết kế tiện ích và thời trang, phù hợp với nhiều hoàn cảnh từ công việc đến cuộc hẹn cuối tuần.',1210000,'TTN',24,'Masion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/TTN03.jpg?alt=media&token=787c2984-f207-4b6f-8725-312961043a7b');
               
               INSERT INTO "Products" VALUES ('TTN04','MLB - Túi Tote Unisex Chữ Nhật Canvas Vertical','','MLB - Túi Tote Unisex Chữ Nhật Canvas Vertical là sự kết hợp tinh tế giữa phong cách và tiện ích. Với thiết kế chữ nhật và chất liệu canvas bền bỉ, túi này là lựa chọn hoàn hảo cho cả nam và nữ. Được trang bị nhiều ngăn chứa, túi tote này giúp bạn tổ chức các vật dụng một cách hiệu quả. Thiết kế đơn giản nhưng phong cách, phù hợp với nhiều hoàn cảnh và phong cách thời trang.

               ',1210000,'TTN',28,'Masion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/TTN04.jpg?alt=media&token=f0486418-45ca-4c8c-81b0-72cab73c27ed');
               
               INSERT INTO "Products" VALUES ('TTN05','Túi Tote Nam Form Chữ Nhật Recycled Leather','','Túi Tote Nam Form Chữ Nhật Recycled Leather là biểu tượng của sự tiện ích và bảo vệ môi trường. Với thiết kế chữ nhật và sử dụng da tái chế, túi này không chỉ giúp bạn mang theo nhiều vật dụng một cách tiện lợi mà còn là sự đóng góp vào việc bảo vệ môi trường. Chất liệu cao cấp và kiểu dáng đơn giản nhưng lịch lãm, phù hợp với nhiều hoàn cảnh và phong cách.             ',1210000,'TTN',20,'Masion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/TTN05.jpg?alt=media&token=164f2c7f-f87a-4eb8-96f6-007609b6b42d');

               INSERT INTO "Products" VALUES ('TDC01','Túi Đeo Chéo Ngang MIKKOR THE FELIX','','Túi đeo chéo ngang MIKKOR THE FELIX là một sản phẩm thời trang đến từ thương hiệu Việt Nam. Túi được làm từ chất liệu da PU cao cấp, bền đẹp, với thiết kế trẻ trung, năng động.',1210000,'TDC',35,'Big Bag',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/TDC01.webp?alt=media&token=28c56408-7144-406d-9065-2dd462e3ab7c');
               
               INSERT INTO "Products" VALUES ('TDC02','Túi Đeo Chéo Thiết Kế Tối Giản MARK RYDEN SECRET','','Túi đeo chéo thiết kế tối giản MARK RYDEN SECRET là một sản phẩm thời trang đến từ thương hiệu Việt Nam. Túi được làm từ chất liệu da PU cao cấp, bền đẹp, với thiết kế tối giản, sang trọng.',1210000,'TDC',31,'Big Bag',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/TDC02.webp?alt=media&token=48c285f8-af13-4846-b635-3fc8c10ea6c7');
               
               INSERT INTO "Products" VALUES ('TDC03','Túi Đeo Chéo Mini, Thiết kế Siêu Gọn & Nhẹ MARK RYDEN AIR','','Túi đeo chéo mini, thiết kế siêu gọn & nhẹ MARK RYDEN AIR là một sản phẩm thời trang đến từ thương hiệu Việt Nam. Túi được làm từ chất liệu da PU cao cấp, bền đẹp, với thiết kế nhỏ gọn, tiện lợi.',1210000,'TDC',52,'Big Bag',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/TDC03.webp?alt=media&token=23ee5d6d-1433-48be-870a-61893323eab8');
               
               INSERT INTO "Products" VALUES ('TDC04','Túi Đeo Chéo Tối Giản, Thiết Kế Nhỏ Gọn','','Túi đeo chéo tối giản, thiết kế nhỏ gọn là một sản phẩm thời trang đến từ thương hiệu Việt Nam. Túi được làm từ chất liệu da PU cao cấp, bền đẹp, với thiết kế tối giản, trẻ trung.
               ',1210000,'TDC',56,'Big Bag',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/TDC04.webp?alt=media&token=a89542fd-a876-4701-8375-0fd13f34a503');
               
               INSERT INTO "Products" VALUES ('TDC05','Túi Đeo Chéo Đơn Giản, Nhỏ Gọn','','Túi đeo chéo đơn giản, nhỏ gọn là một sản phẩm thời trang đến từ thương hiệu Việt Nam. Túi được làm từ chất liệu da PU cao cấp, bền đẹp, với thiết kế đơn giản, tiện lợi.',1210000,'TDC',24,'Big Bag',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/TDC05.webp?alt=media&token=f7c87a32-6c5c-47d1-9e7c-46b498c8af78');

               INSERT INTO "Products" VALUES ('BVM01','Ví Mini Leo De Gol','','Ví Mini Leo De Gol là một phụ kiện thời trang và tiện ích dành cho những người phụ nữ yêu thích phong cách cá nhân. Với thiết kế nhỏ gọn và họa tiết leo nổi bật, chiếc ví này tạo điểm nhấn cho bất kỳ bộ trang phục nào. Chất liệu cao cấp và đường may tỉ mỉ đảm bảo tính bền bỉ và đẳng cấp của sản phẩm. Với ngăn chứa tiền và thẻ, ví Mini Leo De Gol giúp bạn tổ chức đồ dùng một cách ngăn nắp và tiện lợi.',1210000,'BVM',44,'Leonardo',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/53.jpg?alt=media&token=8ba83b02-915b-4605-9238-244e99c229a1');
               
               INSERT INTO "Products" VALUES ('BVM02','Ví Card Monogram Carlos','','Ví Card Monogram Carlos là sự lựa chọn hoàn hảo cho những ai cần một giải pháp nhỏ gọn để giữ thẻ tín dụng và thẻ ID. Với thiết kế monogram và chất liệu da tổng hợp cao cấp, chiếc ví này không chỉ sang trọng mà còn bền bỉ theo thời gian. Ví Card Monogram Carlos vừa vặn trong túi xách hoặc túi áo, làm cho việc di chuyển trở nên tiện lợi và dễ dàng.',1210000,'BVM',40,'Leonardo',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/54.jpg?alt=media&token=88f131b5-8ea2-4230-958a-06a137831fcd');
               
               INSERT INTO "Products" VALUES ('BVM03','Ví Card Livermore','','Ví Card Livermore là một phụ kiện thanh lịch và tiện ích cho những người muốn giữ các loại thẻ một cách gọn gàng. Với thiết kế nhỏ gọn và chất liệu da cao cấp, ví này mang lại sự đẳng cấp và tiện lợi cho người sử dụng. Với nhiều ngăn đựng thẻ, bạn có thể tổ chức và lưu trữ thẻ của mình một cách hiệu quả. Ví Card Livermore là một phụ kiện không thể thiếu trong bộ sưu tập của bạn.',1210000,'BVM',43,'Leonardo',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/55.jpg?alt=media&token=a6113041-b0e8-431b-9ffd-3f1c88170491');
               
               INSERT INTO "Products" VALUES ('BVM04','Ví Cầm Tay Nam Da Cá Sấu','','Ví Cầm Tay Nam Da Cá Sấu là biểu tượng của sự sang trọng và đẳng cấp. Sử dụng chất liệu da cá sấu cao cấp và được gia công tỉ mỉ, chiếc ví này không chỉ là một phụ kiện thời trang mà còn là biểu tượng của đẳng cấp và lịch lãm. Với nhiều ngăn và khoang đựng tiền và thẻ, ví này giúp bạn tổ chức mọi thứ một cách ngăn nắp và tiện lợi, đồng thời bảo vệ tài sản của bạn một cách an toàn.',1210000,'BVM',34,'Gento',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/56.jpg?alt=media&token=1e0069ed-ce4a-4294-9fb7-db34e50bf894');
               
               INSERT INTO "Products" VALUES ('BVM05','Ví Cầm Tay Nam Da Cá Sấu Cao Cấp Gento ','','Ví Cầm Tay Nam Da Cá Sấu Cao Cấp Gento là biểu tượng của sự sang trọng và đẳng cấp. Với chất liệu da cá sấu cao cấp và thiết kế tinh tế, chiếc ví này không chỉ là một phụ kiện tiện ích mà còn là điểm nhấn cho phong cách của bạn. Với nhiều ngăn và khoang đựng tiền và thẻ, ví này mang lại sự tiện lợi và tổ chức cho người sử dụng.',1210000,'BVM',32,'Gento',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/57.jpg?alt=media&token=0e17ceab-617e-4960-847d-59b87f76c903');

               INSERT INTO "Products" VALUES ('BAN01','Balo Mini Nhấn Túi Phụ Vân Da Kỳ Đà','','Balo Mini Nhấn Túi Phụ Vân Da Kỳ Đà là sự kết hợp hoàn hảo giữa phong cách và tiện ích. Với thiết kế nhỏ gọn nhưng rộng rãi và túi phụ vân da kỳ đà tạo điểm nhấn thời trang, chiếc balo này là lựa chọn hoàn hảo cho những chuyến đi ngắn ngày hoặc dạo phố.',1210000,'BAN',22,'Vascara',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/42.jpg?alt=media&token=71946121-da23-4423-b750-e2a4eeef728a');
               
               INSERT INTO "Products" VALUES ('BAN02','Balo Mini Nhấn Khóa Túi Hộp','','Balo Mini Nhấn Khóa Túi Hộp là sự lựa chọn phù hợp cho những người yêu thích phong cách cá nhân và thời trang. Thiết kế nhỏ gọn và khóa túi hộp tạo điểm nhấn độc đáo, chiếc balo này không chỉ tiện lợi mà còn tạo nên vẻ đẹp riêng biệt và cá tính. Được làm từ chất liệu bền bỉ, balo này đảm bảo sự thoải mái và sự đồng điệu với nhu cầu của người dùng.',1210000,'BAN',33,'Vascara',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/43.jpg?alt=media&token=63ffc3c1-5fb7-4498-b3e5-a6cfc6bb5a00');
               
               INSERT INTO "Products" VALUES ('BAN03','Ba Lô Nữ TJW Essential Backpack','','Ba Lô Nữ TJW Essential Backpack là một phần không thể thiếu trong bộ sưu tập của những người phụ nữ hiện đại. Với thiết kế đơn giản nhưng tinh tế, ba lô này mang đến sự tiện ích và phong cách cho mọi hoạt động hàng ngày. Chất liệu cao cấp và đường may tỉ mỉ giúp ba lô trở nên bền bỉ và đáng tin cậy. Với nhiều ngăn và khoang, ba lô này cung cấp không gian lớn cho việc tổ chức đồ đạc cá nhân. Dù bạn đang đi làm, đi học hay đi du lịch, ba lô TJW Essential luôn là người bạn đồng hành đáng tin cậy.',1210000,'BAN',44,'ACFC',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/44.jpg?alt=media&token=7a7af0ec-5384-4987-bd54-779f891186b7');
               
               INSERT INTO "Products" VALUES ('BAN04','Balo Nữ IM Latam Corp Backpack','','Balo Nữ IM Latam Corp Backpack là biểu tượng của phong cách thời trang và tiện ích. Với thiết kế hiện đại và trẻ trung, balo này phản ánh phong cách cá nhân và sự tự tin của người sử dụng. Chất liệu chắc chắn và đường may tỉ mỉ giúp balo trở nên bền bỉ và đáng tin cậy theo thời gian. Với nhiều ngăn và khoang, balo này mang lại sự tiện ích và tổ chức cho mọi người dùng. Cho dù bạn đang đi học, đi làm hay thậm chí đi du lịch, balo IM Latam Corp luôn là người bạn đồng hành hoàn hảo.',1210000,'BAN',55,'ACFC',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/45.jpg?alt=media&token=1e9ff3f4-9019-4168-a61f-6d8da83d689e');
               
               INSERT INTO "Products" VALUES ('BAN05','Ba Lô Nữ Ryan Travel','','Ba Lô Nữ Ryan Travel là sự kết hợp tuyệt vời giữa phong cách và tiện ích. Thiết kế đơn giản nhưng đầy phong cách, ba lô này phù hợp với nhiều hoàn cảnh sử dụng, từ đi học, đi làm đến du lịch. Chất liệu vải bền bỉ và đường may chắc chắn giúp ba lô luôn giữ được hình dáng và chất lượng tốt. Nhiều ngăn và khoang chứa đồ linh hoạt giúp bạn tổ chức đồ dùng một cách dễ dàng và tiện lợi. Với phong cách trẻ trung và hiện đại, ba lô Ryan Travel là sự lựa chọn hàng đầu của phụ nữ hiện đại.',1210000,'BAN',11,'ACFC',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/46.jpg?alt=media&token=1148f1fb-60f5-4e31-bd12-21bf2d948290');

               INSERT INTO "Products" VALUES ('VDT01','Ví Cầm Tay Top-Zip Nhiều Ngăn','','Ví Cầm Tay Top-Zip Nhiều Ngăn là một phụ kiện không thể thiếu trong bộ sưu tập của phái đẹp. Với thiết kế đơn giản nhưng tinh tế, ví này kết hợp giữa tính thực dụng và phong cách thời trang. Chất liệu da tổng hợp cao cấp và đường may tỉ mỉ tạo nên sự bền bỉ và đẳng cấp cho chiếc ví. Với nhiều ngăn và khoang đựng tiền và thẻ, ví cầm tay này giúp bạn tổ chức mọi thứ một cách ngăn nắp và tiện lợi.',1210000,'VDT',56,'Vascara',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/VDT01.jpeg?alt=media&token=a63590ac-7ee9-48f9-9675-a112d3387fff');
               
               INSERT INTO "Products" VALUES ('VDT02','Ví Cầm Tay May Chần Bông Hình Thoi','','Ví Cầm Tay May Chần Bông Hình Thoi là sự kết hợp hoàn hảo giữa vẻ đẹp cổ điển và phá cách hiện đại. Thiết kế hình thoi và chi tiết may chần bông tạo điểm nhấn độc đáo và quyến rũ cho chiếc ví. Chất liệu da tổng hợp cao cấp và đường may tỉ mỉ tạo nên sự bền bỉ và sang trọng cho sản phẩm. Với kiểu dáng trẻ trung và cá tính, ví này là phụ kiện thích hợp cho các buổi dạo phố hay dự tiệc.',1210000,'VDT',45,'Vascara',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/VDT02.jpeg?alt=media&token=369c6205-ac22-4479-9b43-f40674ef1bab');
               
               INSERT INTO "Products" VALUES ('VDT03','Ví Mini Dập Nổi Square Pattern ','','Ví Mini Dập Nổi Square Pattern là một lựa chọn thời trang và đẳng cấp cho phụ nữ hiện đại. Thiết kế nhỏ gọn và độc đáo với họa tiết dập nổi square pattern tạo nên sự thu hút và phong cách riêng biệt cho chiếc ví. Chất liệu da tổng hợp cao cấp và đường may tỉ mỉ đảm bảo tính bền bỉ và đẳng cấp của sản phẩm. Với kích thước nhỏ gọn, ví mini này dễ dàng phối hợp với nhiều trang phục và hoàn cảnh khác nhau.',1210000,'VDT',34,'Vascara',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/VDT03.jpeg?alt=media&token=6862d093-8a13-4dca-a090-471c0df2433a');
               
               INSERT INTO "Products" VALUES ('VDT04','Ví Cầm Tay Zip-Around Dập Vân Cá Sấu','','Ví Cầm Tay Zip-Around Dập Vân Cá Sấu là biểu tượng của sự sang trọng và đẳng cấp. Với chất liệu da cá sấu cao cấp và kỹ thuật dập vân tỉ mỉ, chiếc ví này không chỉ là một phụ kiện tiện ích mà còn là điểm nhấn cho phong cách của bạn. Thiết kế zip-around mang lại sự an toàn và tiện lợi cho việc sử dụng và bảo quản tiền bạc và thẻ tín dụng. Với nhiều ngăn và khoang, ví này cung cấp không gian lớn cho việc tổ chức đồ đạc cá nhân.',1210000,'VDT',23,'Vascara',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/VDT04.jpeg?alt=media&token=ec4b1790-8470-4c7f-bcd9-7e911e3c1434');

               INSERT INTO "Products" VALUES ('PKT01','Móc Khóa Nữ Hình Thú Bông Phối Lông Vũ','','Móc Khóa Nữ Hình Thú Bông Phối Lông Vũ là phụ kiện dễ thương và nổi bật cho túi xách của bạn. Thiết kế hình thú bông với lông vũ phối màu tạo điểm nhấn đáng yêu và độc đáo, làm tăng thêm vẻ cá tính cho trang phục của bạn. Chất liệu bông mềm mại và lông vũ nhẹ nhàng, tạo cảm giác dễ chịu khi sử dụng. Móc khóa này không chỉ là phụ kiện trang trí mà còn là món quà ý nghĩa để tặng người thân và bạn bè.',1210000,'PKT',12,'Masion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/PKT01.jpg?alt=media&token=c534cb8a-d6ef-41e6-86f4-d197a76dfbb3');
               
               INSERT INTO "Products" VALUES ('PKT02','Móc Khóa Nữ Hình Thú Bông Lông Xù Cute','','Móc Khóa Nữ Hình Thú Bông Lông Xù Cute là một phụ kiện đáng yêu và dễ thương cho túi xách của bạn. Thiết kế hình thú bông với lông xù mềm mại tạo ra vẻ đáng yêu và cá nhân. Móc khóa này không chỉ là một điểm nhấn trang trí mà còn là một món đồ giúp bạn dễ dàng nhận biết túi xách của mình. Với nhiều màu sắc và hình dáng khác nhau, móc khóa này là một món quà lý tưởng cho bạn bè và người thân yêu thích sự độc đáo.

               "Seiko - Nữ":',1210000,'PKT',21,'Masion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/PKT02.webp?alt=media&token=601f573a-60f5-4c2b-873b-513b902790a9');
               
               INSERT INTO "Products" VALUES ('PKT03','Dây Đeo Túi Xách Bản Rộng','','Dây Đeo Túi Xách Bản Rộng là sự lựa chọn hoàn hảo cho việc thay đổi phong cách của túi xách của bạn. Với thiết kế bản rộng và chất liệu bền bỉ, dây đeo này làm cho túi xách của bạn trở nên độc đáo và cá nhân hơn. Với độ dài điều chỉnh linh hoạt, bạn có thể dễ dàng điều chỉnh để phù hợp với sở thích và nhu cầu sử dụng của mình.',1210000,'PKT',32,'Masion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/PKT03.webp?alt=media&token=62503f9e-4721-4fb4-a2d2-0e9446097a54');
               
               INSERT INTO "Products" VALUES ('PKT04','Móc Khóa Nữ Hình Thú Bông','','Móc Khóa Nữ Hình Thú Bông là một phụ kiện dễ thương và đáng yêu cho túi xách của bạn. Với thiết kế hình thú bông đáng yêu và màu sắc tươi sáng, móc khóa này tạo điểm nhấn vui nhộn và cá nhân cho trang phục của bạn. Chất liệu bông mềm mại và bền bỉ, đảm bảo sự bền đẹp và dễ dàng vệ sinh. Móc khóa hình thú sẽ làm cho túi xách của bạn trở nên độc đáo và thu hút hơn.',1210000,'PKT',54,'Masion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/PKT04.webp?alt=media&token=24323730-709b-4a07-a36b-14712242c301');
               
               INSERT INTO "Products" VALUES ('PKT05','Dây Đeo Túi Xách Vải Bản Vừa','','Dây Đeo Túi Xách Vải Bản Vừa là một lựa chọn thay thế và phong cách cho túi xách của bạn. Với chất liệu vải bền bỉ và thiết kế đơn giản nhưng thời trang, dây đeo này mang lại sự thoải mái và tiện ích khi sử dụng. Đặc biệt, dây đeo vải bản vừa này có thể dễ dàng phối hợp với nhiều loại túi xách khác nhau, từ casual đến formal.',1210000,'PKT',34,'Masion',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/PKT05.jpg?alt=media&token=8a198242-b5ff-4968-895a-eed9a97933b5');

               INSERT INTO "Products" VALUES ('DHA01','Longines - Nam','','Dòng đồng hồ Longines dành cho nam giới là biểu tượng của sự lịch lãm và đẳng cấp. Với thiết kế tinh tế, các chiếc đồng hồ Longines thường được chế tác từ chất liệu cao cấp như thép không gỉ hoặc vàng, kết hợp với các chi tiết độc đáo và cơ chế hoạt động chính xác. Đồng hồ Longines không chỉ là phụ kiện đắc lực để đo thời gian mà còn là biểu tượng của phong cách và đẳng cấp cho phái mạnh.',1210000,'DHA',51,'Longines',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DHA01.jpg?alt=media&token=7527e9e8-521d-4ece-984b-87e9b5596547');
               
               INSERT INTO "Products" VALUES ('DHA02','Olym Pianus - Nam','','Olym Pianus là một thương hiệu đồng hồ nam nổi tiếng với thiết kế đa dạng và phong cách hiện đại. Với sự kết hợp giữa chất liệu cao cấp, công nghệ tiên tiến và kiểu dáng độc đáo, các chiếc đồng hồ Olym Pianus thường mang lại sự sang trọng và tinh tế cho người đeo. Từ các mẫu thiết kế cổ điển đến những phiên bản hiện đại, Olym Pianus luôn đáp ứng được nhu cầu và sở thích của từng quý ông.',1210000,'DHA',27,'Olym Pianus',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DHA02.webp?alt=media&token=3533620e-e40d-4837-806d-d076c5bc1d99');
               
               INSERT INTO "Products" VALUES ('DHA03','Casio - Nam','','Casio là một trong những thương hiệu đồng hồ nam phổ biến và được ưa chuộng trên toàn thế giới. Với dải sản phẩm đa dạng từ đồng hồ thể thao đến đồng hồ kinh doanh, Casio đáp ứng được nhu cầu của nhiều đối tượng khác nhau. Sự kết hợp giữa chất lượng đồng hồ và giá cả hợp lý đã làm nên sức hút đặc biệt của thương hiệu này trong lòng người tiêu dùng nam.',1210000,'DHA',26,'Casio',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DHA03.jpg?alt=media&token=0dfa4897-9ac3-4381-954c-cb260d4deaac');
               
               INSERT INTO "Products" VALUES ('DHA04','Tissot - Nam','','Tissot là một thương hiệu đồng hồ Thụy Sĩ nổi tiếng với chất lượng và thiết kế sang trọng. Dòng đồng hồ Tissot dành cho nam giới mang đến sự lựa chọn đa dạng về kiểu dáng, mẫu mã, đáp ứng mọi nhu cầu của khách hàng.
               ',1210000,'DHA',22,'Tissot',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DHA04.jpg?alt=media&token=57d74da0-c39d-4833-8a92-230af10a0d18');
               
               INSERT INTO "Products" VALUES ('DHA05','Bonest Gatti - Nam','','Bonest Gatti là thương hiệu thời trang nam cao cấp của Việt Nam. Các sản phẩm của Bonest Gatti được thiết kế với phong cách trẻ trung, năng động, mang đậm dấu ấn cá tính của người Việt.
               ',1210000,'DHA',20,'Bonest Gatti',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DHA05.webp?alt=media&token=c95c3f12-4261-4ab3-845d-a24dc85ee96e');

               INSERT INTO "Products" VALUES ('DNU01','SRWatch - Nữ','','SRWatch - Nữ là một điểm nhấn độc đáo trong thế giới đồng hồ thời trang, kết hợp giữa phong cách hiện đại và sự sang trọng. Với thiết kế tinh tế và chất lượng đáng kinh ngạc, SRWatch không chỉ là một chiếc đồng hồ mà còn là biểu tượng của phong cách và cái đẹp.

               Với vỏ được làm từ chất liệu thép không gỉ bền bỉ, mặt kính sapphire chống trầy xước và dây đeo đa dạng từ da tự nhiên đến thép không gỉ, SRWatch mang lại sự thoải mái và phong cách cho người đeo.
               
               Bên cạnh đó, tính năng chống nước và độ chính xác cao của máy cơ bền bỉ giúp SRWatch hoàn hảo cho mọi hoạt động và dịp khác nhau, từ công việc đến những buổi dạo chơi cuối tuần.
               
               Với SRWatch - Nữ, thời gian không chỉ là để đo lường mà còn là để thể hiện phong cách và cá tính riêng của bạn. Hãy để SRWatch là người bạn đồng hành đáng tin cậy của bạn trên mọi hành trình trong cuộc sống.',1210000,'DNU',37,'SRWatch',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DNU01.jpg?alt=media&token=859b566c-6ba9-47fb-b769-db32432c7ba2');
               
               INSERT INTO "Products" VALUES ('DNU02','Casio - Nữ','','Casio cũng có dòng đồng hồ dành cho phái đẹp với thiết kế nữ tính và đa dạng phong cách. Từ những mẫu đồng hồ thể thao dành cho các hoạt động ngoài trời đến những mẫu đồng hồ dây kim loại hay da thời trang, Casio luôn mang lại sự lựa chọn đa dạng và phong phú cho phụ nữ hiện đại.',1210000,'DNU',38,'Casio',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DNU02.jpg?alt=media&token=b4818520-a938-4540-b012-35ae0f5d7861');
               
               INSERT INTO "Products" VALUES ('DNU03','Tissot - Nữ','','Tissot là một trong những thương hiệu đồng hồ danh tiếng với các thiết kế tinh tế và sang trọng dành cho phụ nữ. Với sự kết hợp giữa chất liệu cao cấp, công nghệ đồng hồ tiên tiến và thiết kế độc đáo, các mẫu đồng hồ Tissot thường là biểu tượng của sự thanh lịch và quý phái. Tissot không chỉ là phụ kiện đẳng cấp mà còn là biểu tượng của thời gian và phong cách.               ',1210000,'DNU',39,'Tissot',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DNU03.png?alt=media&token=427e9332-0230-4564-851d-7e5707de0e7e');
               
               INSERT INTO "Products" VALUES ('DNU04','Seiko - Nữ','','Seiko là một trong những thương hiệu đồng hồ nữ hàng đầu trên thị trường. Với lịch sử lâu dài và uy tín, Seiko đã sản xuất ra những chiếc đồng hồ chất lượng cao với thiết kế đa dạng và độ chính xác cao. Từ các mẫu đồng hồ thể thao đến những mẫu đồng hồ dây da sang trọng, Seiko đều mang đến sự lựa chọn phong phú cho phụ nữ với mọi phong cách và sở thích.',1210000,'DNU',40,'Seiko',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DNU04.jpg?alt=media&token=dbca24f0-2d79-4482-917a-a81b321cc08a');
               
               INSERT INTO "Products" VALUES ('DNU05','Orient - Nữ','','Orient là một thương hiệu đồng hồ có tiếng trong ngành công nghiệp đồng hồ. Với chất lượng sản phẩm đáng tin cậy và thiết kế tinh tế, Orient đã thu hút sự quan tâm của nhiều phụ nữ yêu thích thời trang. Những chiếc đồng hồ Orient nữ đa dạng với nhiều phong cách khác nhau, từ cổ điển đến hiện đại, từ dây da đến dây kim loại, mang lại sự lựa chọn đa dạng và phù hợp với mọi hoàn cảnh và phong cách.',1210000,'DNU',5,'Orient',0.0,'https://firebasestorage.googleapis.com/v0/b/webproject-646b5.appspot.com/o/DNU05.jpg?alt=media&token=f033cd65-6903-48db-9afe-7c1616640565');

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
                ('username1', '$2b$10$7u5D8nN.a.ffUYmnjkrs9uiSnkKHCQK3t5M/KD1hhyaLRnMbgdFXe', false, 'example@gmail.com'),
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