'use strict';

var
  express = require('express'),
  chai = require('chai'),
  expect = chai.expect,
  _ = require('lodash'),
  request = require('supertest'),
  mongoose = require('mongoose'),
  jwt = require('express-jwt'),
  jsonwebtoken = require('jsonwebtoken'),
  app = require('../app'),
  config = require('../config/environment'),
  errorMiddleware = require('../components/error-middleware'),
  utils = require('../components/utils'),
  User = require('../api/user/user.model'),
  auth = require('./auth.service');

var userTemplate = {provider: 'local', name: 'Fake User One', email: 'testone@test.com', password: 'passwordone'};

/**
 * Test function that returns req.user as a response with http 200
 * @param req
 * @param res
 * @param next
 */
function returnReqUser(req, res, next) {
  if (!req.user) return res.status(599).send("ERROR");
  return res.status(200).json(req.user);
}

/**
 * Test function that gets token from authorization header and returns it as a json token
 * @param req
 * @param res
 * @param next
 */
function returnAuthorizationHeader(req, res, next) {
  if (!(req.headers && req.headers.authorization)) return res.status(401).send("Unauthorized");
  return res.status(200).json({'token': req.headers.authorization});
}

/**
 * Mock for a middleware that takes _id from querystring and sets it into req.user.
 * This is a very simple mock for JWT middleware.
 * @param req
 * @param res
 * @param next
 */
function mockSetUserIdIntoReq(req, res, next) {
  if (!(req.query && req.query.hasOwnProperty('_id'))) return res.status(401).send("Unauthorized");
  req.user = {'_id': req.query._id};
  next();
}

/**
 * Logs user with supplied email and password, then callback is called
 * with parameters
 * - err
 * - res
 * @param email
 * @param password
 * @param callback
 */
function restLogin(email, password, callback) {
  request(app)
    .post('/auth/local')
    .send({email: email, password: password})
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function (err, res) {
      if (err) return callback(err);
      callback(null, res);
    });
}

/**
 * Test for getTokenFromQuery middleware.
 * To have this test we use a mock function 'returnAuthorizationHeader'
 * which returns http 200 is authorization header is present and responds
 * with the token found as a json object. Otherwise responds http 401.
 */
describe('getTokenFromQuery middleware Test', function (done) {
  var authToken = 'token.string';

  // set the test routes for this controller method
  before(function () {
    app.use('/test/auth', express.Router().get('/getTokenFromQuery', auth.getTokenFromQuery, returnAuthorizationHeader));
  });

  it('should get token from string', function (done) {
    request(app)
      .get('/test/auth/getTokenFromQuery?access_token=' + authToken)
      .send()
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) return done(err);
        expect(res.body).to.have.property('token');
        expect(res.body.token).to.be.equal('Bearer ' + authToken);
        done();
      });
  });

  it('should not get token from string', function (done) {
    request(app)
      .get('/test/auth/getTokenFromQuery?access_token_wrong=' + authToken)
      .send()
      .expect(401)
      //.expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) return done(err);
        expect(res.body).not.to.have.property('token');
        done();
      });
  });

});

/**
 * Test for attachUserToRequest middleware.
 * To have this test we use a mock for JWT decode. The function 'mockSetUserIdIntoReq'
 * gets _id from querystring and sets req.user._id accordingly.
 * The final middleware called is 'returnReqUser', which just return req.user as a response.
 */
describe('attachUserToRequest middleware Test', function (done) {
  var user;

  // set the test routes for this controller method
  before(function () {
    app.use('/test/auth', express.Router().get('/attachUserToRequest', mockSetUserIdIntoReq, auth.attachUserToRequest, returnReqUser));
  });

  // remove all users from DB
  before(function (done) {
    utils.mongooseRemoveAll([User], done);
  });

  // create user
  before(function (done) {
    user = _.clone(userTemplate);
    User.create(user, function (err, inserted) {
      if (err) return done(err);
      user = inserted;

      return done();
    });
  });

  it('should get token from string', function (done) {
    request(app)
      .get('/test/auth/attachUserToRequest?_id=' + user._id)
      .send()
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) return done(err);
        expect(res.body).to.have.property('_id', user._id.toString());
        expect(res.body).to.have.property('name', user.name);
        expect(res.body).to.have.property('email', user.email);
        done();
      });
  });

  it('should get token from string', function (done) {
    request(app)
      .get('/test/auth/attachUserToRequest?_id=' + mongoose.Types.ObjectId())
      .send()
      .expect(401)
      //.expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) return done(err);
        done();
      });
  });

});

/**
 * Test for login process using JWT
 */
describe('JWT middleware test', function () {

  var testPath = '/test/auth/jwt';
  var user;
  var authToken;

  // set the test routes for this controller method
  before(function () {
    var router = express.Router();
    router.use(auth.jwtMiddleware);
    app.use(testPath, router.get('/', returnReqUser));
    errorMiddleware(app);
  });

  // remove all users from DB
  before(function (done) {
    utils.mongooseRemoveAll([User], done);
  });

  // create user
  before(function (done) {
    user = _.clone(userTemplate);
    User.create(user, function (err, inserted) {
      if (err) return done(err);
      user = inserted;

      return done();
    });
  });

  // login user
  before(function (done) {
    restLogin(userTemplate.email, userTemplate.password, function (err, res) {
      if (err) return done(err);
      expect(res.body).to.be.instanceOf(Object);
      expect(res.body).to.have.property('token');
      jsonwebtoken.verify(res.body.token, config.secrets.session, function (err, decoded) {
        if (err) return done(err);
        expect(decoded._id).to.be.equal('' + user._id);
        authToken = res.body.token;
        return done();
      });
    });
  });

  // remove all users from DB
  after(function (done) {
    utils.mongooseRemoveAll([User], done);
  });


  it('should authenticate a valid token', function (done) {
    request(app)
      .get(testPath)
      .set('authorization', 'Bearer ' + authToken)
      .send()
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) return done(err);
        expect(res.body).to.have.property('_id', user._id.toString());
        return done();
      });
  });

  it('should not authenticate', function (done) {
    request(app)
      .get(testPath)
      .set('Authorization', 'Bearer fake-token=:-)')
      .send()
      .expect(401)
      //.expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) return done(err);
        return done();
      });
  });

});

/**
 * Test for e2e login process (using JWT)
 */
describe('Login e2e test', function () {

  var testPath = '/test/auth/e2e';
  var user;
  var authToken;

  // set the test routes for this controller method
  before(function () {
    var router = express.Router();
    router.use(
      auth.getTokenFromQuery,
      auth.jwtMiddleware,
      auth.attachUserToRequest
    );
    app.use(testPath, router.get('/', returnReqUser));
    errorMiddleware(app);
  });

  // remove all users from DB
  before(function (done) {
    utils.mongooseRemoveAll([User], done);
  });

  // create user
  before(function (done) {
    user = _.clone(userTemplate);
    User.create(user, function (err, inserted) {
      if (err) return done(err);
      user = inserted;

      return done();
    });
  });

  // login user
  before(function (done) {
    restLogin(userTemplate.email, userTemplate.password, function (err, res) {
      if (err) return done(err);
      expect(res.body).to.be.instanceOf(Object);
      expect(res.body).to.have.property('token');
      jsonwebtoken.verify(res.body.token, config.secrets.session, function (err, decoded) {
        if (err) return done(err);
        expect(decoded._id).to.be.equal('' + user._id);
        authToken = res.body.token;
        return done();
      });
    });
  });

  // remove all users from DB
  after(function (done) {
    utils.mongooseRemoveAll([User], done);
  });

  it('should authenticate a valid token', function (done) {
    request(app)
      .get(testPath)
      .set('authorization', 'Bearer ' + authToken)
      .send()
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) return done(err);
        expect(res.body).to.have.property('_id', user._id.toString());
        expect(res.body).to.have.property('name', user.name);
        expect(res.body).to.have.property('email', user.email);
        return done();
      });
  });

  it('should not authenticate', function (done) {
    request(app)
      .get(testPath)
      .set('Authorization', 'Bearer fake-token=:-)')
      .send()
      .expect(401)
      //.expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) return done(err);
        return done();
      });
  });

});
