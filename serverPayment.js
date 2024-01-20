require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const fs = require('fs');
const https = require('https');
const { create } = require('express-handlebars');
const socketIO = require('socket.io');

const app = express();
const hbs = create({
    extname: '.hbs',
    defaultLayout: false,
})

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', './views');

// options for https
const options = {
  key: fs.readFileSync('./key/demo.key'),
  cert: fs.readFileSync('./key/demo.crt')
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


server.listen(process.env.PORT_PAYMENT, function() {
  console.log(`Server PAYMENT started on port ${process.env.PORT_AUTH}`);
});
