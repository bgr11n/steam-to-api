var mongoose = require('mongoose');

var log = require(process.cwd() + '/app/log')(module);
var config = require(process.cwd() + '/config');

mongoose.connect(config.database); // connect to database

var db = mongoose.connection;

db.on('error', function (err) {
  log.error('Connection error:', err.message);
});

db.once('open', function callback () {
  log.info("Connected to DB!");
});

module.exports = mongoose;
