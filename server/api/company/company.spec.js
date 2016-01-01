'use strict';

var express = require('express');
var chai = require('chai');
var expect = chai.expect;
var app = require('../../app');
var companyController = require('./company.controller.js');
var Company = require('./company.model');
var utils = require('../../components/utils')
var request = require('supertest');

var company;

describe('Test Company creation', function () {

  // remove all companies from DB
  afterEach(function (done) {
    utils.mongooseRemoveAll([Company], done);
  });

  // set company variable with test data
  before(function() {
    company = {
      name: "test company",
      info: "test company info"
    };
  });

  describe('Model test', function() {

    describe('Test method: create', function() {
      it('should create a company', function (done) {
        Company.create(company, function (err, created) {
          if (err) return done(err);
          Company.count({}, function(err, count) {
            if (err) return done(err);
            expect(count).to.be.equal(1);
            return done();
          });
        });
      });
    });
  });

  describe('Controller test', function() {

    // set the test route for this controller method
    before(function () {
      app.use('/test/company/create', express.Router().post('/', companyController.create));
    });

    describe('Test method: create', function () {

      it('should create company', function (done) {
        request(app)
          .post('/test/company/create')
          .send(company)
          .expect(201)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            Company.count({}, function(err, count) {
              if (err) return done(err);
              expect(count).to.be.equal(1);
              return done();
            });
          });
      });

    });

  });

});

//describe('Test Company controller', function () {
//
//  var req = {};
//  var res = {};
//
//
//
//
//  after(function (done) {
//    utils.mongooseRemoveAll([Company], done);
//  });
//
//  describe('Test create company', function () {
//
//    req.body = company;
//
//    it('should create company', function (done) {
//      request(app)
//        .post('/api/company/test')
//        .send(company)
//        .expect(201)
//        .expect('Content-Type', /json/)
//        .end(function (err, res) {
//          if (err) return done(err);
//          done();
//        });
//    })
//  });
//
//});


//describe('GET /api/companies', function() {
//
//  it('should respond with JSON array', function(done) {
//    request(app)
//      .get('/api/companies')
//      .expect(200)
//      .expect('Content-Type', /json/)
//      .end(function(err, res) {
//        if (err) return done(err);
//        res.body.should.be.instanceof(Array);
//        done();
//      });
//  });
//});
