require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const exphbs = require('express-handlebars');
const fs = require('fs/promises');
const port = process.env.PORT || 3000;

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));

app.engine('hbs', exphbs.engine({ extname: ".hbs" }));
app.set('view engine', 'hbs');
app.set('views', './views');
app.use('/', require('./routers/router'));


const appRouter = require('./routers/router');
app.use('/', appRouter);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(port, () => console.log(`example all listening on port ${port}`));