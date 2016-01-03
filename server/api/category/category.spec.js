'use strict';

var express = require('express');
var chai = require('chai');
var expect = chai.expect;
var _ = require('lodash');
var request = require('supertest');
var mongoose = require('mongoose');
var app = require('../../app');
var categoryController = require('./category.controller.js');
var Category = require('./category.model');
var Company = require('../company/company.model');
var User = require('../user/user.model');
var utils = require('../../components/utils');
var errorMiddleware = require('../../components/error-middleware');

function mountMiddleware() {
  app.use('/test/categories', express.Router().post('/create', categoryController.create));
  //app.use('/test/categories', express.Router().get('/', categoryController.index));
  //app.use('/test/categories', express.Router().get('/find', categoryController.find));
  //app.use('/test/categories', express.Router().get('/:id', categoryController.show));
  //app.use('/test/categories', express.Router().put('/:id', categoryController.update));
  //app.use('/test/categories', express.Router().delete('/:id', categoryController.destroy));
  errorMiddleware(app);
}

var categoryTemplate = {
  name: "test category",
  description: "test category description"
};

var companyTemplate = {
  name: "test company",
  info: "test company info"
};

describe('Category controller', function () {

  var company;

  // remove all categories from DB to start with a clean environment
  before(function (done) {
    utils.mongooseRemoveAll([Category, Company], done);
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

  // set the test routes for this controller method
  before(mountMiddleware);

  describe('Category - Test method: create', function () {

    var category;

    // set company variable with test data
    before(function () {
      category = _.clone(categoryTemplate);
      category._company = company._id;
    });

    describe('Model test', function () {

      // remove all companies from DB
      after(function (done) {
        utils.mongooseRemoveAll([Category], done);
      });

      it('should create a category', function (done) {
        Category.create(category, function (err, created) {
          if (err) return done(err);
          Category.count({}, function (err, count) {
            if (err) return done(err);
            expect(count).to.be.equal(1);
            return done();
          });
        });
      });

    });

    describe('Controller test', function () {

      // remove all categories from DB
      after(function (done) {
        utils.mongooseRemoveAll([Category], done);
      });

      it('should create category', function (done) {
        request(app)
          .post('/test/categories/create')
          .send(category)
          .expect(201)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            Category.count({}, function (err, count) {
              if (err) return done(err);
              expect(count).to.be.equal(1);
              return done();
            });
          });
      });

    });

  });






});
