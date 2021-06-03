const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const nunjucks = require('nunjucks');

require('json-dotenv')();

const app = express();

const indexRouter = require('./routes');

app.set('port', process.env.NODE_ENV || 3000);
app.set('view engine', 'html');
nunjucks.configure('views', {
    express: app,
    watch: true
});

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.redirect('/node');
});
app.use('/node', indexRouter);

app.use((req, res, next) => {
    const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
    error.status = 404;
    next(error);
})

app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
    res.status(err.status || 500);
    res.render('error')
});

app.listen(app.get('port'), () => {
    console.info('Started on port', app.get('port'));
})

module.exports = app;
