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

function test(req, res, next) {
  return res.status(200).send(req.user);
}

function returnAuthorizationHeader(req, res, next) {
  if (!(req.headers && req.headers.authorization)) return res.status(401).send("Unauthorized");
  return res.status(200).json({'token': req.headers.authorization});
}

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
 * which returns http200 is authorization header is present and responds
 * with the token found as a json object. Otherwise responds http 401.
 */
describe('getTokenFromQuery middleware Test', function (done) {
  var authToken = 'token.string';

  // set the test routes for this controller method
  before(function () {
    app.use('/test/auth', express.Router().get('/returntoken', auth.getTokenFromQuery, returnAuthorizationHeader));
  });

  it('should get token from string', function (done) {
    request(app)
      .get('/test/auth/returntoken?access_token=' + authToken)
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
      .get('/test/auth/returntoken?access_token_wrong=' + authToken)
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
 * Test for e2e login process
 */
describe('Auth test', function () {

  var user;
  var authToken;

  // set the test routes for this controller method
  before(function(){
    app.use(jwt({secret: config.secrets.session}));
    app.use('/test/auth', express.Router().get('/', test));
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
      .get('/test/auth/')
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
      .get('/test/auth/')
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
