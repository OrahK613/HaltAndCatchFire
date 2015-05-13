// Load core modules.
var path = require('path');

// Load third-party modules.
var express = require('express');
var bodyParser = require('body-parser');

// Create the Express application object.
var app = express();

// Configure Express to use the EJS view engine.
app.set('view engine', 'ejs');

// Tell Express where to find views.
app.set('views', path.join(__dirname, 'views'));

// Render HTML when the root path is requested.
app.get('/', function(req, res) {
    res.render('index');
});

// Do some addition when JSON is posted to "/add".
app.post('/add', bodyParser.json(), function(req, res) {
    res.json(req.body.a + req.body.b);
});

// Serve static files from the "public" folder.
app.use(express.static(path.join(__dirname, 'public')));

// Start the server on a custom port.
app.listen(process.env.PORT || 1337);