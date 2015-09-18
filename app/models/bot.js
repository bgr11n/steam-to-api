var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Bot', new Schema({
  login: String,
  password: String,
  api_key: String
}));
