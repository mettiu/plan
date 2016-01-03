'use strict';

var express = require('express');
var chai = require('chai');
var expect = chai.expect;
var _ = require('lodash');
var request = require('supertest');
var app = require('../../app');
var companyController = require('./company.controller.js');
var Company = require('./company.model');
var utils = require('../../components/utils');
var errorMiddleware = require('../../components/error-middleware');

function mountMiddleware () {
  app.use('/test/companies', express.Router().get('/', companyController.index));
  app.use('/test/companies', express.Router().get('/find', companyController.find));
  app.use('/test/companies', express.Router().post('/create', companyController.create));
  app.use('/test/companies', express.Router().get('/:id', companyController.show));
  errorMiddleware(app);
}

var companyTemplate = {
  name: "test company",
  info: "test company info"
};

describe('Company controller', function () {

  // remove all companies from DB to start with a clean environment
  before(function (done) {
    utils.mongooseRemoveAll([Company], done);
  });

  // set the test routes for this controller method
  before(mountMiddleware);

  describe('Company - Test method: create', function () {

    var company;

    // set company variable with test data
    before(function () {
      company = _.clone(companyTemplate);
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

      // remove all companies from DB
      after(function (done) {
        utils.mongooseRemoveAll([Company], done);
      });

      it('should create company', function (done) {
        request(app)
          .post('/test/companies/create')
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

  describe('Company - Test method: list and find', function () {

    var companyList = [];
    var listSize = 10;

    // set test data
    before(function (done) {
      for (var i = 0; i < listSize; i++) {
        companyList.push(_.clone(companyTemplate));
      }
      companyList[0].active = false; // set one company as non-active
      companyList[1].name = "flowers company";
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

      it('should list all companies', function (done) {
        request(app)
          .get('/test/companies')
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
          .get('/test/companies')
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
          .get('/test/companies')
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

      it('should find all test active companies', function (done) {
        request(app)
          .get('/test/companies/find?value=test')
          .send()
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            expect(res.body).to.be.instanceof(Array);
            expect(res.body.length).to.be.equal(listSize - 2);
            return done();
          });
      });

      it('should find all active companies (query parameter = \'\')', function (done) {
        request(app)
          .get('/test/companies/find?value=')
          .send()
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            expect(res.body).to.be.instanceof(Array);
            expect(res.body.length).to.be.equal(listSize - 1);
            return done();
          });
      });

    });

  });

  describe('Company - Test method: show', function() {

    var company;

    // set company test data
    before(function () {
      company = _.clone(companyTemplate);

      Company.create(company, function(err, inserted) {
        if (err) return done(err);
        return company = inserted;
      });

    });

    // remove all companies from DB
    after(function (done) {
      utils.mongooseRemoveAll([Company], done);
    });

    describe('Model test', function() {

      it('should find the company', function(done) {
        Company.findById(company._id, function(err, found) {
          if (err) return done(err);
          expect(found).to.be.an.instanceOf(Company);
          return done();
        });
      });

    });

    describe('Controller test', function() {

      it('should find the company', function (done) {
        request(app)
          .get('/test/companies/' + company._id)
          .send()
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            expect(res.body).to.be.instanceof(Object);
            expect(res.body._id.toString()).to.be.equal(company._id.toString());
            return done();
          });
      });

      it('should not find the company by a fake id', function (done) {
        request(app)
          .get('/test/companies/your id here')
          .send()
          .expect(404)
          //.expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            return done();
          });
      });

    });

  });

});

