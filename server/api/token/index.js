'use strict';

var express = require('express');
var controller = require('./token.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var token = express.Router();

// no routes for token!

module.exports = token;
