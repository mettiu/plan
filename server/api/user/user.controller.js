'use strict';

var _ = require('lodash');
var User = require('./user.model');
var Token = require('../token/token.model');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var token

var validationError = function (res, err) {
  return res.status(422).json(err);
};

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function (req, res) {
  User.find({}, '-salt -hashedPassword', function (err, users) {
    if (err) return res.status(500).send(err);
    res.status(200).json(users);
  });
};

/**
 * Creates a new user
 */
exports.create = function (req, res, next) {
  var newUser = new User(req.body);
  newUser.provider = 'local';
  newUser.role = 'user';
  newUser.save(function (err, user) {
    if (err) return validationError(res, err);
    //var token = jwt.sign({_id: user._id}, config.secrets.session, {expiresInMinutes: 60 * 5});
    var token = jwt.sign({_id: user._id}, config.secrets.session, {expiresIn: 60 * 60 * 5}); //in seconds
    res.json({token: token});
  });
};

/**
 * Get a single user
 */
exports.show = function (req, res, next) {
  var userId = req.params.id;

  //User.findById(userId, function (err, user) {
  //  if (err) return next(err);
  //  if (!user) return res.status(401).send('Unauthorized');
  //  res.json(user.profile);
  //})

  User.findById(userId)
    .populate('_company')
    .exec(function (err, user) {
      if (err) return next(err);
      if (!user) return res.status(401).send('Unauthorized');
      res.json(user.profile);
    })
};

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function (req, res) {
  User.findByIdAndRemove(req.params.id, function (err, user) {
    if (err) return res.status(500).send(err);
    return res.status(204).send('No Content');
  });
};

/**
 * Change a users password
 */
exports.changePassword = function (req, res, next) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  User.findById(userId, function (err, user) {
    if (user.authenticate(oldPass)) {
      user.password = newPass;
      user.save(function (err) {
        if (err) return validationError(res, err);
        res.status(200).send('OK');
      });
    } else {
      res.status(403).send('Forbidden');
    }
  });
};

/**
 * Get my info
 */
exports.me = function (req, res, next) {
  var userId = req.user._id;
  User.findOne({
    _id: userId
  }, '-salt -hashedPassword', function (err, user) { // don't ever give out the password or salt
    if (err) return next(err);
    if (!user) return res.status(401).send('Unauthorized');
    res.json(user);
  });
};

// Updates an existing user in the DB.
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  User.findById(req.params.id, function (err, user) {
    if (err) {
      return handleError(res, err);
    }
    if (!user) {
      return res.status(404).send('Not Found');
    }
    var updated = _.merge(user, req.body);
    updated.save(function (err) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(200).json(user);
    });
  });
};

//
exports.lostPassword = function (req, res) {
  if (!req.query.t) { // if a token was NOT provided, user is requesting a new token
    // TODO: create a middleware to chek if json received contains email field
    var email = req.body.email;
    User.findByEmail(req.body.email, function (err, item) {
      if (err) return handleError(res, err); // TODO: capire come funziona handleError!!
      if (!item) return res.status('404').send('Not Found');
      var token = new Token({_user: item._id, type: 'lostPassword'});
      token.save(function (err, savedItem, numAffected) {
        if (err) return handleError(res, err); // TODO: capire come funziona handleError!!
        // TODO: inviare il token via email
        console.log("email inviata con link al token: http://xxxxx.xxx.xx/ANGULAR-ROUTE?t=" + savedItem.token);
        res.status(200).send('OK');
      });
    });
  } else {
    // if a token was provided, user loaded angula page for checktoken rouet
    // which posted token here to check and fire it

    Token.findToken(req.query.t, function(err, item) {

      if (err) res.status(404).send('Not Found');
      if (!item) return res.status(200).send({result: false});
      item.fire();
      return res.status(200).json({result: true});
    });
  }
};


/**
 * Authentication callback
 */
exports.authCallback = function (req, res, next) {
  res.redirect('/');
};
