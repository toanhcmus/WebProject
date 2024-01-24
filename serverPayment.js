require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const fs = require('fs');
const https = require('https');
const { create } = require('express-handlebars');
const cors = require('cors');

const app = express();
const hbs = create({
    extname: '.hbs',
    defaultLayout: false,
})

app.use(cors());
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', './views');

const db = require("./utilities/databasePayment");


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

db.initDatabase().then(() => {
    server.listen(process.env.PORT_PAYMENT, function() {
        console.log(`Server PAYMENT started on port https://localhost:${process.env.PORT_PAYMENT}`);
    });
}).catch(err => {
    console.error(`Failed to initialize database: ${err}`);
});

