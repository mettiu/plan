'use strict';

var mongoose = require('mongoose');
var passport = require('passport');
var config = require('../config/environment');
var jsonwebtoken = require('jsonwebtoken');
var jwt = require('express-jwt');
var compose = require('composable-middleware');
var _ = require('lodash');
var User = require('../api/user/user.model');
var validateJwt = jwt({secret: config.secrets.session});

/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 403
 */
function isAuthenticated() {
  return compose()
  // Validate jwt
    .use(function (req, res, next) {
      // allow access_token to be passed through query parameter as well
      if (req.query && req.query.hasOwnProperty('access_token')) {
        req.headers.authorization = 'Bearer ' + req.query.access_token;
      }
      validateJwt(req, res, next);

    })
    // Attach user to request
    .use(function (req, res, next) {
      User.findById(req.user._id, function (err, user) {

        if (err) return next(err);
        if (!user) return res.status(401).send('Unauthorized');

        req.user = user;
        next();
      });
    });
}

/**
 * Creates authorization header from querystring parameter.
 * If Authorization token was sent as a querystring
 * like '...?access_token=xyz' then the token is moved
 * into header in the following form:
 * authorization: 'Bearer xyz'
 * Then next() middleware is called.
 * This should be the first call for authenticated routes, where
 * the pipeline should be:
 * - getTokenFromQuery - bring the token from req query to req header
 * - jwt validation middleware - sets req.user object with jwt data
 * - attachUserToRequest - expands user data in req.user
 * @param req
 * @param res
 * @param next
 */
function getTokenFromQuery(req, res, next) {
  if (req.query && req.query.hasOwnProperty('access_token')) {
    req.headers.authorization = 'Bearer ' + req.query.access_token;
  }
  return next();
}

/**
 * Attaches user data to req,
 * expanding the data extracted from the token by JWT.
 * Before this middleaware JWT middleware should be called.
 * JWT decodes the token read from 'authorization' header
 * and sets the decoded data in req.user.
 * Since the user _id is stored in the token, this middleware
 * retrieves the user data from DB and sets this data into req.user.
 * If the user _id is not found in teh DB this middleware
 * returns 401 'Unauthorized'.
 * Then next() middleware is called.
 * This should be the third call for authenticated routes, where
 * the pipeline should be:
 * - getTokenFromQuery - bring the token from req query to req header
 * - jwt validation middleware - sets req.user object with jwt data
 * - attachUserToRequest - expands user data in req.user
 * @param req
 * @param res
 * @param next
 */
function attachUserToRequest(req, res, next) {
  User.findById(req.user._id, function (err, user) {
    if (err) return next(err);
    if (!user) return res.status(401).send('Unauthorized');
    req.user = user;
    next();
  });
}

/**
 * Checks if the user role meets the minimum requirements of the route
 */
function hasRole(roleRequired) {
  if (!roleRequired) throw new Error('Required role needs to be set');

  return compose()
    .use(isAuthenticated())
    .use(function meetsRequirements(req, res, next) {
      if (config.userRoles.indexOf(req.user.role) >= config.userRoles.indexOf(roleRequired)) {
        next();
      }
      else {
        res.status(403).send('Forbidden');
      }
    });
}

/**
 * Wrapper for jwt middleware.
 * Everything regarding JWT should be managed in this module
 * in order to avoid import duplication for library JWT.
 * @returns jwt middleware function parametrized by the closure.
 */
function jwtMiddleware() {
  return jwt({secret: config.secrets.session});
}

/**
 * Returns a jwt token signed by the app secret
 */
function signToken(id) {
  return jsonwebtoken.sign({_id: id}, config.secrets.session, {expiresIn: '5h'});
}

/**
 * Set token cookie directly for oAuth strategies
 */
function setTokenCookie(req, res) {
  if (!req.user) return res.status(404).json({message: 'Something went wrong, please try again.'});
  var token = signToken(req.user._id, req.user.role);
  res.cookie('token', JSON.stringify(token));
  res.redirect('/');
}

/**
 * Check if user is allowed to admin the addressed company
 *
 * @param req
 * @param res
 * @param next
 */
function isAdminForCompany(req, res, next) {
  // check if user can add categories to other users for addressed company
  // is requester user admin for addressed company?
  var found = _.find(req.user._adminCompanies, function (item) {
    return item.toString() === req.body.addressedCompanyId;
  });
  if (!found) return res.status(422).send('Unprocessable Entity');
  next();
}

/**
 * Check if addressedUser is enabled for the addressedCompany
 *
 * @param req
 * @param res
 * @param next
 */
function isAddressedUserEnabledForAddressedCompany(req, res, next) {
  // check if user can manage addressed user to add the addressed company to user
  // is addressed user member of the addressed company?
  // search user with addressedUser Id AND
  // _companies enabled containing addressed company
  User.count({
    '_id': req.body.addressedUserId,
    '_companies': req.body.addressedCompanyId
  }, function (err, result) {
    if (err) throw err;
    if (result !== 1) return res.status(422).send('Unprocessable Entity');
    next();
  });
}

/**
 * Check if User is a platform admin. Useful for filtering requests to methods
 * reserved for platform administrators.
 *
 * TODO: implement this control. At the moment this check always returns true
 *
 * @param req
 * @param res
 * @param next
 */
function isPlatformAdmin (req, res, next) {
  next();
}

exports.isAuthenticated = isAuthenticated;
exports.hasRole = hasRole;
exports.signToken = signToken;
exports.setTokenCookie = setTokenCookie;
exports.isAdminForCompany = isAdminForCompany;
exports.isAddressedUserEnabledForAddressedCompany = isAddressedUserEnabledForAddressedCompany;
exports.isPlatformAdmin = isPlatformAdmin;
exports.getTokenFromQuery = getTokenFromQuery;
exports.attachUserToRequest = attachUserToRequest;
exports.jwtMiddleware = jwtMiddleware;
