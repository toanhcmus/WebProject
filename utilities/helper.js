const hbs = require('express-handlebars');
const path = require('path');
const Handlebars = require('handlebars');

function handlebars(app) {
    app.engine('hbs', hbs.engine({
        extname: '.hbs',
        layoutsDir: __dirname + '/views/layouts',
        partialsDir: __dirname + '/views/partials'
    }));
    app.set('view engine', 'hbs');
    app.set('views', './views');
    
    
    Handlebars.registerHelper('calculate', function(a,b) {
        // Trả về giá trị tăng lên một đơn vị
        return a*(1-b);
      });
}

module.exports = handlebars;