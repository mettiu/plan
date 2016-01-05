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
  auth = require('./auth.service'),
  User = require('../api/user/user.model'),
  Company = require('../api/company/company.model'),
  Category = require('../api/category/category.model');

var userTemplate = {provider: 'local', name: 'Fake User One', email: 'testone@test.com', password: 'passwordone'};
var companyTemplate = {name: "test company", info: "test company info", adminUsers: []};
var categoryTemplate = {name: "test category", description: "test category description"};
var userTemplateArray = [
  {provider: 'local', name: 'Fake User One', email: 'testone@test.com', password: 'passwordone'},
  {provider: 'local', name: 'Fake User Two', email: 'testtwo@test.com', password: 'passwordtwo'},
  {provider: 'local', name: 'Fake User Three', email: 'testthree@test.com', password: 'passwordthree'}
];

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
 * Test function that returns req[name] as a response with http 200.
 * If name is not passed, it defaults to 'target'.
 * @param req
 * @param res
 * @param next
 */
function returnReqData(name) {
  if (!name) name = 'target';
  return function(req, res, next) {
    if (!req[name]) return res.status(599).send("ERROR");
    return res.status(200).json(req[name]);
  }
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
    errorMiddleware(router);
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
    errorMiddleware(router);
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

/**
 * Test attachTargetObjectIdToRequest middleware
 */
describe('attachTargetObjectIdToRequest middleware test', function () {

  var testPath = '/test/auth/attachTargetObjectIdToRequest';
  var testId = mongoose.Types.ObjectId();

  // set the test routes for this controller method
  before(function () {
    var router = express.Router();

    //one route to test the middleware with no parameter
    router.get('/',
      auth.attachTargetObjectIdToRequest('company'),
      returnReqData('company'));

    //one route to test the middleware with a parameter
    router.get('/:id',
      auth.attachTargetObjectIdToRequest('company'),
      returnReqData('company'));
    app.use(testPath, router);

    errorMiddleware(router);
  });

  it('should attach target id to request', function (done) {
    request(app)
      .get(testPath + '/' + testId.toString())
      .send()
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) return done(err);
        expect(res.body).to.have.property('_id', testId.toString());
        return done();
      });
  });

  it('should not attach target id to request', function (done) {
    request(app)
      .get(testPath + '/')
      .send()
      .expect(599)
      //.expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) return done(err);
        return done();
      });
  });

});

/**
 * Test attachTargetCompanyToRequest middleware
 */
describe('attachTargetCompanyToRequest middleware test', function () {

  var testPath = '/test/auth/attachTargetCompanyToRequest';
  var company;
  var category;

  // set the test routes for this controller method
  before(function () {
    var router = express.Router();
    router.use(
      auth.attachTargetCompanyToRequest
    );
    app.use(testPath, router.get('/', returnReqData('company')));
    errorMiddleware(router);
  });

  // create the company needed for category tests
  before(function (done) {
    company = _.clone(companyTemplate);
    Company.create(company, function (err, created) {
      if (err) return done(err);
      company = created;
      return done();
    });
  });

  // set category test data
  before(function (done) {
    category = _.clone(categoryTemplate);
    category._company = company._id;

    Category.create(category, function (err, inserted) {
      if (err) return done(err);
      category = inserted;
      return done();
    });
  });

  // remove all User, Company, Category from DB
  after(function (done) {
    utils.mongooseRemoveAll([User, Company, Category], done);
  });

  it('should attach target company to request', function (done) {
    request(app)
      .get(testPath)
      .send(category)
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) return done(err);
        expect(res.body).to.have.property('_id', company._id.toString());
        expect(res.body).to.have.property('name', company.name);
        expect(res.body).to.have.property('info', company.info);
        return done();
      });
  });

  it('should not attach target company to request if company\'s id is missing', function (done) {
    request(app)
      .get(testPath)
      .send(categoryTemplate)
      .expect(400)
      //.expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) return done(err);
        return done();
      });
  });

  it('should not attach target company to request if company object is missing', function (done) {
    request(app)
      .get(testPath)
      .send({})
      .expect(400)
      //.expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) return done(err);
        return done();
      });
  });

  it('should not attach target company to request if company id is wrong', function (done) {
    company._id = mongoose.Types.ObjectId();
    request(app)
      .get(testPath)
      .send(company)
      .expect(400)
      //.expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) return done(err);
        return done();
      });
  });

  it('should not attach target company to request if company id is wrong and malformed', function (done) {
    company._id = 'fake-id';
    request(app)
      .get(testPath)
      .send(company)
      .expect(400)
      //.expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) return done(err);
        return done();
      });
  });

});

/**
 * Test isAdminForTargetCompany middleware
 */
describe('isAdminForTargetCompany middleware test', function () {

  var testPath = '/test/auth/isAdminForTargetCompany';
  var userArray;
  var company;
  var category;
  var user;

  // set the test routes for this controller method
  before(function () {
    var router = express.Router();
    router.use(
      auth.getTokenFromQuery,
      auth.jwtMiddleware,
      auth.attachUserToRequest,
      auth.attachTargetCompanyToRequest,
      auth.isAdminForTargetCompany
    );
    app.use(testPath, router.get('/', returnReqData('company')));
    errorMiddleware(router);
  });

  // set users test data
  before(function (done) {
    userArray = _.clone(userTemplateArray);

    User.create(userArray, function (err, insertedArray) {
      if (err) return done(err);
      insertedArray.forEach(function (item, i) {
        userArray[i] = item;
      });
      return done();
    });

  });

  // create the company needed for category tests
  before(function (done) {
    company = _.clone(companyTemplate);
    userArray.forEach(function(user, i) {
      if (i <= 1) company.adminUsers.push(user._id); // insert only 2 on 3 users as admin
    });
    Company.create(company, function (err, created) {
      if (err) return done(err);
      company = created;
      return done();
    });
  });

  // set category test data
  before(function (done) {
    category = _.clone(categoryTemplate);
    category._company = company._id;

    Category.create(category, function (err, inserted) {
      if (err) return done(err);
      category = inserted;
      return done();
    });
  });

  // remove all User, Company, Category from DB
  after(function (done) {
    utils.mongooseRemoveAll([User, Company, Category], done);
  });

  describe('test with 1st authorized user', function() {

    var authToken;

    // login user
    before(function (done) {

      user = userArray[0];

      restLogin(user.email, user.password, function (err, res) {
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

    it('should authorize', function (done) {
      request(app)
        .get(testPath)
        .set('authorization', 'Bearer ' + authToken)
        .send(category)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) return done(err);
          expect(res.body).to.have.property('_id', company._id.toString());
          expect(res.body).to.have.property('name', company.name);
          expect(res.body).to.have.property('info', company.info);
          return done();
        });
    });

  });

  describe('test with 2nd authorized user', function() {

    var authToken;

    // login user
    before(function (done) {

      user = userArray[1];

      restLogin(user.email, user.password, function (err, res) {
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

    it('should authorize', function (done) {
      request(app)
        .get(testPath)
        .set('authorization', 'Bearer ' + authToken)
        .send(category)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) return done(err);
          expect(res.body).to.have.property('_id', company._id.toString());
          expect(res.body).to.have.property('name', company.name);
          expect(res.body).to.have.property('info', company.info);
          return done();
        });
    });

  });

  describe('test with 3rd authorized user', function() {

    var authToken;

    // login user
    before(function (done) {

      user = userArray[2];

      restLogin(user.email, user.password, function (err, res) {
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

    it('should NOT authorize', function (done) {
      request(app)
        .get(testPath)
        .set('authorization', 'Bearer ' + authToken)
        .send(category)
        .expect(401)
        //.expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) return done(err);
          return done();
        });
    });

  });

});
