'use strict';

var chai = require('chai');
var expect = chai.expect;
chai.use(require('chai-datetime'));
chai.use(require('chai-interface'));
var faker = require('faker');
var _ = require('lodash');
faker.locale = "it";
var ms = require('ms');
var request = require('supertest');
var app = require('../../app');
var User = require('../user/user.model');
var Team = require('./team.model');
var Company = require('../company/company.model');

var teamTemplate = {
  name: 'Test Team',
  description: 'Description for Test team'
};

var companyTemplate = {
  name: faker.company.companyName() + ' ' + faker.company.companySuffix(),
  info: faker.lorem.sentence()
};

var company = null;

describe('Test for Team creation', function () {
  before(function (done) {
    Team.remove().exec().then(function () {
      Company.remove().exec().then(function () {
        company = new Company(companyTemplate);
        company.save(function (err) {
          if (err) return done(err);
          return done();
        });
      });
    });
  });
  after(function (done) {
    Team.remove().exec().then(function () {
      Company.remove().exec().then(function () {
        company = null;
        return done();
      });
    });
  });

  it('should begin with 1 company', function (done) {
    Company.find({}, function (err, items) {
      if (err) return done(err);
      expect(items).to.have.length(1);
      return done();
    });
  });

  it('should not create a Category without Company', function(done) {
    Team.createNew(teamTemplate, function(err) {
      expect(err).to.exist;
      if (err) return done();
    });
  });

  it('should create a Category with Company', function(done) {
    teamTemplate._company = company._id;
    Team.createNew(teamTemplate, function(err, savedItem) {
      if (err) return done(err);
      expect(savedItem).to.exist;
      return done();
    });
  });


});
