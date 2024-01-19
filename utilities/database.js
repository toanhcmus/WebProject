require('dotenv').config();

const pgp = require('pg-promise')({
    capSQL: true
});
const cn = {
    host: process.env.DBHOST,
    port: process.env.DBPORT,
    database: process.env.DBNAME,
    user: process.env.DBUSER,
    password: process.env.DBPW,
    max: 30
};
const db = pgp(cn);

module.exports = {
    sanPhamNoiBat: async () => { 
        const data =await db.any(`SELECT * FROM "products"`);
        return data;
    },
}