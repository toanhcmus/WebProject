const initOptions = {};
const pgp = require('pg-promise')(initOptions);

const cn = {
    host: process.env.DBHOST,
    port: process.env.DBPORT,
    database: process.env.DB_DB,
    user: process.env.DBUSER,
    password: process.env.DBPW,
    max: 30
}

const db = pgp(cn);

module.exports = db;