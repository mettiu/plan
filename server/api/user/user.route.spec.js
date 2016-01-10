'use strict';

var chai = require('chai');
var expect = chai.expect;
chai.use(require('chai-datetime'));
chai.use(require('chai-interface'));
var should = require('should');
var faker = require('faker');
var request = require('supertest');
var _ = require('lodash');
faker.locale = "it";
var jwt = require('jsonwebtoken');
var async = require('async');
var app = require('../../app');
var config = require('../../config/environment');
var User = require('./user.model');
var Company = require('../company/company.model');
var Category = require('../category/category.model');
var Team = require('../team/team.model');

var userTemplate = {provider: 'local', name: 'Fake User', email: 'test@test.com', password: 'password'};
var targetUserTemplate = {provider: 'local', name: 'Fake Target User', email: 'target@test.com', password: 'password'};

var metalCompanyTemplate = {name: 'Metal Company', info: 'Description for Metal Comapny'};
var drinkCompanyTemplate = {name: 'Drink Company', info: 'Description for Drink Comapny'};

var ironCategoryTemplate = {name: 'IronHard', description: 'Description for Iron Category'};
var colaCategoryTemplate = {name: 'ColaCoke', description: 'Description for Cola Category'};

var steelTeamTemplate = {name: 'Steel', description: 'Description for Steel Team'};
var liquidTeamTemplate = {name: 'Liquid', description: 'Description for Liquid Team'};

describe('User Routes', function () {

  var user = null;

  before(function (done) {
    User.remove().exec().then(function () {
      Company.remove().exec().then(function () {
        Category.remove().exec().then(function () {
          Team.remove().exec().then(function () {
            return done();
          });
        });
      });
    });
  });

  before(function (done) {
    var localUserTemplate = _.clone(userTemplate);
    User.create(localUserTemplate, function (err, savedItem) {
      if (err) return done(err);
      user = savedItem;
      return done();
    });
  });

  after(function (done) {
    User.remove().exec().then(function () {
      Company.remove().exec().then(function () {
        Category.remove().exec().then(function () {
          Team.remove().exec().then(function () {
            return done();
          });
        });
      });
    });
  });

  it('should login user', function (done) {
    restLogin(userTemplate.email, userTemplate.password, function (err, res) {
      if (err) return done(err);
      res.body.should.be.instanceOf(Object);
      res.body.should.have.property('token');
      jwt.verify(res.body.token, config.secrets.session, function (err, decoded) {
        if (err) return done(err);
        decoded._id.should.be.equal('' + user._id);
        return done();
      });
    });
  });
});

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


