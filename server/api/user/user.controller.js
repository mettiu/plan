'use strict';

var mongoose = require('mongoose');
var _ = require('lodash');
var User = require('./user.model');
var Token = require('../token/token.model');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
//var token

var validationError = function (res, err) {
  return res.status(422).json(err);
};

var handleError = function (res, err) {
  switch (err.name) {
    case 'ValidationError':
      return res.status(422).json(err);
      break;
    default:
      res.status(500).send('Server Error');
      throw err;
      break;
  }
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


exports.setSupplyCategory = function (req, res) {

  User.findById(req.body.addressedUserId, function (err, user) {
    if (err || !user) return handleError(res, err);

    _.forEach(req.body.newSupplyCategoryIds, function (newSupplyCategoryId) {
      user.supplyCategories.push({
        _company: mongoose.Types.ObjectId(req.body.addressedCompanyId),
        _category: mongoose.Types.ObjectId(newSupplyCategoryId)
      });
    });
    user.save(function(err) {
      if (err) return handleError(res, err);
      return res.status(200).json({result: 'OK'});
    });
  });
};


/**
 * Authentication callback
 */
exports.authCallback = function (req, res, next) {
  res.redirect('/');
};
