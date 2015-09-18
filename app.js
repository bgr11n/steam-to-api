var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');

var api = require('./app/routes/api')

// =======================
// configuration =========
// =======================
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan('dev'));

// =======================
// routes ================
// =======================
app.use('/api', api);

var port = 8080
app.listen(port);
console.log('Magic happens at http://localhost:' + port);
