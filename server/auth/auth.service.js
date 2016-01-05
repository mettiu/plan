'use strict';

var mongoose = require('mongoose');
var passport = require('passport');
var conditional = require('express-conditional-middleware');
var jsonwebtoken = require('jsonwebtoken');
var jwt = require('express-jwt');
var config = require('../config/environment');
var validateJwt = jwt({secret: config.secrets.session});
var compose = require('composable-middleware');
var _ = require('lodash');

var User = require('../api/user/user.model');
var Company = require('../api/company/company.model');

/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 403
 * DEPRECATED
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
 * Attaches the company to req.
 * Returns a function to user in router.param for those
 * routes that accept model Id (Category or Test) as a param.
 * The param function sets the company corresponding to
 * _company for the model into a 'company' field in req.
 * @param model
 * @returns {Function} to be used in router.param call
 */
function attachCompanyFromParam(model) {
  // if mandatory model parameter is not set returns a middleware that crashes!
  if (!model) return function (res, req, next) {
    return next(new Error("Missing Model parameter!"))
  };

  return function (req, res, next, param) {
    model
      .findById(param)
      .populate('_company')
      .exec(function (err, found) {
        if (err) return next(err);
        if (!found) return res.status(400).send("Bad Request");
        req.company = found._company;
        next();
      });
  }
}

/**
 * Attaches company data to req.
 * When an API related to something which has a _company (id) field
 * is called (i.e.: category or Team) you may want to extract the company
 * data, in order to allow further checks based on company data.
 * For example, you may want to check is the user requesting the
 * operation is an administrator for the category he is trying to
 * operate on (i.e.: creation, update, ecc.).
 * If company data is already present in req.body this middleware is skipped.
 * This middleware just expands company data from the req body _company field,
 * setting req.company with the data retrieved from DB.
 * Http 400 code is returned if:
 * - no _company field found;
 * - no company with the required _id found.
 * Any errors returned by Mongoose should be managed by following middlewares
 * (i.e.: CastError on _id).
 * @param req
 * @param res
 * @param next
 */
function attachCompanyFromBodyFunction() {

  // if parameter req.company is not already present,
  // then middleware is returned and tries to set company from body request
  return conditional(
    function (req, res, next) {
      return !!req.body && !req.company;
    },
    function (req, res, next) {
      if (!req.body._company) return res.status(400).send("Bad Request");
      Company.findById(req.body._company, function (err, company) {
        if (err) return next(err);
        if (!company) return res.status(400).send("Bad Request");
        req.company = company;
        next();
      })
    }
  );
}
var attachCompanyFromBody = attachCompanyFromBodyFunction();

/**
 * Checks if req.user is admin for req.company.
 * This middleware expects to find req.user and req.company.
 * If req.company._id is not found in req.user._adminCompanies,
 * http 401 'Unauthorized' is returned.
 * @param req
 * @param res
 * @param next
 */
function isAdminForTargetCompany(req, res, next) {
  var found = _.find(req.company.adminUsers, function (_user) {
    return _user.toString() === req.user._id.toString();
  });
  if (!found) return res.status(401).send('Unauthorized');
  next();
}

/**
 * Checks if the user role meets the minimum requirements of the route
 * DEPRECATED
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
function jwtMiddlewareWrapper() {
  return jwt({secret: config.secrets.session});
}
// jwtMiddleware is assigned with the function returned by the jwtMiddlewareWrapper,
// which is the middleware provided by the JWT library.
var jwtMiddleware = jwtMiddlewareWrapper();

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
 * DEPRECATED
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
 * DEPRECATED
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
function isPlatformAdmin(req, res, next) {
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
//exports.attachTargetCompanyFromParamToRequest = attachTargetCompanyFromParamToRequest;
exports.attachCompanyFromBody = attachCompanyFromBody;
exports.isAdminForTargetCompany = isAdminForTargetCompany;
exports.attachCompanyFromParam = attachCompanyFromParam;
