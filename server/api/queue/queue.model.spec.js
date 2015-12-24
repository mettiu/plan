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
var Queue = require('./queue.model');
var Company = require('../company/company.model');

var queueTemplate = {
  title: 'Queue test',
  description: 'Queue description'
};

var companyTemplate = {
  name: faker.company.companyName() + ' ' + faker.company.companySuffix(),
  info: faker.lorem.sentence()
};

var company = null;

describe('Queue Model Creation', function () {
  before(function (done) {
    // Clear users and companies before testing
    Queue.remove().exec().then(function () {
      Company.remove().exec().then(function () {
        company = new Company(companyTemplate);
        company.save(function (err) {
          if (err) return done(err);
          queueTemplate._company = company._id;
          return done();
        });
      });
    });
  });

  after(function (done) {
    Queue.remove().exec().then(function () {
      Company.remove().exec().then(function () {
      done();
      });
    });
  });

  it('should create a queue', function(done) {
    Queue.createNew(queueTemplate, function(err) {
      if (err) return done(err);
      return done();
    });
  });

  it('should not create a queue with a short name', function(done) {
    var queueLocalTemplate = _.clone(queueTemplate);
    queueLocalTemplate.title = 'az'; // shortest title!
    Queue.createNew(queueLocalTemplate, function (err) {
      //console.log(err.errors);
      expect(err).to.exist;
      return done();
    });
  });

  it('should not create a queue without a company', function(done) {
    var queueLocalTemplate = _.clone(queueTemplate);
    delete queueLocalTemplate._company;
    Queue.createNew(queueLocalTemplate, function (err) {
      expect(err).to.exist;
      return done();
    });
  });

});
