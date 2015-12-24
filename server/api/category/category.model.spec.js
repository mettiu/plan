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
var Category = require('./category.model');
var Company = require('../company/company.model');

var categoryTemplate = {
  name: 'Test Category',
  description: 'Description for Test category'
};

var companyTemplate = {
  name: faker.company.companyName() + ' ' + faker.company.companySuffix(),
  info: faker.lorem.sentence()
};

var company = null;

describe('Test for Category creation', function () {
  before(function (done) {
    Category.remove().exec().then(function () {
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
    Category.remove().exec().then(function () {
      Company.remove().exec().then(function () {
        company = null;
        return done();
      });
    });
  });

  //it('should begin with 1 company', function (done) {
  //  Company.find({}, function (err, items) {
  //    if (err) return done(err);
  //    expect(items).to.have.length(1);
  //    return done();
  //  });
  //});
  //
  //it('should not create a Category without Company', function(done) {
  //  Category.createNew(categoryTemplate, function(err) {
  //    expect(err).to.exist;
  //    if (err) return done();
  //  });
  //});
  //
  //it('should create a Category with Company', function(done) {
  //  categoryTemplate._company = company._id;
  //  Category.createNew(categoryTemplate, function(err, savedItem) {
  //    if (err) return done(err);
  //    expect(savedItem).to.exist;
  //    return done();
  //  });
  //});


});
