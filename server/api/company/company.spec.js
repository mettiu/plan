'use strict';

var express = require('express');
var chai = require('chai');
var expect = chai.expect;
var _ = require('lodash');
var request = require('supertest');
var mongoose = require('mongoose');
var app = require('../../app');
var companyController = require('./company.controller.js');
var Company = require('./company.model');
var User = require('../user/user.model');
var utils = require('../../components/utils');
var errorMiddleware = require('../../components/error-middleware');

function mountMiddleware() {
  app.use('/test/companies', express.Router().post('/create', companyController.create));
  app.use('/test/companies', express.Router().get('/', companyController.index));
  app.use('/test/companies', express.Router().get('/find', companyController.find));
  app.use('/test/companies', express.Router().get('/:id', companyController.show));
  app.use('/test/companies', express.Router().put('/:id', companyController.update));
  app.use('/test/companies', express.Router().delete('/:id', companyController.destroy));
  errorMiddleware(app);
}

var companyTemplate = {
  name: "test company",
  info: "test company info"
};

var userTemplateArray = [
  {provider: 'local', name: 'Fake User One', email: 'testone@test.com', password: 'passwordone'},
  {provider: 'local', name: 'Fake User Two', email: 'testtwo@test.com', password: 'passwordtwo'}
];

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

  describe('Company - Test method: show', function () {

    var company;

    // set company test data
    before(function () {
      company = _.clone(companyTemplate);

      Company.create(company, function (err, inserted) {
        if (err) return done(err);
        return company = inserted;
      });

    });

    // remove all companies from DB
    after(function (done) {
      utils.mongooseRemoveAll([Company], done);
    });

    describe('Model test', function () {

      it('should find the company', function (done) {
        Company.findById(company._id, function (err, found) {
          if (err) return done(err);
          expect(found).to.be.an.instanceOf(Company);
          return done();
        });
      });

      it('should not find the company', function (done) {
        Company.findById(mongoose.Types.ObjectId(), function (err, found) {
          if (err) return done(err);
          expect(found).to.be.null;
          return done();
        });
      });

    });

    describe('Controller test', function () {

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

      it('should not find the company by a fake id, even if well formatted', function (done) {
        request(app)
          .get('/test/companies/' + mongoose.Types.ObjectId())
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

  describe('Company - Test method: update', function () {

    var company;
    var userArray;

    // set users test data
    before(function (done) {
      userArray = _.clone(userTemplateArray);

      User.create(userArray, function (err, insertedArray) {
        if (err) return done(err);
        insertedArray.forEach(function (item, i) {
          userArray[i] = item;
        });
        return done();
      });

    });

    // set company test data
    beforeEach(function (done) {
      company = _.clone(companyTemplate);
      company.adminUsers = [userArray[0]._id];
      company.purchaseUsers = [userArray[0]._id, userArray[1]._id];
      company.teamUsers = [userArray[0]._id];

      Company.create(company, function (err, inserted) {
        if (err) return done(err);
        company = inserted;
        return done();
      });
    });

    // prepare company test data
    beforeEach(function (done) {
      company.adminUsers = [userArray[0]._id, userArray[1]._id];
      company.purchaseUsers = [userArray[0]._id];
      company.teamUsers = [userArray[0]._id, userArray[1]._id];
      return done();
    });

    // remove all companies from DB
    afterEach(function (done) {
      utils.mongooseRemoveAll([Company], done);
    });

    // remove all companies and users from DB
    after(function (done) {
      utils.mongooseRemoveAll([Company, User], done);
    });

    describe('Model test', function () {

      it('should update the company', function (done) {
        expect(company.adminUsers).to.have.length(2);
        expect(company.purchaseUsers).to.have.length(1);
        expect(company.teamUsers).to.have.length(2);
        company.save(function (err, saved) {
          if (err) return done(err);
          expect(saved).to.be.an.instanceOf(Company);
          expect(saved).to.have.property('_id', company._id);
          expect(saved.adminUsers).to.have.length(2);
          expect(saved.purchaseUsers).to.have.length(1);
          expect(saved.teamUsers).to.have.length(2);
          return done();
        });
      });

    });

    describe('Controller test', function () {

      it('should update the company', function (done) {
        expect(company.adminUsers).to.have.length(2);
        expect(company.purchaseUsers).to.have.length(1);
        expect(company.teamUsers).to.have.length(2);
        request(app)
          .put('/test/companies/' + company._id)
          .send(company)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            expect(res.body).to.have.property('_id', company._id.toString());
            expect(res.body.adminUsers).to.have.length(2);
            expect(res.body.purchaseUsers).to.have.length(1);
            expect(res.body.teamUsers).to.have.length(2);
            return done();
          });
      });

      it('should not update the company if a fake id is sent', function (done) {
        expect(company.adminUsers).to.have.length(2);
        expect(company.purchaseUsers).to.have.length(1);
        expect(company.teamUsers).to.have.length(2);
        request(app)
          .put('/test/companies/' + 'fake id')
          .send(company)
          .expect(404)
          //.expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            return done();
          });
      });

      it('should not update the company if a fake id is sent, even id it\'s a valid objectId', function (done) {
        expect(company.adminUsers).to.have.length(2);
        expect(company.purchaseUsers).to.have.length(1);
        expect(company.teamUsers).to.have.length(2);
        request(app)
          .put('/test/companies/' + mongoose.Types.ObjectId())
          .send(company)
          .expect(404)
          //.expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            return done();
          });
      });

    });

  });

  describe('Company - Test method: destroy', function () {

    var company;

    // set company test data
    beforeEach(function (done) {
      company = _.clone(companyTemplate);

      Company.create(company, function (err, inserted) {
        if (err) return done(err);
        company = inserted;
        return done();
      });

    });

    // remove all companies from DB
    afterEach(function (done) {
      utils.mongooseRemoveAll([Company], done);
    });

    describe('Model test', function () {

      it('should delete the company', function (done) {
        company.remove(function (err) {
          if (err) return done(err);
          return done();
        });
      });

    });

    describe('Controller test', function () {

      it('should delete the company', function (done) {
        request(app)
          .delete('/test/companies/' + company._id)
          .send()
          .expect(204)
          //.expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            Company.count({'_id': company._id}, function (err, c) {
              if (err) return done(err);
              expect(c).to.be.equal(0);
              return done();
            });
          });
      });

      it('should not delete the company with a fake id', function (done) {
        request(app)
          .delete('/test/companies/' + 'fake id')
          .send()
          .expect(404)
          //.expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            Company.count({'_id': company._id}, function (err, c) {
              if (err) return done(err);
              expect(c).to.be.equal(1);
              return done();
            });
          });
      });

      it('should not delete the company with a fake id, even if well formatted', function (done) {
        request(app)
          .delete('/test/companies/' + mongoose.Types.ObjectId())
          .send()
          .expect(404)
          //.expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            Company.count({'_id': company._id}, function (err, c) {
              if (err) return done(err);
              expect(c).to.be.equal(1);
              return done();
            });
          });
      });

    });

  });

});

