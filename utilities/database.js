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
    timkiemTaiKhoan: async (username, password, isAdmin) => {
        const query = `SELECT * FROM "User" WHERE "Username" = $1 AND "Password" = $2 AND "isAdmin" = $3`;
        const values = [username, password, isAdmin];
        const data = await db.query(query, values);
        if (data.length > 0) {
            return true;
        }
        else return false;
    },
}