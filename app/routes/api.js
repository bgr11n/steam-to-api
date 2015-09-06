var express = require('express');
var router = express.Router();
var config = require(process.cwd() + '/config');

var fs = require('fs');
var crypto = require('crypto');

// Stuff for steam login
var Steam = require('steam');
var SteamWebLogOn = require('steam-weblogon');
var getSteamAPIKey = require('steam-web-api-key');
var SteamTradeOffers = require('steam-tradeoffers');

router.get('/login', function(req, res) {
  var steamClient = new Steam.SteamClient();
  var steamUser = new Steam.SteamUser(steamClient);
  var steamWebLogOn = new SteamWebLogOn(steamClient, steamUser);
  var offers = new SteamTradeOffers();

  var authCode = '';
  var logOnOptions = {
    account_name: config.bots[1].login,
    password: config.bots[1].password
  };

  try {
    logOnOptions.sha_sentryfile = getSHA1(fs.readFileSync(__dirname + '/sentry.' + config.bots[1].login));
  } catch (e) {
    if (authCode !== '') {
      logOnOptions.auth_code = authCode;
    }
  }

  steamClient.connect();
  steamClient.on('connected', function() {
    steamUser.logOn(logOnOptions);
  });

  console.log('asdasd');

  steamUser.on('updateMachineAuth', function(sentry, callback) {
    fs.writeFileSync(__dirname + 'sentry.' + config.bots[1].login, sentry.bytes);
    callback({ sha_file: getSHA1(sentry.bytes) });
  });


  steamClient.on('logOnResponse', function(logonResp) {
    if (logonResp.eresult == Steam.EResult.OK) {
      console.log('Logged in!');
      offers.loadMyInventory({
          'appId': 570,
          'contextId': 2
        }, function(err, items) {
          res.json(items);
      });
    }
  });
});

function getSHA1(bytes) {
  var shasum = crypto.createHash('sha1');
  shasum.end(bytes);
  return shasum.read();
}

module.exports = router;
