require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const exphbs = require('express-handlebars');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const fs = require('fs/promises');
const port = process.env.PORT || 3000;

const secret = 'mysecretkey';

app.use(cookieParser(secret));
const sessionMiddleware = session({
    secret: secret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
});
app.use(sessionMiddleware);

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));

require('./mws/passport')(app);

app.engine('hbs', exphbs.engine({
    extname: '.hbs',
    layoutsDir: __dirname + '/views/layouts',
    partialsDir : __dirname + '/views/partials'
}));
app.set('view engine', 'hbs');
app.set('views', './views');
app.use('/', require('./routers/router'));

const appRouter = require('./routers/router');
app.use('/', appRouter);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

db = require('./utilities/database');
app.use((req, res, next) => {
    if (!req.session.cart) {
        req.session.cart = [];
    }
    next();
});
db.initDatabase().then(() => {
    app.listen(port, () => console.log(`example all listening at http://localhost:${port}`));
}).catch(err => {
    console.error(`Failed to initialize database: ${err}`);
});
