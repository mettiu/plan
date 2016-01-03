'use strict';

var
  express = require('express'),
  controller = require('./team.controller'),
  config = require('../../config/environment'),

  router = express.Router();

//router.post('/issue', controller.issue);
//router.get('/check', controller.check);
//router.post('/passwordChange', controller.passwordChange);

module.exports = router;
