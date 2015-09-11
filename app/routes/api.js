var express = require('express');
var router = express.Router();

var offers = require('./offers')

router.use('/offers', offers);

module.exports = router;
