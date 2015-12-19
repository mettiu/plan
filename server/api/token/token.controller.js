'use strict';

//var _ = require('lodash');
var async = require('async');
var errors = require('../../components/errors');
var User = require('../user/user.model');
var Token = require('./token.model');
//var passport = require('passport');
var config = require('../../config/environment');
//var jwt = require('jsonwebtoken');

exports.issue = function (req, res) {
  if (!req.body || !req.body.email) return res.status(400).send("Missing mandatory data");

  var locals = {};
  async.series([
      function (callback) { // find the user
        User.findByEmail(req.body.email, function (err, item) {
          if (err) {
            return callback(err);
          }
          if (!item) return callback('noUserErr', item);

          locals.user = item;
          return callback(null, item);
        });
      },

      function (callback) { // issue the token
        Token.createNew({type: 'lostPassword', _user: locals.user._id}, function (err, savedItem) {
          if (err) return callback(err);
          locals.token = savedItem;
          return callback(null, savedItem);
        });
      },

      function (callback) { // send token by email
        console.log("email inviata a " + locals.user.email + " con link al token: http://xxxxx.xxx.xx/ANGULAR-ROUTE?t=" + locals.token.token);
        callback(null, true);
      }
    ],
    // optional callback
    function (err, results) {
      //hint: results contains each function result data
      if (err && err === "noUserErr") return res.status('404').send('Not Found');
      if (err) return errors[500](res, err);
      return res.status(200).send('OK');
    });

};

exports.check = function (req, res) {
  if (!req.query.t) {
    return res.status(400).send("Missing mandatory data");
  }
  var token = req.query.t;
  Token.findValidToken(token, function (err, item) {
    if (err) return errors[500](res, err);
    if (!item) return res.status(200).json({result: false});
    //item.fire();
    return res.status(200).json({result: true});
  });
};

exports.passwordChange = function (req, res) {
  if (!req.body || !req.body.token /*|| !req.body.password*/) return res.status(403).send('Forbidden');
console.log("passwordchange req.body: " );
  console.log(req.body);
  // TODO: verificare anche la password!!

  var locals = {};
  async.series([
      function (callback) { // findtoken to get user id
        Token.findValidToken(req.body.token, function (err, item) {
          if (err) return callback(err);
          if (!item) return callback("tokenNotFound", null); // should use "new Error..."
          locals.token = item;
          return callback(null, item);
        });
      },

      function (callback) { //find user
        User.findById(locals.token._user, function (err, item) {
          if (err) return callback(err);
          if (!item) return callback("userNotFound", null);
          locals.user = item;

          return callback(null, item);
        });
      },

      function (callback) { // change password and save user
        var user = locals.user;
        locals.user.password = req.body.password;
        locals.user.save(function(err, saved) {
          if (err) return callback(err);
        });
        return callback(null, 'password change');
      },

      function (callback) { // the token must be fired!
        var token = locals.token;
        token.fire(function(err) {
          if (err) return callback(err);
        });
        return callback(null, 'fired');
      },

    ],
    // optional callback
    function (err, results) {
      //hint: results contains each function result data
      if (err && err === "tokenNotFound") return res.status(403).send('Forbidden');
      if (err && err === "userNotFound") return res.status(403).send('Forbidden');
      if (err) return errors[500](res, err);
      return res.status(200).send('OK');
    });
};

var validationError = function (res, err) {
  return res.status(422).json(err);
};

