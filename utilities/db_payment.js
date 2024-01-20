const initOptions = {};
const pgp = require('pg-promise')(initOptions);

const cn = {
    host: process.env.DBHOST,
    port: process.env.DBPORT,
    database: process.env.DBPAY_DB,
    user: process.env.DBUSER,
    password: process.env.DBPW,
    max: 30 // use up to 30 connections
}

const db = pgp(cn);

module.exports = db;