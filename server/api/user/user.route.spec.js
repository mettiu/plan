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
    User.createNew(localUserTemplate, function (err, savedItem) {
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

describe('Test setSupplyCategory and setTeam', function () {

  var user = null;
  var targetUser = null;

  describe('Prepare environment with companies, categories and teams', function () {
    var metalCompany = null;
    var drinkCompany = null;

    var ironCategory = null;
    var colaCategory = null;

    var steelTeam = null;
    var liquidTeam = null;

    var tokenCookieString = '';

    var catMessage = {
      addressedUserId: null,
      addressedCompanyId: null,
      newSupplyCategoryIds: []
    };

    var teamMessage = {
      addressedUserId: null,
      addressedCompanyId: null,
      newTeamIds: []
    };
    // prepare companies, categories and teams
    before(function (done) {
      var localMetalCompanyTemplate = _.clone(metalCompanyTemplate);
      var localDrinkCompanyTemplate = _.clone(drinkCompanyTemplate);

      var localIronCategoryTemplate = _.clone(ironCategoryTemplate);
      var localColaCategoryTemplate = _.clone(colaCategoryTemplate);

      var localSteelTeamTemplate = _.clone(steelTeamTemplate);
      var localLiquidTeamTemplate = _.clone(liquidTeamTemplate);

      async.series(
        [
          function (cb) {
            Company.create(localMetalCompanyTemplate, function (err, saved) {
              if (err) return cb(err);
              metalCompany = saved;
              localIronCategoryTemplate._company = metalCompany._id;
              localSteelTeamTemplate._company = metalCompany._id;

              return cb(null, metalCompany);
            })
          },
          function (cb) {
            Company.create(localDrinkCompanyTemplate, function (err, saved) {
              if (err) return cb(err);
              drinkCompany = saved;
              localColaCategoryTemplate._company = drinkCompany._id;
              localLiquidTeamTemplate._company = drinkCompany._id;
              return cb(null, drinkCompany);
            })
          },
          function (cb) {
            Category.create(localIronCategoryTemplate, function (err, saved) {
              if (err) return cb(err);
              ironCategory = saved;
              return cb(null, ironCategory);
            })
          },
          function (cb) {
            Category.create(localColaCategoryTemplate, function (err, saved) {
              if (err) return cb(err);
              colaCategory = saved;
              return cb(null, colaCategory);
            })
          },
          function (cb) {
            Team.create(localSteelTeamTemplate, function (err, saved) {
              if (err) return cb(err);
              steelTeam = saved;
              return cb(null, steelTeam);
            })
          },
          function (cb) {
            Team.create(localLiquidTeamTemplate, function (err, saved) {
              if (err) return cb(err);
              liquidTeam = saved;
              return cb(null, liquidTeam);
            })
          }
        ],
        function (err, results) {
          if (err) return done(err);
          return done();
        });
    });

    // reset message, in order to let each test prepare it as needed
    beforeEach(function () {
      catMessage = {
        addressedUserId: null,
        addressedCompanyId: null,
        newSupplyCategoryIds: []
      };
    });

    after(function (done) {
      async.each([User, Company, Category, Team], function (model, cb) {
        model.remove(function (err) {
          if (err) cb(err);
          cb();
        });
      }, function (err) {
        if (err) return done(err);
        return done();
      });
    });

    // user---
    // companies: metal
    // adminCompanies: metal
    // message---
    // addressedUser: self
    // addressedCompany: metal
    describe('Test scenario 1.1 (self)', function () {

      // prepare user
      before(function (done) {
        var localUserTemplate = _.clone(userTemplate);
        localUserTemplate._companies = [];
        localUserTemplate._adminCompanies = [];
        localUserTemplate._companies.push(metalCompany._id);
        localUserTemplate._adminCompanies.push(metalCompany._id);
        User.createNew(localUserTemplate, function (err, saved) {
          if (err) return cb(err);
          user = saved;
          return done();
        })
      });

      // login
      before(function (done) {
        restLogin(userTemplate.email, userTemplate.password, function (err, res) {
          if (err) return done(err);
          res.body.should.be.instanceOf(Object);
          res.body.should.have.property('token');
          jwt.verify(res.body.token, config.secrets.session, function (err, decoded) {
            if (err) return done(err);
            decoded._id.should.be.equal('' + user._id);
            tokenCookieString = res.body.token;
            return done();
          });
        });
      });

      // remove users
      after(function (done) {
        async.each([User], function (model, cb) {
          model.remove(function (err) {
            if (err) cb(err);
            cb();
          });
        }, function (err) {
          if (err) return done(err);
          return done();
        });
      });

      it('should add user\'s category (only once!) starting with empty array', function (done) {
        catMessage.addressedUserId = '' + user._id;
        catMessage.addressedCompanyId = '' + metalCompany._id;
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            User.findById(user._id, function (err, foundUser) {
              if (err) return done(err);
              expect(foundUser.supplyCategories).to.be.instanceOf(Array);
              expect(foundUser.supplyCategories).to.have.length(1);
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_company');
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_category');
              expect(foundUser.supplyCategories[0]._company.toString()).to.be.equal(metalCompany._id.toString());
              expect(foundUser.supplyCategories[0]._category.toString()).to.be.equal(ironCategory._id.toString());
              return done();
            });
          });
      });

      it('should add user\'s category (only once!) starting with non-empty array', function (done) {
        catMessage.addressedUserId = '' + user._id;
        catMessage.addressedCompanyId = '' + metalCompany._id;
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            User.findById(user._id, function (err, foundUser) {
              if (err) return done(err);
              expect(foundUser.supplyCategories).to.be.instanceOf(Array);
              expect(foundUser.supplyCategories).to.have.length(1);
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_company');
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_category');
              expect(foundUser.supplyCategories[0]._company.toString()).to.be.equal(metalCompany._id.toString());
              expect(foundUser.supplyCategories[0]._category.toString()).to.be.equal(ironCategory._id.toString());
              return done();
            });
          });
      });

      it('should not add user\'s category for a company for which user is not admin and addressed user is not enabled for', function (done) {
        catMessage.addressedUserId = '' + user._id;
        catMessage.addressedCompanyId = '' + metalCompany._id;
        catMessage.newSupplyCategoryIds.push('' + colaCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(422)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            User.findById(user._id, function (err, foundUser) {
              if (err) return done(err);
              expect(foundUser.supplyCategories).to.be.instanceOf(Array);
              expect(foundUser.supplyCategories).to.have.length(1);
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_company');
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_category');
              expect(foundUser.supplyCategories[0]._company.toString()).to.be.equal(metalCompany._id.toString());
              expect(foundUser.supplyCategories[0]._category.toString()).to.be.equal(ironCategory._id.toString());
              return done();
            });
          });
      });

    });

    // user---
    // companies: metal, drink
    // adminCompanies: metal
    // message---
    // addressedUser: self
    // addressedCompany: metal
    describe('Test scenario 1.2 (self)', function () {

      // prepare user
      before(function (done) {
        var localUserTemplate = _.clone(userTemplate);
        localUserTemplate._companies = [];
        localUserTemplate._adminCompanies = [];
        localUserTemplate._companies.push(metalCompany._id);
        localUserTemplate._companies.push(drinkCompany._id);
        localUserTemplate._adminCompanies.push(metalCompany._id);
        User.createNew(localUserTemplate, function (err, saved) {
          if (err) return cb(err);
          user = saved;
          return done();
        })
      });

      // login
      before(function (done) {
        restLogin(userTemplate.email, userTemplate.password, function (err, res) {
          if (err) return done(err);
          res.body.should.be.instanceOf(Object);
          res.body.should.have.property('token');
          jwt.verify(res.body.token, config.secrets.session, function (err, decoded) {
            if (err) return done(err);
            decoded._id.should.be.equal('' + user._id);
            tokenCookieString = res.body.token;
            return done();
          });
        });
      });

      // remove users
      after(function (done) {
        async.each([User], function (model, cb) {
          model.remove(function (err) {
            if (err) cb(err);
            cb();
          });
        }, function (err) {
          if (err) return done(err);
          return done();
        });
      });

      it('should add user\'s category (only once!) starting with empty array', function (done) {
        catMessage.addressedUserId = '' + user._id;
        catMessage.addressedCompanyId = '' + metalCompany._id;
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            User.findById(user._id, function (err, foundUser) {
              if (err) return done(err);
              expect(foundUser.supplyCategories).to.be.instanceOf(Array);
              expect(foundUser.supplyCategories).to.have.length(1);
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_company');
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_category');
              expect(foundUser.supplyCategories[0]._company.toString()).to.be.equal(metalCompany._id.toString());
              expect(foundUser.supplyCategories[0]._category.toString()).to.be.equal(ironCategory._id.toString());
              return done();
            });
          });
      });

      it('should add user\'s category (only once!) starting with non-empty array', function (done) {
        catMessage.addressedUserId = '' + user._id;
        catMessage.addressedCompanyId = '' + metalCompany._id;
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            User.findById(user._id, function (err, foundUser) {
              if (err) return done(err);
              expect(foundUser.supplyCategories).to.be.instanceOf(Array);
              expect(foundUser.supplyCategories).to.have.length(1);
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_company');
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_category');
              expect(foundUser.supplyCategories[0]._company.toString()).to.be.equal(metalCompany._id.toString());
              expect(foundUser.supplyCategories[0]._category.toString()).to.be.equal(ironCategory._id.toString());
              return done();
            });
          });
      });

      it('should not add user\'s category for a company for which user is not admin and addressed user is not enabled for', function (done) {
        catMessage.addressedUserId = '' + user._id;
        catMessage.addressedCompanyId = '' + metalCompany._id;
        catMessage.newSupplyCategoryIds.push('' + colaCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(422)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            User.findById(user._id, function (err, foundUser) {
              if (err) return done(err);
              expect(foundUser.supplyCategories).to.be.instanceOf(Array);
              expect(foundUser.supplyCategories).to.have.length(1);
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_company');
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_category');
              expect(foundUser.supplyCategories[0]._company.toString()).to.be.equal(metalCompany._id.toString());
              expect(foundUser.supplyCategories[0]._category.toString()).to.be.equal(ironCategory._id.toString());
              return done();
            });
          });
      });

    });

    // user---
    // companies: metal
    // adminCompanies: metal, drink
    // message---
    // addressedUser: self
    // addressedCompany: metal
    describe('Test scenario 1.3 (self)', function () {

      // prepare user
      before(function (done) {
        var localUserTemplate = _.clone(userTemplate);
        localUserTemplate._companies = [];
        localUserTemplate._adminCompanies = [];
        localUserTemplate._companies.push(metalCompany._id);
        localUserTemplate._adminCompanies.push(metalCompany._id);
        localUserTemplate._adminCompanies.push(drinkCompany._id);
        User.createNew(localUserTemplate, function (err, saved) {
          if (err) return cb(err);
          user = saved;
          return done();
        })
      });

      // login
      before(function (done) {
        restLogin(userTemplate.email, userTemplate.password, function (err, res) {
          if (err) return done(err);
          res.body.should.be.instanceOf(Object);
          res.body.should.have.property('token');
          jwt.verify(res.body.token, config.secrets.session, function (err, decoded) {
            if (err) return done(err);
            decoded._id.should.be.equal('' + user._id);
            tokenCookieString = res.body.token;
            return done();
          });
        });
      });

      // remove users
      after(function (done) {
        async.each([User], function (model, cb) {
          model.remove(function (err) {
            if (err) cb(err);
            cb();
          });
        }, function (err) {
          if (err) return done(err);
          return done();
        });
      });

      it('should add user\'s category (only once!) starting with empty array', function (done) {
        catMessage.addressedUserId = '' + user._id;
        catMessage.addressedCompanyId = '' + metalCompany._id;
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            User.findById(user._id, function (err, foundUser) {
              if (err) return done(err);
              expect(foundUser.supplyCategories).to.be.instanceOf(Array);
              expect(foundUser.supplyCategories).to.have.length(1);
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_company');
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_category');
              expect(foundUser.supplyCategories[0]._company.toString()).to.be.equal(metalCompany._id.toString());
              expect(foundUser.supplyCategories[0]._category.toString()).to.be.equal(ironCategory._id.toString());
              return done();
            });
          });
      });

      it('should add user\'s category (only once!) starting with non-empty array', function (done) {
        catMessage.addressedUserId = '' + user._id;
        catMessage.addressedCompanyId = '' + metalCompany._id;
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            User.findById(user._id, function (err, foundUser) {
              if (err) return done(err);
              expect(foundUser.supplyCategories).to.be.instanceOf(Array);
              expect(foundUser.supplyCategories).to.have.length(1);
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_company');
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_category');
              expect(foundUser.supplyCategories[0]._company.toString()).to.be.equal(metalCompany._id.toString());
              expect(foundUser.supplyCategories[0]._category.toString()).to.be.equal(ironCategory._id.toString());
              return done();
            });
          });
      });

      it('should not add user\'s category for a company for which user is not admin and addressed user is not enabled for', function (done) {
        catMessage.addressedUserId = '' + user._id;
        catMessage.addressedCompanyId = '' + metalCompany._id;
        catMessage.newSupplyCategoryIds.push('' + colaCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(422)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            User.findById(user._id, function (err, foundUser) {
              if (err) return done(err);
              expect(foundUser.supplyCategories).to.be.instanceOf(Array);
              expect(foundUser.supplyCategories).to.have.length(1);
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_company');
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_category');
              expect(foundUser.supplyCategories[0]._company.toString()).to.be.equal(metalCompany._id.toString());
              expect(foundUser.supplyCategories[0]._category.toString()).to.be.equal(ironCategory._id.toString());
              return done();
            });
          });
      });

    });

    // user---
    // companies: metal, drink
    // adminCompanies: metal, drink
    // message---
    // addressedUser: self
    // addressedCompany: metal
    describe('Test scenario 1.4 (self)', function () {

      // prepare user
      before(function (done) {
        var localUserTemplate = _.clone(userTemplate);
        localUserTemplate._companies = [];
        localUserTemplate._adminCompanies = [];
        localUserTemplate._companies.push(metalCompany._id);
        localUserTemplate._companies.push(drinkCompany._id);
        localUserTemplate._adminCompanies.push(metalCompany._id);
        localUserTemplate._adminCompanies.push(drinkCompany._id);
        User.createNew(localUserTemplate, function (err, saved) {
          if (err) return cb(err);
          user = saved;
          return done();
        })
      });

      // login
      before(function (done) {
        restLogin(userTemplate.email, userTemplate.password, function (err, res) {
          if (err) return done(err);
          res.body.should.be.instanceOf(Object);
          res.body.should.have.property('token');
          jwt.verify(res.body.token, config.secrets.session, function (err, decoded) {
            if (err) return done(err);
            decoded._id.should.be.equal('' + user._id);
            tokenCookieString = res.body.token;
            return done();
          });
        });
      });

      // remove users
      after(function (done) {
        async.each([User], function (model, cb) {
          model.remove(function (err) {
            if (err) cb(err);
            cb();
          });
        }, function (err) {
          if (err) return done(err);
          return done();
        });
      });

      it('should add user\'s category (only once!) starting with empty array', function (done) {
        catMessage.addressedUserId = '' + user._id;
        catMessage.addressedCompanyId = '' + metalCompany._id;
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            User.findById(user._id, function (err, foundUser) {
              if (err) return done(err);
              expect(foundUser.supplyCategories).to.be.instanceOf(Array);
              expect(foundUser.supplyCategories).to.have.length(1);
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_company');
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_category');
              expect(foundUser.supplyCategories[0]._company.toString()).to.be.equal(metalCompany._id.toString());
              expect(foundUser.supplyCategories[0]._category.toString()).to.be.equal(ironCategory._id.toString());
              return done();
            });
          });
      });

      it('should add user\'s category (only once!) starting with non-empty array', function (done) {
        catMessage.addressedUserId = '' + user._id;
        catMessage.addressedCompanyId = '' + metalCompany._id;
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            User.findById(user._id, function (err, foundUser) {
              if (err) return done(err);
              expect(foundUser.supplyCategories).to.be.instanceOf(Array);
              expect(foundUser.supplyCategories).to.have.length(1);
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_company');
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_category');
              expect(foundUser.supplyCategories[0]._company.toString()).to.be.equal(metalCompany._id.toString());
              expect(foundUser.supplyCategories[0]._category.toString()).to.be.equal(ironCategory._id.toString());
              return done();
            });
          });
      });

      it('should not add user\'s category for a company for which user is not admin and addressed user is not enabled for', function (done) {
        catMessage.addressedUserId = '' + user._id;
        catMessage.addressedCompanyId = '' + metalCompany._id;
        catMessage.newSupplyCategoryIds.push('' + colaCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(422)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            User.findById(user._id, function (err, foundUser) {
              if (err) return done(err);
              expect(foundUser.supplyCategories).to.be.instanceOf(Array);
              expect(foundUser.supplyCategories).to.have.length(1);
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_company');
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_category');
              expect(foundUser.supplyCategories[0]._company.toString()).to.be.equal(metalCompany._id.toString());
              expect(foundUser.supplyCategories[0]._category.toString()).to.be.equal(ironCategory._id.toString());
              return done();
            });
          });
      });

    });

    // user---
    // companies: metal
    // adminCompanies: metal
    // message---
    // addressedUser: target user
    // addressedCompany: metal
    describe('Test scenario 2.1 (target user)', function () {

      // prepare user
      before(function (done) {
        var localUserTemplate = _.clone(userTemplate);
        localUserTemplate._companies = [];
        localUserTemplate._adminCompanies = [];
        localUserTemplate._companies.push(metalCompany._id);
        localUserTemplate._adminCompanies.push(metalCompany._id);
        User.createNew(localUserTemplate, function (err, saved) {
          if (err) return cb(err);
          user = saved;
          return done();
        })
      });

      // prepare target user
      before(function (done) {
        var localTargetUserTemplate = _.clone(targetUserTemplate);
        localTargetUserTemplate._companies = [];
        localTargetUserTemplate._adminCompanies = [];
        localTargetUserTemplate._companies.push(metalCompany._id);
        User.createNew(localTargetUserTemplate, function (err, saved) {
          if (err) return cb(err);
          targetUser = saved;
          return done();
        })
      });

      // login
      before(function (done) {
        restLogin(userTemplate.email, userTemplate.password, function (err, res) {
          if (err) return done(err);
          res.body.should.be.instanceOf(Object);
          res.body.should.have.property('token');
          jwt.verify(res.body.token, config.secrets.session, function (err, decoded) {
            if (err) return done(err);
            decoded._id.should.be.equal('' + user._id);
            tokenCookieString = res.body.token;
            return done();
          });
        });
      });

      // remove users
      after(function (done) {
        async.each([User], function (model, cb) {
          model.remove(function (err) {
            if (err) cb(err);
            cb();
          });
        }, function (err) {
          if (err) return done(err);
          return done();
        });
      });

      it('should add user\'s category (only once!) starting with empty array', function (done) {
        catMessage.addressedUserId = '' + targetUser._id;
        catMessage.addressedCompanyId = '' + metalCompany._id;
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            User.findById(targetUser._id, function (err, foundUser) {
              if (err) return done(err);
              expect(foundUser.supplyCategories).to.be.instanceOf(Array);
              expect(foundUser.supplyCategories).to.have.length(1);
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_company');
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_category');
              expect(foundUser.supplyCategories[0]._company.toString()).to.be.equal(metalCompany._id.toString());
              expect(foundUser.supplyCategories[0]._category.toString()).to.be.equal(ironCategory._id.toString());
              return done();
            });
          });
      });

      //it('should add user\'s team (only once!) starting with empty array', function (done) {
      //  teamMessage.addressedUserId = '' + targetUser._id;
      //  teamMessage.addressedCompanyId = '' + metalCompany._id;
      //  teamMessage.newTeamIds.push('' + steelTeam._id);
      //  teamMessage.newTeamIds.push('' + steelTeam._id);
      //  teamMessage.newTeamIds.push('' + steelTeam._id);
      //  teamMessage.newTeamIds.push('' + steelTeam._id);
      //  request(app)
      //    .post('/api/users/setTeams')
      //    .set('authorization', 'Bearer ' + tokenCookieString)
      //    .send(teamMessage)
      //    .expect(200)
      //    .expect('Content-Type', /json/)
      //    .end(function (err, res) {
      //      if (err) return done(err);
      //      User.findById(targetUser._id, function (err, foundUser) {
      //        if (err) return done(err);
      //        expect(foundUser.teams).to.be.instanceOf(Array);
      //        expect(foundUser.teams).to.have.length(1);
      //        expect(foundUser.teams[0]).to.have.hasOwnProperty('_company');
      //        expect(foundUser.teams[0]).to.have.hasOwnProperty('_category');
      //        expect(foundUser.teams[0]._company.toString()).to.be.equal(metalCompany._id.toString());
      //        expect(foundUser.teams[0]._category.toString()).to.be.equal(ironCategory._id.toString());
      //        return done();
      //      });
      //    });
      //});

      it('should add user\'s category (only once!) starting with non-empty array', function (done) {
        catMessage.addressedUserId = '' + targetUser._id;
        catMessage.addressedCompanyId = '' + metalCompany._id;
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            User.findById(targetUser._id, function (err, foundUser) {
              if (err) return done(err);
              expect(foundUser.supplyCategories).to.be.instanceOf(Array);
              expect(foundUser.supplyCategories).to.have.length(1);
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_company');
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_category');
              expect(foundUser.supplyCategories[0]._company.toString()).to.be.equal(metalCompany._id.toString());
              expect(foundUser.supplyCategories[0]._category.toString()).to.be.equal(ironCategory._id.toString());
              return done();
            });
          });
      });

      it('should not add user\'s category for a company for which user is not admin', function (done) {
        catMessage.addressedUserId = '' + targetUser._id;
        catMessage.addressedCompanyId = '' + drinkCompany._id;
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(422)
          //.expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            User.findById(targetUser._id, function (err, foundUser) {
              if (err) return done(err);
              expect(foundUser.supplyCategories).to.be.instanceOf(Array);
              expect(foundUser.supplyCategories).to.have.length(1);
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_company');
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_category');
              expect(foundUser.supplyCategories[0]._company.toString()).to.be.equal(metalCompany._id.toString());
              expect(foundUser.supplyCategories[0]._category.toString()).to.be.equal(ironCategory._id.toString());
              return done();
            });
          });
      });

      it('should not add user\'s category for a target user not enabled for category\'s company', function (done) {
        catMessage.addressedUserId = '' + targetUser._id;
        catMessage.addressedCompanyId = '' + metalCompany._id;
        catMessage.newSupplyCategoryIds.push('' + colaCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(422)
          //.expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            User.findById(targetUser._id, function (err, foundUser) {
              if (err) return done(err);
              expect(foundUser.supplyCategories).to.be.instanceOf(Array);
              expect(foundUser.supplyCategories).to.have.length(1);
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_company');
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_category');
              expect(foundUser.supplyCategories[0]._company.toString()).to.be.equal(metalCompany._id.toString());
              expect(foundUser.supplyCategories[0]._category.toString()).to.be.equal(ironCategory._id.toString());
              return done();
            });
          });
      });


    });

    // user---
    // companies: metal, drink
    // adminCompanies: metal
    // message---
    // addressedUser: target user
    // addressedCompany: metal
    describe('Test scenario 2.2 (target user)', function () {

      // prepare user
      before(function (done) {
        var localUserTemplate = _.clone(userTemplate);
        localUserTemplate._companies = [];
        localUserTemplate._adminCompanies = [];
        localUserTemplate._companies.push(metalCompany._id);
        localUserTemplate._companies.push(drinkCompany._id);
        localUserTemplate._adminCompanies.push(metalCompany._id);
        User.createNew(localUserTemplate, function (err, saved) {
          if (err) return cb(err);
          user = saved;
          return done();
        })
      });

      // prepare target user
      before(function (done) {
        var localTargetUserTemplate = _.clone(targetUserTemplate);
        localTargetUserTemplate._companies = [];
        localTargetUserTemplate._adminCompanies = [];
        localTargetUserTemplate._companies.push(metalCompany._id);

        User.createNew(localTargetUserTemplate, function (err, saved) {
          if (err) return cb(err);
          targetUser = saved;
          return done();
        })
      });

      // login
      before(function (done) {
        restLogin(userTemplate.email, userTemplate.password, function (err, res) {
          if (err) return done(err);
          res.body.should.be.instanceOf(Object);
          res.body.should.have.property('token');
          jwt.verify(res.body.token, config.secrets.session, function (err, decoded) {
            if (err) return done(err);
            decoded._id.should.be.equal('' + user._id);
            tokenCookieString = res.body.token;
            return done();
          });
        });
      });

      // remove users
      after(function (done) {
        async.each([User], function (model, cb) {
          model.remove(function (err) {
            if (err) cb(err);
            cb();
          });
        }, function (err) {
          if (err) return done(err);
          return done();
        });
      });

      it('should add user\'s category (only once!) starting with empty array', function (done) {
        catMessage.addressedUserId = '' + targetUser._id;
        catMessage.addressedCompanyId = '' + metalCompany._id;
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            User.findById(targetUser._id, function (err, foundUser) {
              if (err) return done(err);
              expect(foundUser.supplyCategories).to.be.instanceOf(Array);
              expect(foundUser.supplyCategories).to.have.length(1);
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_company');
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_category');
              expect(foundUser.supplyCategories[0]._company.toString()).to.be.equal(metalCompany._id.toString());
              expect(foundUser.supplyCategories[0]._category.toString()).to.be.equal(ironCategory._id.toString());
              return done();
            });
          });
      });

      it('should add user\'s category (only once!) starting with non-empty array', function (done) {
        catMessage.addressedUserId = '' + targetUser._id;
        catMessage.addressedCompanyId = '' + metalCompany._id;
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            User.findById(targetUser._id, function (err, foundUser) {
              if (err) return done(err);
              expect(foundUser.supplyCategories).to.be.instanceOf(Array);
              expect(foundUser.supplyCategories).to.have.length(1);
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_company');
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_category');
              expect(foundUser.supplyCategories[0]._company.toString()).to.be.equal(metalCompany._id.toString());
              expect(foundUser.supplyCategories[0]._category.toString()).to.be.equal(ironCategory._id.toString());
              return done();
            });
          });
      });

      it('should not add user\'s category for a company for which user is not admin', function (done) {
        catMessage.addressedUserId = '' + targetUser._id;
        catMessage.addressedCompanyId = '' + drinkCompany._id;
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(422)
          //.expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            User.findById(targetUser._id, function (err, foundUser) {
              if (err) return done(err);
              expect(foundUser.supplyCategories).to.be.instanceOf(Array);
              expect(foundUser.supplyCategories).to.have.length(1);
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_company');
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_category');
              expect(foundUser.supplyCategories[0]._company.toString()).to.be.equal(metalCompany._id.toString());
              expect(foundUser.supplyCategories[0]._category.toString()).to.be.equal(ironCategory._id.toString());
              return done();
            });
          });
      });

      it('should not add user\'s category for a target user not enabled for category\'s company', function (done) {
        catMessage.addressedUserId = '' + targetUser._id;
        catMessage.addressedCompanyId = '' + metalCompany._id;
        catMessage.newSupplyCategoryIds.push('' + colaCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(422)
          //.expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            User.findById(targetUser._id, function (err, foundUser) {
              if (err) return done(err);
              expect(foundUser.supplyCategories).to.be.instanceOf(Array);
              expect(foundUser.supplyCategories).to.have.length(1);
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_company');
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_category');
              expect(foundUser.supplyCategories[0]._company.toString()).to.be.equal(metalCompany._id.toString());
              expect(foundUser.supplyCategories[0]._category.toString()).to.be.equal(ironCategory._id.toString());
              return done();
            });
          });
      });


    });

    // user---
    // companies: metal
    // adminCompanies: metal, drink
    // message---
    // addressedUser: target user
    // addressedCompany: metal
    describe('Test scenario 2.3 (target user)', function () {

      // prepare user
      before(function (done) {
        var localUserTemplate = _.clone(userTemplate);
        localUserTemplate._companies = [];
        localUserTemplate._adminCompanies = [];
        localUserTemplate._companies.push(metalCompany._id);
        localUserTemplate._adminCompanies.push(metalCompany._id);
        localUserTemplate._adminCompanies.push(drinkCompany._id);
        User.createNew(localUserTemplate, function (err, saved) {
          if (err) return cb(err);
          user = saved;
          return done();
        })
      });

      // prepare target user
      before(function (done) {
        var localTargetUserTemplate = _.clone(targetUserTemplate);
        localTargetUserTemplate._companies = [];
        localTargetUserTemplate._adminCompanies = [];
        localTargetUserTemplate._companies.push(metalCompany._id);
        User.createNew(localTargetUserTemplate, function (err, saved) {
          if (err) return cb(err);
          targetUser = saved;
          return done();
        })
      });

      // login
      before(function (done) {
        restLogin(userTemplate.email, userTemplate.password, function (err, res) {
          if (err) return done(err);
          res.body.should.be.instanceOf(Object);
          res.body.should.have.property('token');
          jwt.verify(res.body.token, config.secrets.session, function (err, decoded) {
            if (err) return done(err);
            decoded._id.should.be.equal('' + user._id);
            tokenCookieString = res.body.token;
            return done();
          });
        });
      });

      // remove users
      after(function (done) {
        async.each([User], function (model, cb) {
          model.remove(function (err) {
            if (err) cb(err);
            cb();
          });
        }, function (err) {
          if (err) return done(err);
          return done();
        });
      });

      it('should add user\'s category (only once!) starting with empty array', function (done) {
        catMessage.addressedUserId = '' + targetUser._id;
        catMessage.addressedCompanyId = '' + metalCompany._id;
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            User.findById(targetUser._id, function (err, foundUser) {
              if (err) return done(err);
              expect(foundUser.supplyCategories).to.be.instanceOf(Array);
              expect(foundUser.supplyCategories).to.have.length(1);
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_company');
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_category');
              expect(foundUser.supplyCategories[0]._company.toString()).to.be.equal(metalCompany._id.toString());
              expect(foundUser.supplyCategories[0]._category.toString()).to.be.equal(ironCategory._id.toString());
              return done();
            });
          });
      });

      it('should add user\'s category (only once!) starting with non-empty array', function (done) {
        catMessage.addressedUserId = '' + targetUser._id;
        catMessage.addressedCompanyId = '' + metalCompany._id;
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            User.findById(targetUser._id, function (err, foundUser) {
              if (err) return done(err);
              expect(foundUser.supplyCategories).to.be.instanceOf(Array);
              expect(foundUser.supplyCategories).to.have.length(1);
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_company');
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_category');
              expect(foundUser.supplyCategories[0]._company.toString()).to.be.equal(metalCompany._id.toString());
              expect(foundUser.supplyCategories[0]._category.toString()).to.be.equal(ironCategory._id.toString());
              return done();
            });
          });
      });

      it('should not add user\'s category for a company for which user is not admin', function (done) {
        catMessage.addressedUserId = '' + targetUser._id;
        catMessage.addressedCompanyId = '' + drinkCompany._id;
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(422)
          //.expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            User.findById(targetUser._id, function (err, foundUser) {
              if (err) return done(err);
              expect(foundUser.supplyCategories).to.be.instanceOf(Array);
              expect(foundUser.supplyCategories).to.have.length(1);
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_company');
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_category');
              expect(foundUser.supplyCategories[0]._company.toString()).to.be.equal(metalCompany._id.toString());
              expect(foundUser.supplyCategories[0]._category.toString()).to.be.equal(ironCategory._id.toString());
              return done();
            });
          });
      });

      it('should not add user\'s category for a target user not enabled for category\'s company', function (done) {
        catMessage.addressedUserId = '' + targetUser._id;
        catMessage.addressedCompanyId = '' + metalCompany._id;
        catMessage.newSupplyCategoryIds.push('' + colaCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(422)
          //.expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            User.findById(targetUser._id, function (err, foundUser) {
              if (err) return done(err);
              expect(foundUser.supplyCategories).to.be.instanceOf(Array);
              expect(foundUser.supplyCategories).to.have.length(1);
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_company');
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_category');
              expect(foundUser.supplyCategories[0]._company.toString()).to.be.equal(metalCompany._id.toString());
              expect(foundUser.supplyCategories[0]._category.toString()).to.be.equal(ironCategory._id.toString());
              return done();
            });
          });
      });


    });

    // user---
    // companies: metal, drink
    // adminCompanies: metal, drink
    // message---
    // addressedUser: target user
    // addressedCompany: metal
    describe('Test scenario 2.4 (target user)', function () {

      // prepare user
      before(function (done) {
        var localUserTemplate = _.clone(userTemplate);
        localUserTemplate._companies = [];
        localUserTemplate._adminCompanies = [];
        localUserTemplate._companies.push(metalCompany._id);
        localUserTemplate._companies.push(drinkCompany._id);
        localUserTemplate._adminCompanies.push(metalCompany._id);
        localUserTemplate._adminCompanies.push(drinkCompany._id);
        User.createNew(localUserTemplate, function (err, saved) {
          if (err) return cb(err);
          user = saved;
          return done();
        })
      });

      // prepare target user
      before(function (done) {
        var localTargetUserTemplate = _.clone(targetUserTemplate);
        localTargetUserTemplate._companies = [];
        localTargetUserTemplate._adminCompanies = [];
        localTargetUserTemplate._companies.push(metalCompany._id);
        User.createNew(localTargetUserTemplate, function (err, saved) {
          if (err) return cb(err);
          targetUser = saved;
          return done();
        })
      });

      // login
      before(function (done) {
        restLogin(userTemplate.email, userTemplate.password, function (err, res) {
          if (err) return done(err);
          res.body.should.be.instanceOf(Object);
          res.body.should.have.property('token');
          jwt.verify(res.body.token, config.secrets.session, function (err, decoded) {
            if (err) return done(err);
            decoded._id.should.be.equal('' + user._id);
            tokenCookieString = res.body.token;
            return done();
          });
        });
      });

      // remove users
      after(function (done) {
        async.each([User], function (model, cb) {
          model.remove(function (err) {
            if (err) cb(err);
            cb();
          });
        }, function (err) {
          if (err) return done(err);
          return done();
        });
      });

      it('should add user\'s category (only once!) starting with empty array', function (done) {
        catMessage.addressedUserId = '' + targetUser._id;
        catMessage.addressedCompanyId = '' + metalCompany._id;
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            User.findById(targetUser._id, function (err, foundUser) {
              if (err) return done(err);
              expect(foundUser.supplyCategories).to.be.instanceOf(Array);
              expect(foundUser.supplyCategories).to.have.length(1);
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_company');
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_category');
              expect(foundUser.supplyCategories[0]._company.toString()).to.be.equal(metalCompany._id.toString());
              expect(foundUser.supplyCategories[0]._category.toString()).to.be.equal(ironCategory._id.toString());
              return done();
            });
          });
      });

      it('should add user\'s category (only once!) starting with non-empty array', function (done) {
        catMessage.addressedUserId = '' + targetUser._id;
        catMessage.addressedCompanyId = '' + metalCompany._id;
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            User.findById(targetUser._id, function (err, foundUser) {
              if (err) return done(err);
              expect(foundUser.supplyCategories).to.be.instanceOf(Array);
              expect(foundUser.supplyCategories).to.have.length(1);
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_company');
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_category');
              expect(foundUser.supplyCategories[0]._company.toString()).to.be.equal(metalCompany._id.toString());
              expect(foundUser.supplyCategories[0]._category.toString()).to.be.equal(ironCategory._id.toString());
              return done();
            });
          });
      });

      it('should not add user\'s category for a company for which user is not admin', function (done) {
        catMessage.addressedUserId = '' + targetUser._id;
        catMessage.addressedCompanyId = '' + drinkCompany._id;
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(422)
          //.expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            User.findById(targetUser._id, function (err, foundUser) {
              if (err) return done(err);
              expect(foundUser.supplyCategories).to.be.instanceOf(Array);
              expect(foundUser.supplyCategories).to.have.length(1);
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_company');
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_category');
              expect(foundUser.supplyCategories[0]._company.toString()).to.be.equal(metalCompany._id.toString());
              expect(foundUser.supplyCategories[0]._category.toString()).to.be.equal(ironCategory._id.toString());
              return done();
            });
          });
      });

      it('should not add user\'s category for a target user not enabled for category\'s company', function (done) {
        catMessage.addressedUserId = '' + targetUser._id;
        catMessage.addressedCompanyId = '' + metalCompany._id;
        catMessage.newSupplyCategoryIds.push('' + colaCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(422)
          //.expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            User.findById(targetUser._id, function (err, foundUser) {
              if (err) return done(err);
              expect(foundUser.supplyCategories).to.be.instanceOf(Array);
              expect(foundUser.supplyCategories).to.have.length(1);
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_company');
              expect(foundUser.supplyCategories[0]).to.have.hasOwnProperty('_category');
              expect(foundUser.supplyCategories[0]._company.toString()).to.be.equal(metalCompany._id.toString());
              expect(foundUser.supplyCategories[0]._category.toString()).to.be.equal(ironCategory._id.toString());
              return done();
            });
          });
      });


    });

    // user---
    // companies: metal
    // adminCompanies: metal
    // message---
    // addressedUser: target user <-- DRINK
    // addressedCompany: drink
    describe('Test scenario 3.1 (target user)', function () {

      // prepare user
      before(function (done) {
        var localUserTemplate = _.clone(userTemplate);
        localUserTemplate._companies = [];
        localUserTemplate._adminCompanies = [];
        localUserTemplate._companies.push(metalCompany._id);
        localUserTemplate._adminCompanies.push(metalCompany._id);
        User.createNew(localUserTemplate, function (err, saved) {
          if (err) return cb(err);
          user = saved;
          return done();
        })
      });

      // prepare target user
      before(function (done) {
        var localTargetUserTemplate = _.clone(targetUserTemplate);
        localTargetUserTemplate._companies = [];
        localTargetUserTemplate._adminCompanies = [];
        localTargetUserTemplate._companies.push(drinkCompany._id);
        User.createNew(localTargetUserTemplate, function (err, saved) {
          if (err) return cb(err);
          targetUser = saved;
          return done();
        })
      });

      // login
      before(function (done) {
        restLogin(userTemplate.email, userTemplate.password, function (err, res) {
          if (err) return done(err);
          res.body.should.be.instanceOf(Object);
          res.body.should.have.property('token');
          jwt.verify(res.body.token, config.secrets.session, function (err, decoded) {
            if (err) return done(err);
            decoded._id.should.be.equal('' + user._id);
            tokenCookieString = res.body.token;
            return done();
          });
        });
      });

      // remove users
      after(function (done) {
        async.each([User], function (model, cb) {
          model.remove(function (err) {
            if (err) cb(err);
            cb();
          });
        }, function (err) {
          if (err) return done(err);
          return done();
        });
      });

      it('should not add user\'s category (only once!) starting with empty array', function (done) {
        catMessage.addressedUserId = '' + targetUser._id;
        catMessage.addressedCompanyId = '' + metalCompany._id;
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(422)
          .end(function (err, res) {
            if (err) return done(err);
            return done();
          });
      });

      it('should not add user\'s category (only once!) starting with non-empty array', function (done) {
        catMessage.addressedUserId = '' + targetUser._id;
        catMessage.addressedCompanyId = '' + metalCompany._id;
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(422)
          .end(function (err, res) {
            if (err) return done(err);
            return done();
          });
      });

      it('should not add user\'s category for a company for which user is not admin', function (done) {
        catMessage.addressedUserId = '' + targetUser._id;
        catMessage.addressedCompanyId = '' + drinkCompany._id;
        catMessage.newSupplyCategoryIds.push('' + ironCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(422)
          .end(function (err, res) {
            if (err) return done(err);
            return done();
          });
      });

      it('should not add user\'s category for a target user not enabled for category\'s company', function (done) {
        catMessage.addressedUserId = '' + targetUser._id;
        catMessage.addressedCompanyId = '' + metalCompany._id;
        catMessage.newSupplyCategoryIds.push('' + colaCategory._id);
        request(app)
          .post('/api/users/setSupplyCategories')
          .set('authorization', 'Bearer ' + tokenCookieString)
          .send(catMessage)
          .expect(422)
          .end(function (err, res) {
            if (err) return done(err);
            return done();
          });
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


