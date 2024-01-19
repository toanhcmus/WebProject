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
    insertUser: async (newUser) => {
        const insertUserQuery = 'INSERT INTO "User" ("Username", "Password", "Email", "isAdmin") VALUES ($1, $2, $3, $4)';
        const insertUserValues = [newUser.username, newUser.password, newUser.email, newUser.isAdmin];
        try {
            await db.none(insertUserQuery, insertUserValues);
            console.log('User added');
        } catch (error) {
            console.log(error);
        }
    },
    checkUsernameExist: async (username) => {
        const checkUsernameExistQuery = 'SELECT "Username" FROM "User" WHERE "Username" = $1';
        const checkUsernameExistValues = [username];
        try {
            const checkUsernameExistResult = await db.oneOrNone(checkUsernameExistQuery, checkUsernameExistValues);
            return checkUsernameExistResult ? true : false;
        } catch (error) {
            console.log(error);
            return false;
        }
    },
    getUser: async (username) => {
        const getUserQuery = 'SELECT * FROM "User" WHERE "Username" = $1';
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
        const getPasswordQuery = 'SELECT "Password" FROM "User" WHERE "Username" = $1';
        const getPasswordValues = [username];
        try {
            const getPasswordResult = await db.oneOrNone(getPasswordQuery, getPasswordValues);
            return getPasswordResult ? getPasswordResult.Password : null;
        } catch (error) {
            console.log(error);
            return null;
        }
    },
}