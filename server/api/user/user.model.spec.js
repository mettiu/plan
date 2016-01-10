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
var app = require('../../app');
var User = require('./user.model');
var Company = require('../company/company.model');
var Category = require('../category/category.model');
var Team = require('../team/team.model');
var utils = require('../../components/utils');

var userTemplate = {provider: 'local', name: 'Fake User', email: 'test@test.com', password: 'password'};

//var metalCompanyTemplate = {name: 'Metal Company', info: 'Description for Metal Comapny'};
//var drinkCompanyTemplate = {name: 'Drink Company', info: 'Description for Drink Comapny'};
//
//var ironCategoryTemplate = {name: 'IronHard', description: 'Description for Iron Category'};
//var colaCategoryTemplate = {name: 'ColaCoke', description: 'Description for Cola Category'};
//
//var steelTeamTemplate = {name: 'Steel', description: 'Description for Steel Team'};
//var liquidTeamTemplate = {name: 'Liquid', description: 'Description for Liquid Team'};

var companyTemplateArray = [
  {name: "test company one", info: "test company one info", purchaseUsers: [], teamUsers: [], adminUsers: [], active: false},
  {name: "test company two", info: "test company one two", purchaseUsers: [], teamUsers: [], adminUsers: []},
  {name: "test company three", info: "test company one three", purchaseUsers: [], teamUsers: [], adminUsers: []}
];

var userTemplateArray = [
  {provider: 'local', name: 'Fake User One', email: 'testone@test.com', password: 'passwordone'},
  {provider: 'local', name: 'Fake User Two', email: 'testtwo@test.com', password: 'passwordtwo'}
];

describe('User Model', function () {
  before(function (done) {
    // Clear users and companies before testing
    User.remove().exec().then(function () {
      Company.remove().exec().then(function () {
        Category.remove().exec().then(function () {
          done();
        })
      });
    });

  });

  after(function (done) {
    // Clear users and companies after testing
    User.remove().exec().then(function () {
      Company.remove().exec().then(function () {
        Category.remove().exec().then(function () {
          Team.remove().exec().then(function () {
            done();
          });
        });
      });
    });
  });

  describe('Standard tests', function () {
    before(function (done) {
      User.remove().exec().then(function () {
        done();
      });
    });

    after(function (done) {
      User.remove().exec().then(function () {
        done();
      });
    });

    it('should begin with no users', function (done) {
      User.find({}, function (err, users) {
        if (err) return done(err);
        users.should.have.length(0);
        done();
      });
    });

    it('should save the test user', function (done) {
      User.create(userTemplate, function (err, savedItem) {
        if (err) return done(err);
        User.find({}, function (err, users) {
          users.should.have.length(1);
          done();
        });
      });
    });

    it('should fail when saving a duplicate user', function (done) {
      User.create(userTemplate, function (err, savedItem) {
        expect(err).to.exist;
        expect(savedItem).to.not.exist;
        done();
      });
    });

    it('should fail when saving without an email', function (done) {
      var withoutEmailUserTemplate = _.clone(userTemplate);
      withoutEmailUserTemplate.email = '';
      User.create(withoutEmailUserTemplate, function (err, savedItem) {
        expect(err).to.exist;
        expect(savedItem).to.not.exist;
        done();
      });
    });

    it("should find user by email", function (done) {
      var foundUser = User.findByEmail(userTemplate.email, function (err, item) {
        if (err) return done(err);
        item.should.be.instanceOf(Object);
        item.should.have.property('_id');
        done();
      })
    });

    it("should not find user by email if a unexistant email is provided", function (done) {
      var foundUser = User.findByEmail('fake-wrong-email@example.com', function (err, item) {
        if (err) return done(err);
        should.not.exist(item);
        return done();
      })
    });
  });

  describe('Test User Authentication', function () {
    var user = null;

    before(function (done) {
      User.remove().exec().then(function () {
        User.create(userTemplate, function (err, savedItem) {
          if (err) return done(err);
          user = savedItem;
          User.find({}, function (err, users) {
            if (err) return done(err);
            users.should.have.length(1);
            done();
          });
        });
      });
    });

    after(function (done) {
      User.remove().exec().then(function () {
        done();
      });
    });

    it("should authenticate user if password is valid", function () {
      return user.authenticate('password').should.be.true;
    });

    it("should not authenticate user if password is invalid", function () {
      return user.authenticate('blah').should.not.be.true;
    });
  });

  //describe('Test User with SupplyCategories and teams', function () {
  //  var user = null;
  //  var ironCategory = null;
  //  var colaCategory = null;
  //  var metalCompany = null;
  //  var drinkCompany = null;
  //  var steelTeam = null;
  //  var liquidTeam = null;
  //
  //  beforeEach(function (done) {
  //    User.remove().exec().then(function () {
  //
  //      var localIronCategoryTemplate = _.clone(ironCategoryTemplate);
  //      var localColaCategoryTemplate = _.clone(colaCategoryTemplate);
  //
  //      var localSteelTeamTemplate = _.clone(steelTeamTemplate);
  //      var localLiquidTeamTemplate = _.clone(liquidTeamTemplate);
  //
  //      Company.create(metalCompanyTemplate, function (err, savedMetalCompany) {
  //        if (err) return done(err);
  //        metalCompany = savedMetalCompany;
  //
  //        Company.create(drinkCompanyTemplate, function (err, savedDrinkCompany) {
  //          if (err) return done(err);
  //          drinkCompany = savedDrinkCompany;
  //
  //          localIronCategoryTemplate._company = metalCompany._id;
  //          Category.create(localIronCategoryTemplate, function (err, savedIronCategory) {
  //            if (err) return done(err);
  //            ironCategory = savedIronCategory;
  //
  //            localColaCategoryTemplate._company = drinkCompany._id;
  //            Category.create(localColaCategoryTemplate, function (err, savedColaCategory) {
  //              if (err) return done(err);
  //              colaCategory = savedColaCategory;
  //
  //              localSteelTeamTemplate._company = metalCompany._id;
  //              Team.create(localSteelTeamTemplate, function (err, savedSteelTeam) {
  //                if (err) return done(err);
  //                steelTeam = savedSteelTeam;
  //
  //                localLiquidTeamTemplate._company = drinkCompany._id;
  //                Team.create(localLiquidTeamTemplate, function (err, savedLiquidTeam) {
  //                  if (err) return done(err);
  //                  liquidTeam = savedLiquidTeam;
  //
  //                  var localUserTemplate = _.clone(userTemplate);
  //                  localUserTemplate._companies = [];
  //                  localUserTemplate._companies.push(metalCompany._id);
  //                  User.createNew(localUserTemplate, function (err, savedItem) {
  //                    if (err) return done(err);
  //                    user = savedItem;
  //                    return done();
  //                  });
  //                });
  //              });
  //            });
  //          });
  //        });
  //      });
  //    });
  //  });
  //
  //  afterEach(function (done) {
  //    // Clear users and companies after testing
  //    User.remove().exec().then(function () {
  //      Company.remove().exec().then(function () {
  //        Category.remove().exec().then(function () {
  //          Team.remove().exec().then(function () {
  //            done();
  //          });
  //        });
  //      });
  //    });
  //  });
  //
  //  describe('Test User with SupplyCategories', function () {
  //
  //    it('should add a category to user, removing duplicate company/category pairs', function (done) {
  //      user.supplyCategories.push({
  //        _company: metalCompany._id,
  //        _category: ironCategory._id
  //      });
  //      user.supplyCategories.push({
  //        _company: metalCompany._id,
  //        _category: ironCategory._id
  //      });
  //      user.save(function (err) {
  //        if (err) return done(err);
  //        expect(user.supplyCategories).to.have.length(1);
  //        return done();
  //      });
  //    });
  //
  //    it('should not add a company/category pair to user if user does not have that company', function (done) {
  //      user.supplyCategories.push({
  //        _company: metalCompany._id,
  //        _category: ironCategory._id
  //      });
  //      user.supplyCategories.push({ // this company should not be allowed!!
  //        _company: drinkCompany._id,
  //        _category: colaCategory._id
  //      });
  //      user.save(function (err) {
  //        expect(err).to.exist;
  //        if (err) return done();
  //        return done("SHOULD NOT BE HERE!");
  //      });
  //    });
  //
  //    it('should not add a company/category pair to user if user does not have that company (2)', function (done) {
  //      user.supplyCategories.push({
  //        _company: metalCompany._id,
  //        _category: ironCategory._id
  //      });
  //      user.supplyCategories.push({ // this company should not be allowed!!
  //        _company: drinkCompany._id,
  //        _category: ironCategory._id
  //      });
  //      user.save(function (err) {
  //        expect(err).to.exist;
  //        if (err) return done();
  //        return done("SHOULD NOT BE HERE!");
  //      });
  //    });
  //
  //    it('should not add a company/category pair to user if category is not linked to users\'s companies', function (done) {
  //      user.supplyCategories.push({
  //        _company: metalCompany._id,
  //        _category: ironCategory._id
  //      });
  //      user.supplyCategories.push({ // this company should not be allowed!!
  //        _company: metalCompany._id,
  //        _category: colaCategory._id
  //      });
  //      user.save(function (err) {
  //        expect(err).to.exist;
  //        if (err) return done();
  //        return done("SHOULD NOT BE HERE!");
  //      });
  //    });
  //
  //  });
  //
  //  describe('Test User with Teams', function () {
  //
  //    it('should add a team to user, removing duplicate company/team pairs', function (done) {
  //      user.teams.push({
  //        _company: metalCompany._id,
  //        _team: steelTeam._id
  //      });
  //      user.teams.push({
  //        _company: metalCompany._id,
  //        _team: steelTeam._id
  //      });
  //      user.save(function (err) {
  //        if (err) return done(err);
  //        expect(user.teams).to.have.length(1);
  //        return done();
  //      });
  //    });
  //
  //    it('should not add a company/team pair to user if user does not have that company', function (done) {
  //      user.teams.push({
  //        _company: metalCompany._id,
  //        _team: steelTeam._id
  //      });
  //      user.teams.push({ // this company should not be allowed!!
  //        _company: drinkCompany._id,
  //        _team: liquidTeam._id
  //      });
  //      user.save(function (err) {
  //        expect(err).to.exist;
  //        if (err) return done();
  //        return done("SHOULD NOT BE HERE!");
  //      });
  //    });
  //
  //    it('should not add a company/team pair to user if user does not have that team (2)', function (done) {
  //      user.teams.push({
  //        _company: metalCompany._id,
  //        _team: steelTeam._id
  //      });
  //      user.teams.push({ // this company should not be allowed!!
  //        _company: drinkCompany._id,
  //        _team: steelTeam._id
  //      });
  //      user.save(function (err) {
  //        expect(err).to.exist;
  //        if (err) return done();
  //        return done("SHOULD NOT BE HERE!");
  //      });
  //    });
  //
  //    it('should not add a company/team pair to user if team is not linked to users\'s companies', function (done) {
  //      user.teams.push({
  //        _company: metalCompany._id,
  //        _team: steelTeam._id
  //      });
  //      user.teams.push({ // this company should not be allowed!!
  //        _company: metalCompany._id,
  //        _team: liquidTeam._id
  //      });
  //      user.save(function (err) {
  //        expect(err).to.exist;
  //        if (err) return done();
  //        return done("SHOULD NOT BE HERE!");
  //      });
  //    });
  //
  //  });
  //
  //});

});

describe('User - Test method: findCompanies', function () {

  var companyArray = _.clone(companyTemplateArray);
  var userArray = _.clone(userTemplateArray);

  // remove all Company, User from DB to start with a clean environment
  before(function (done) {
    utils.mongooseRemoveAll([Company, User], done);
  });

  userArray.forEach(function (currentValue, index) {
    before(function (done) {
      User.create(currentValue, function (err, inserted) {
        if (err) return done(err);
        userArray[index] = inserted;
        return done();
      });
    });
  });

  //set user/company data
  before(function (done) {
    companyArray[0].purchaseUsers.push(userArray[0]._id);
    companyArray[0].teamUsers.push(userArray[1]._id);
    companyArray[1].teamUsers.push(userArray[0]._id);
    companyArray[2].purchaseUsers.push(userArray[1]._id);
    companyArray[2].adminUsers.push(userArray[1]._id);
    done();
  });

  companyArray.forEach(function (currentValue, index) {
    before(function (done) {
      Company.create(currentValue, function (err, inserted) {
        if (err) return done(err);
        companyArray[index] = inserted;
        return done();
      });
    });
  });

  // remove all Company, User from DB
  after(function (done) {
    utils.mongooseRemoveAll([Company, User], done);
  });

  describe('Model test', function () {

    it('should list companies for user 0 (no options parameter)', function (done) {

      var options = {
        admin: false,
        team: true,
        purchase: true,
        onlyActive: null
      };

      userArray[0].findCompanies( null, function (err, list) {
        if (err) return done(err);

        expect(list.length).to.be.equal(1);

        done();
      });
    });

    it('should list companies for user 0 (set options parameter - all false)', function (done) {

      var options = {
        admin: false,
        team: false,
        purchase: false,
        active: null
      };

      Company.findByUser(userArray[0]._id, options, function (err, list) {
        if (err) return done(err);

        expect(list.length).to.be.equal(0);

        done();
      });
    });

    it('should list companies for user 0 (set options parameter - all true)', function (done) {

      var options = {
        admin: true,
        team: true,
        purchase: true,
        onlyActive: null
      };

      Company.findByUser(userArray[0]._id, options, function (err, list) {
        if (err) return done(err);

        expect(list.length).to.be.equal(1);

        done();
      });
    });

    it('should list companies for user 0 (set options parameter - all true, even inactive)', function (done) {

      var options = {
        admin: true,
        team: true,
        purchase: true,
        onlyActive: false
      };

      Company.findByUser(userArray[0]._id, options, function (err, list) {
        if (err) return done(err);

        expect(list.length).to.be.equal(2);

        done();
      });
    });

    it('should list companies for user 1 (set options parameter - not admin)', function (done) {

      var options = {
        admin: false,
        team: true,
        purchase: true,
        onlyActive: null
      };

      Company.findByUser(userArray[1]._id, options, function (err, list) {
        if (err) return done(err);

        expect(list.length).to.be.equal(1);

        done();
      });
    });

    it('should list companies for user 1 (set options parameter - all true, even inactive)', function (done) {

      var options = {
        admin: true,
        team: true,
        purchase: true,
        onlyActive: false
      };

      Company.findByUser(userArray[1]._id, options, function (err, list) {
        if (err) return done(err);

        expect(list.length).to.be.equal(2);

        done();
      });
    });

    it('should list companies for user 1 (set options parameter - only admin)', function (done) {

      var options = {
        admin: true,
        team: false,
        purchase: false,
        onlyActive: true
      };

      Company.findByUser(userArray[1]._id, options, function (err, list) {
        if (err) return done(err);

        expect(list.length).to.be.equal(1);

        done();
      });
    });


  });

});


