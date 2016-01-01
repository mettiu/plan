'use strict';

var express = require('express');
var chai = require('chai');
var expect = chai.expect;
var _ = require('lodash');
var app = require('../../app');
var companyController = require('./company.controller.js');
var Company = require('./company.model');
var utils = require('../../components/utils')
var request = require('supertest');

describe('Company - Test method: create', function () {

  var company;

  // set company variable with test data
  before(function () {
    company = {
      name: "test company",
      info: "test company info"
    };
  });

  describe('Model test', function () {

    // remove all companies from DB
    after(function (done) {
      utils.mongooseRemoveAll([Company], done);
    });

    it('should create a company', function (done) {
      Company.create(company, function (err, created) {
        if (err) return done(err);
        Company.count({}, function (err, count) {
          if (err) return done(err);
          expect(count).to.be.equal(1);
          return done();
        });
      });
    });


  });

  describe('Controller test', function () {

    // set the test route for this controller method
    before(function () {
      app.use('/test/company/create', express.Router().post('/', companyController.create));
    });


    // remove all companies from DB
    after(function (done) {
      utils.mongooseRemoveAll([Company], done);
    });

    it('should create company', function (done) {
      request(app)
        .post('/test/company/create')
        .send(company)
        .expect(201)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) return done(err);
          Company.count({}, function (err, count) {
            if (err) return done(err);
            expect(count).to.be.equal(1);
            return done();
          });
        });
    });

  });

});

describe('Company - Test method: list', function () {

  var companyList = [];
  var listSize = 10;

  // set test data
  before(function (done) {
    var company = {
      name: "test company",
      info: "test company info"
    };
    for (var i = 0; i < listSize; i++) {
      companyList.push(_.clone(company));
    }
    companyList[0].active = false; // set one company as non-active
    utils.mongooseCreate(Company, companyList, done)
  });

  // remove all companies from DB
  after(function (done) {
    utils.mongooseRemoveAll([Company], done);
  });

  describe('Model test', function () {

    it('should list companies', function (done) {
      Company.find({active: true}, function (err, list) {
        if (err) return done(err);
        expect(list).to.be.instanceof(Array);
        expect(list.length).to.be.equal(listSize - 1);
        return done();
      })

    });

  });

  describe('Controller test', function () {

    // set the test route for this controller method
    before(function () {
      app.use('/test/company', express.Router().get('/', companyController.index));
    });

    it('should list all companies', function (done) {
      request(app)
        .get('/test/company')
        .send()
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) return done(err);
          expect(res.body).to.be.instanceof(Array);
          expect(res.body.length).to.be.equal(listSize);
          return done();
        });
    });

    it('should list all active companies', function (done) {
      request(app)
        .get('/test/company')
        .send({active: true})
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) return done(err);
          expect(res.body).to.be.instanceof(Array);
          expect(res.body.length).to.be.equal(listSize - 1);
          return done();
        });
    });

    it('should list all active companies', function (done) {
      request(app)
        .get('/test/company')
        .send({active: false})
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) return done(err);
          expect(res.body).to.be.instanceof(Array);
          expect(res.body.length).to.be.equal(1);
          return done();
        });
    });

  });

});


