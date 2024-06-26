require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const fs = require('fs');
const https = require('https');
const { create } = require('express-handlebars');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require("passport");
const helpers = require('./utilities/helpers');

const app = express();

const hbs = create({
    extname: '.hbs',
    defaultLayout: false,
    helpers: helpers
});

const secret = 'paymentkey';

app.use(cookieParser(secret));
const sessionMiddleware = session({
    secret: secret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
});
app.use(sessionMiddleware);

app.use(cors());
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', './views');

// options for https
const options = {
  key: fs.readFileSync('./key/key.pem'),
  cert: fs.readFileSync('./key/cert.pem')
};

const server = https.createServer(options, app);

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static("public"));

// Routes
app.use("/", require('./routers/payment/index'));

app.get('*', function(req, res){
  res.render("404");
});

const db = require('./utilities/databasePayment');

db.initDatabase().then(() => {
  // app.listen(port, () => console.log(`example all listening at http://localhost:${port}`));
  server.listen(process.env.PORT_PAYMENT, function() {
    console.log(`Server PAYMENT started on port https://localhost:${process.env.PORT_PAYMENT}`);
    });
}).catch(err => {
  console.error(`Failed to initialize database: ${err}`);
});