require('dotenv').config();

const db = require('./connectDB');

module.exports = {
    initDatabase: async function initDatabase() {
        try {
            // Kiểm tra xem database đã tồn tại chưa
            const databaseExists = await db.oneOrNone(
                'SELECT 1 FROM pg_database WHERE datname = $1',
                process.env.DBPAY_DB
            );

            if (!databaseExists) {
                // Tạo mới database
                await db.none(`CREATE DATABASE ${process.env.DBPAY_DB}`);
                console.log(`Database ${process.env.DBPAY_DB} created.`);

                // Kết nối đến database mới tạo
                db.$pool.options.database = process.env.DBPAY_DB;
                await db.connect();

                // create table inside the new database
                await db.none(`
                /*
                Target Server Type    : PostgreSQL
                Target Server Version : 90600
                File Encoding         : 65001
               */
                    ---------CREATE TABLE PaymentAccounts
                    DROP TABLE IF EXISTS "PaymentAccounts";
                    CREATE TABLE "PaymentAccounts" (
                    "id" text NOT NULL PRIMARY KEY,
                        "balance" int4
                    )
                    ;

                    ---------CREATE TABLE PaymentHistory
                    DROP TABLE IF EXISTS "PaymentHistory";
                    CREATE TABLE "PaymentHistory" (
                        "maGiaoDich" serial NOT NULL PRIMARY KEY,
                        "id" text ,
                        "money" int4,
                        "maHoaDon" int4,
                        "TrangThai" int4, --0: Thành công, 1: Thất bại
                        "Time" timestamp
                        
                    )
                    ;

                    INSERT INTO public."PaymentAccounts" ("id", "balance") VALUES
                    ('admin', 0);
                `);

                console.log(`Tables created inside '${process.env.DBPAY_DB}' database.`);
                console.log(`Data imported into '${process.env.DBPAY_DB}' database.`);
            }
            else {
                db.$pool.options.database = process.env.DBPAY_DB;
                await db.connect();
                console.log(`Database '${process.env.DBPAY_DB}' already exists. Cannot create database.`);
            }
        }
        catch (error) {
            console.log(error);
        }
    }
}