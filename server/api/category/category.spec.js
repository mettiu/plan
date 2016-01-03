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
  app.use('/test/categories', express.Router().get('/', categoryController.index));
  app.use('/test/categories', express.Router().get('/find', categoryController.find));
  app.use('/test/categories', express.Router().get('/:id', categoryController.show));
  app.use('/test/categories', express.Router().put('/:id', categoryController.update));
  app.use('/test/categories', express.Router().delete('/:id', categoryController.destroy));
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

var userTemplateArray = [
  {provider: 'local', name: 'Fake User One', email: 'testone@test.com', password: 'passwordone'},
  {provider: 'local', name: 'Fake User Two', email: 'testtwo@test.com', password: 'passwordtwo'}
];

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

    // set category variable with test data
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

  describe('Category - Test method: list and find', function () {

    var categoryList = [];
    var listSize = 10;

    // set test data
    before(function (done) {
      var category = _.clone(categoryTemplate);
      category._company = company._id;
      for (var i = 0; i < listSize; i++) {
        categoryList.push(_.clone(category));
      }
      categoryList[0].active = false; // set one category as non-active
      categoryList[1].name = "flowers category";
      utils.mongooseCreate(Category, categoryList, done)
    });

    // remove all categories from DB
    after(function (done) {
      utils.mongooseRemoveAll([Category], done);
    });

    describe('Model test', function () {

      it('should list categories', function (done) {
        Category.find({active: true}, function (err, list) {
          if (err) return done(err);
          expect(list).to.be.instanceof(Array);
          expect(list.length).to.be.equal(listSize - 1);
          return done();
        })

      });

    });

    describe('Controller test', function () {

      it('should list all categories', function (done) {
        request(app)
          .get('/test/categories')
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

      it('should list all active categories', function (done) {
        request(app)
          .get('/test/categories')
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

      it('should list all active categories', function (done) {
        request(app)
          .get('/test/categories')
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

      it('should find all test active categories', function (done) {
        request(app)
          .get('/test/categories/find?value=test')
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

      it('should find all active categories (query parameter = \'\')', function (done) {
        request(app)
          .get('/test/categories/find?value=')
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

  describe('Category - Test method: show', function () {

    var category;

    // set category test data
    before(function (done) {
      category = _.clone(categoryTemplate);
      category._company = company._id;

      Category.create(category, function (err, inserted) {
        if (err) return done(err);
        category = inserted;
        return done();
      });

    });

    // remove all categories from DB
    after(function (done) {
      utils.mongooseRemoveAll([Category], done);
    });

    describe('Model test', function () {

      it('should find the category', function (done) {
        Category.findById(category._id, function (err, found) {
          if (err) return done(err);
          expect(found).to.be.an.instanceOf(Category);
          return done();
        });
      });

      it('should not find the category', function (done) {
        Category.findById(mongoose.Types.ObjectId(), function (err, found) {
          if (err) return done(err);
          expect(found).to.be.null;
          return done();
        });
      });

    });

    describe('Controller test', function () {

      it('should find the category', function (done) {
        request(app)
          .get('/test/categories/' + category._id)
          .send()
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            expect(res.body).to.be.instanceof(Object);
            expect(res.body._id.toString()).to.be.equal(category._id.toString());
            return done();
          });
      });

      it('should not find the category by a fake id', function (done) {
        request(app)
          .get('/test/categories/your id here')
          .send()
          .expect(404)
          //.expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            return done();
          });
      });

      it('should not find the category by a fake id, even if well formatted', function (done) {
        request(app)
          .get('/test/categories/' + mongoose.Types.ObjectId())
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

  describe('Category - Test method: update', function () {

    var category;
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

    // set category test data
    beforeEach(function (done) {
      category = _.clone(companyTemplate);
      category._company = company._id;
      category.purchaseUsers = [userArray[0]._id, userArray[1]._id];

      Category.create(category, function (err, inserted) {
        if (err) return done(err);
        category = inserted;
        return done();
      });
    });

    // prepare category test data
    beforeEach(function (done) {
      category.purchaseUsers = [userArray[0]._id];
      return done();
    });

    // remove all companies from DB
    afterEach(function (done) {
      utils.mongooseRemoveAll([Category], done);
    });

    // remove all companies and users from DB
    after(function (done) {
      utils.mongooseRemoveAll([Company, User], done);
    });

    describe('Model test', function () {

      it('should update the category', function (done) {
        expect(category.purchaseUsers).to.have.length(1);
        category.save(function (err, saved) {
          if (err) return done(err);
          expect(saved).to.be.an.instanceOf(Category);
          expect(saved).to.have.property('_id', category._id);
          expect(saved.purchaseUsers).to.have.length(1);
          return done();
        });
      });

    });

    describe('Controller test', function () {

      it('should update the category', function (done) {
        expect(category.purchaseUsers).to.have.length(1);
        request(app)
          .put('/test/categories/' + category._id)
          .send(category)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            expect(res.body).to.have.property('_id', category._id.toString());
            expect(res.body.purchaseUsers).to.have.length(1);
            return done();
          });
      });

      it('should not update the category if a fake id is sent', function (done) {
        expect(category.purchaseUsers).to.have.length(1);
        request(app)
          .put('/test/categories/' + 'fake id')
          .send(category)
          .expect(404)
          //.expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            return done();
          });
      });

      it('should not update the category if a fake id is sent, even id it\'s a valid objectId', function (done) {
        expect(category.purchaseUsers).to.have.length(1);
        request(app)
          .put('/test/categories/' + mongoose.Types.ObjectId())
          .send(category)
          .expect(404)
          //.expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            return done();
          });
      });

    });

  });

  describe('Category - Test method: destroy', function () {

    var category;

    // set category test data
    beforeEach(function (done) {
      category = _.clone(companyTemplate);
      category._company = company._id;

      Category.create(category, function (err, inserted) {
        if (err) return done(err);
        category = inserted;
        return done();
      });

    });

    // remove all companies from DB
    afterEach(function (done) {
      utils.mongooseRemoveAll([Category], done);
    });

    describe('Model test', function () {

      it('should delete the category', function (done) {
        category.remove(function (err) {
          if (err) return done(err);
          return done();
        });
      });

    });

    describe('Controller test', function () {

      it('should delete the category', function (done) {
        request(app)
          .delete('/test/categories/' + category._id)
          .send()
          .expect(204)
          //.expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            Category.count({'_id': category._id}, function (err, c) {
              if (err) return done(err);
              expect(c).to.be.equal(0);
              return done();
            });
          });
      });

      it('should not delete the category with a fake id', function (done) {
        request(app)
          .delete('/test/categories/' + 'fake id')
          .send()
          .expect(404)
          //.expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            Category.count({'_id': category._id}, function (err, c) {
              if (err) return done(err);
              expect(c).to.be.equal(1);
              return done();
            });
          });
      });

      it('should not delete the category with a fake id, even if well formatted', function (done) {
        request(app)
          .delete('/test/categories/' + mongoose.Types.ObjectId())
          .send()
          .expect(404)
          //.expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            Category.count({'_id': category._id}, function (err, c) {
              if (err) return done(err);
              expect(c).to.be.equal(1);
              return done();
            });
          });
      });

    });

  });



});
