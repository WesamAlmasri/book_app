// Application Dependencies
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const { Client } = require( 'pg' );
const {Book} = require('./store')

/* ---------- Application Setups ---------- */

//init pg clinet
const client = new Client( {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DEV_MODE ? false : { rejectUnauthorized: false }
  } );

const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());
app.set('view engine','ejs');
app.use(express.static('./public'));
app.use(express.urlencoded({extended: false}));


/* ---------- Application Routes ---------- */
app.get('/hello', handleTest);

app.get('/', handleHomePage);
app.get('/searches/new', handleSearchNew);
app.post('/searches', handlePostSearch);

// Page Not Found
app.get('*', handlePageNotFound);

// Error handler midlware
app.use(errorPage);



/* --------- Application routes handlers ---------- */

// Home page routes
function handleHomePage(req, res, next) {
    let sqlQuery = 'SELECT * FROM books';
    client.query(sqlQuery)
        .then(data => {
            let books = data.rows;
            let totalCount = data.rowCount;
            res.render('pages/index', {books: books, totalCount: totalCount});
        })
        .catch(e => next(e));
}

// Test routes
function handleTest(req, res, next) {
    res.render('pages/index');
}

//routes to render the search form
function handleSearchNew(req, res, next) {
    res.render('pages/searches/new');
}

//routes to render the search form
function handlePostSearch(req, res, next) {
    let keyword = req.body.keyword
    let search_by = req.body.search_by;
    let url = `https://www.googleapis.com/books/v1/volumes?q=+${search_by}:${keyword}`;
    superagent.get(url)
        .then(response => {
            let result = response.body.items.slice(0, 10);
            let formattedResutl = result.map(bookData => new Book(bookData));
            res.render('pages/searches/show', {books: formattedResutl});
        })
        .catch(e => next(e));
}

function handlePageNotFound(req, res, next) {
    res.render('pages/error', {'context': 'Page Not Found'})
}

/* Error handlers */

// function to render the error page
function errorPage(err, req, res, next) {
    console.error(err.stack);
    res.render('pages/error');
}

/* --------- Application start the server --------- */

client.connect()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Listening on PORT ${PORT}`);
        });
    })
    .catch(e => console.log(e));

