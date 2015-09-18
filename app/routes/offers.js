var fs = require('fs');
var crypto = require('crypto');
var express = require('express');
var router = express.Router();
var log = require(process.cwd() + '/app/log')(module);
var config = require(process.cwd() + '/config');
var db = require(process.cwd() + '/app/db/mongoose');
var Bot = require(process.cwd() + '/app/models/bot');

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

var chooseBot = function (req, res, next) {
  Bot.findOne({ 'login': 'bgr11n' }, function (err, bot) {
    if (!err) {
      res.locals.bot = bot;
      next();
    } else {
      res.statusCode = 500;
      log.error('Internal error(%d): %s',res.statusCode,err.message);
      return res.json({ error: 'Server error' });
    }
  });
}

var logIn = function (req, res, next) {
  var steamClient = new Steam.SteamClient();
  var steamUser = new Steam.SteamUser(steamClient);
  res.locals.offers = new SteamTradeOffers();
  res.locals.steamWebLogOn = new SteamWebLogOn(steamClient, steamUser);
  res.locals.steamClient = steamClient;

  var authCode = '';
  var logOnOptions = {
    account_name: res.locals.bot.login,
    password: res.locals.bot.password
  };

  try {
    logOnOptions.sha_sentryfile = getSHA1(fs.readFileSync('./sentry/bot/sentry.' + res.locals.bot.login));
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
    fs.writeFileSync('./sentry/bot/sentry.' + res.locals.bot.login, sentry.bytes);
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

router.post('/make', [validateUser, validateItem, chooseBot, logIn], function(req, res) {
  partnerSteamId = req.body.partner_steam_id
  itemFromBot = req.body.item_from_bot
  itemFromThem = req.body.item_from_them
  message = req.body.message

  res.locals.steamWebLogOn.webLogOn(function(sessionID, newCookie) {
    res.locals.offers.setup({ sessionID: sessionID, webCookie: newCookie, APIKey: res.locals.bot.api_key }, function() {
      res.locals.offers.makeOffer ({
        partnerSteamId: partnerSteamId,
        itemsFromMe: [itemFromBot],
        itemsFromThem: [itemFromThem],
        message: message
      }, function(err, response) {
        if (err) {
          res.json({ success: false, error: err });
        } else {
          res.json({ success: true, data: response, bot: res.locals.bot });
        }
        res.locals.steamClient.disconnect();
      });
    });
  });
});

module.exports = router;
