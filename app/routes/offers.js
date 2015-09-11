var fs = require('fs');
var crypto = require('crypto');
var express = require('express');
var router = express.Router();
var config = require(process.cwd() + '/config');

var Steam = require('steam');
var SteamWebLogOn = require('steam-weblogon');
var getSteamAPIKey = require('steam-web-api-key');
var SteamTradeOffers = require('steam-tradeoffers');

var validateUser = function (req, res, next) {
  console.log('valid')
  next();
}

var validateItem = function (req, res, next) {
  console.log('valid')
  next();
}

var logIn = function (req, res, next) {
  var steamClient = new Steam.SteamClient();
  var steamUser = new Steam.SteamUser(steamClient);
  var steamTrading = new Steam.SteamTrading(steamClient);
  res.locals.offers = new SteamTradeOffers();
  res.locals.steamWebLogOn = new SteamWebLogOn(steamClient, steamUser);
  res.locals.steamClient = steamClient;

  steamTrading.on('tradeResult', function (tradeId, res, partnerId) {
    console.log("" + tradeId);
  });

  var bot = config.bots[1];
  res.locals.bot = bot;

  var authCode = '';
  var logOnOptions = {
    account_name: bot.login,
    password: bot.password
  };

  try {
    logOnOptions.sha_sentryfile = getSHA1(fs.readFileSync('./sentry/bot/sentry.' + bot.login));
  } catch (e) {
    if (authCode !== '') {
      logOnOptions.auth_code = authCode;
    }
  }

  steamClient.connect();
  steamClient.on('connected', function() {
    steamUser.logOn(logOnOptions);
  });

  steamUser.on('updateMachineAuth', function(sentry, callback) {
    fs.writeFileSync('./sentry/bot/sentry.' + bot.login, sentry.bytes);
    callback({ sha_file: getSHA1(sentry.bytes) });
  });

  steamClient.on('logOnResponse', function(logonResp) {
    if (logonResp.eresult == Steam.EResult.OK) {
      console.log('Logged in!')
      next();
    } else {
      console.log('Error on logging in!')
    }
  });

  function getSHA1(bytes) {
    var shasum = crypto.createHash('sha1');
    shasum.end(bytes);
    return shasum.read();
  }
}

router.post('/make', [validateUser, validateItem, logIn], function(req, res) {
  partnerSteamId = req.body.partner_steam_id
  itemFromBot = req.body.item_from_bot
  itemFromThem = req.body.item_from_them
  message = req.body.message

  res.locals.steamWebLogOn.webLogOn(function(sessionID, newCookie) {
    getSteamAPIKey({ sessionID: sessionID, webCookie: newCookie }, function(err, APIKey) {
      res.locals.offers.setup({ sessionID: sessionID, webCookie: newCookie, APIKey: APIKey }, function() {
        res.locals.offers.makeOffer ({
          partnerSteamId: partnerSteamId,
          itemsFromMe: [itemFromBot],
          itemsFromThem: [itemFromThem],
          message: message
        }, function(err, response) {
          if (err) {
            res.json({ success: false, error: err });
          } else {
            res.json({ success: true, data: response });
          }
          res.locals.steamClient.disconnect();
        });
      });
    });
  });
});

router.get('/:id', [validateUser, validateItem, logIn], function(req, res) {
  var tradeOfferId = req.params['id']

  res.locals.steamWebLogOn.webLogOn(function(sessionID, newCookie) {
    getSteamAPIKey({ sessionID: sessionID, webCookie: newCookie }, function(err, APIKey) {
      res.locals.offers.setup({ sessionID: sessionID, webCookie: newCookie, APIKey: APIKey }, function() {
        res.locals.offers.getOffer ({
          tradeofferid: tradeOfferId
        }, function(err, response) {
          if (err) {
            res.json({ success: false, error: err });
          } else {
            res.json({ success: true, data: response });
          }
          res.locals.steamClient.disconnect();
        });
      });
    });
  });
});

module.exports = router;
