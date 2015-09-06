var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('User', new Schema({
  uid: String,
  steam_id: String,
  nickname: String,
  name: String,
  image: String,
  profile_url: String,
  balance: Number
}));
