'use strict';

var express = require('express');
var controller = require('./ticket.controller');
var config = require('../../config/environment');

var router = express.Router();

//router.post('/issue', controller.issue);
//router.get('/check', controller.check);
//router.post('/passwordChange', controller.passwordChange);

module.exports = router;
