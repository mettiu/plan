'use strict';

var express = require('express'),
  chai = require('chai'),
  expect = chai.expect,
  _ = require('lodash'),
  request = require('supertest'),
  mongoose = require('mongoose'),
  jsonwebtoken = require('jsonwebtoken'),
  app = require('../../app'),
  config = require('../../config/environment'),
  categoryController = require('./category.controller.js'),
  Category = require('./category.model'),
  Company = require('../company/company.model'),
  User = require('../user/user.model'),
  utils = require('../../components/utils'),
  errorMiddleware = require('../../components/error-middleware');

//var categoryTemplate = {
//  name: "test category",
//  description: "test category description"
//};

var categoryTemplateArray = [
  {name: "test category", description: "test category description", active: true},
  {name: "flower category", description: "flower category description", active: true},
  {name: "dead category", description: "flower category description", active: false}
];

var categoryTemplate = _.clone(categoryTemplateArray[0]);

//var companyTemplate = {
//  name: "test company",
//  info: "test company info"
//};

var companyTemplateArray = [
  {name: "test company", info: "test company info", purchaseUsers: [], teamUsers: [], adminUsers: []},
  {name: "flower company", info: "flower company info", purchaseUsers: [], teamUsers: [], adminUsers: []}
];

var companyTemplate = _.clone(companyTemplateArray[0]);

var userTemplateArray = [
  {provider: 'local', name: 'Fake User 0', email: 'test1@test.com', password: 'password'},
  {provider: 'local', name: 'Fake User 1', email: 'test2@test.com', password: 'password'},
  {provider: 'local', name: 'Fake User 2', email: 'test3@test.com', password: 'password'},
  {provider: 'local', name: 'Fake User 3', email: 'test4@test.com', password: 'password'},
  {provider: 'local', name: 'Fake User 4', email: 'test5@test.com', password: 'password'},
  {provider: 'local', name: 'Fake User 5', email: 'test6@test.com', password: 'password'}
];

describe('Category', function () {

  var userArray;
  var companyArray;
  var categoryArray;
  var company;
  var user;
  var authToken;

  // remove all Category, Company, User from DB to start with a clean environment
  before(function (done) {
    utils.mongooseRemoveAll([Category, Company, User], done);
  });

  // set user data
  before(function (done) {
    userArray = _.clone(userTemplateArray);

    utils.mongooseCreate(User, userArray, function (err, insertedArray) {
      if (err) return done(err);
      insertedArray.forEach(function (element, index) {
        userArray[index] = element;
      });
      return done();
    });
  });

  // set company data
  before(function (done) {
    companyArray = _.clone(companyTemplateArray);

    companyArray[0].teamUsers.push(userArray[0]._id);
    companyArray[0].purchaseUsers.push(userArray[1]._id);
    companyArray[0].adminUsers.push(userArray[1]._id);

    companyArray[0].teamUsers.push(userArray[2]._id);
    companyArray[0].purchaseUsers.push(userArray[3]._id);
    companyArray[0].adminUsers.push(userArray[3]._id);

    companyArray[1].teamUsers.push(userArray[2]._id);
    companyArray[1].purchaseUsers.push(userArray[3]._id);
    companyArray[1].adminUsers.push(userArray[4]._id);

    companyArray[1].teamUsers.push(userArray[4]._id);
    companyArray[1].purchaseUsers.push(userArray[5]._id);
    companyArray[1].adminUsers.push(userArray[5]._id);

    utils.mongooseCreate(Company, companyArray, function (err, insertedArray) {
      if (err) return done(err);
      insertedArray.forEach(function (element, index) {
        companyArray[index] = element;
      });
      return done();
    });
  });

  // set category data
  before(function (done) {
    categoryArray = _.clone(categoryTemplateArray);

    categoryArray[0]._company = companyArray[0]._id;
    categoryArray[1]._company = companyArray[1]._id;
    categoryArray[2]._company = companyArray[1]._id;

    Category.create(categoryArray, function (err, insertedArray) {
      if (err) return done(err);
      insertedArray.forEach(function (element, index) {
        categoryArray[index] = element;
      });
      return done();
    });
  });

  // set company and user data for single company/user tests
  before(function (done) {
    company = companyArray[0];
    user = userArray[1];
    done();
  });

  //// create the company needed for category tests
  //before(function (done) {
  //  company = _.clone(companyTemplate);
  //  Company.create(company, function (err, created) {
  //    if (err) return done(err);
  //    company = created;
  //    return done();
  //  });
  //});

  //before()

  // remove all Category, Company, User from DB
  after(function (done) {
    utils.mongooseRemoveAll([Category, Company, User], done);
  });

  describe('Category - Test method: create and destroy', function () {

    var category;

    describe('Model test', function () {

      // set category variable with test data
      before(function () {
        category = _.clone(categoryTemplate);
        category._company = company._id;
      });

      it('should create a category', function (done) {
        Category.create(category, function (err, created) {
          if (err) return done(err);
          Category.findById(created._id, function (err, found) {
            if (err) return done(err);
            category = found;
            expect(found).to.be.instanceof(Category);
            expect(found).to.have.property('_id');
            return done();
          });
        });
      });

      it('should delete the category', function (done) {
        category.remove(function (err) {
          if (err) return done(err);
          return done();
        });
      });

    });

    describe('Controller test', function () {

      // set category variable with test data
      before(function () {
        category = _.clone(categoryTemplate);
        category._company = company._id;
      });

      // login user
      before(function (done) {
        utils.restLogin(user.email, user.password, function (err, res) {
          if (err) return done(err);
          expect(res.body).to.be.instanceOf(Object);
          expect(res.body).to.have.property('token');
          jsonwebtoken.verify(res.body.token, config.secrets.session, function (err, decoded) {
            if (err) return done(err);
            expect(decoded._id).to.be.equal('' + user._id);
            authToken = res.body.token;
            return done();
          });
        });
      });

      it('should create category', function (done) {
        request(app)
          .post('/api/categories/')
          .set('authorization', 'Bearer ' + authToken)
          .send(category)
          .expect(201)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            Category.findById(res.body._id, function (err, found) {
              if (err) return done(err);
              category = found;
              expect(found).to.be.instanceof(Category);
              expect(found).to.have.property('_id');
              return done();
            });
          });
      });

      it('should not delete the category with a fake id', function (done) {
        request(app)
          .delete('/api/categories/' + 'fake id')
          // TODO: without auth, we should get a 401!!
          .set('authorization', 'Bearer ' + authToken)
          .send()
          .expect(404)
          //.expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            Category.findById(res.body._id, function (err, found) {
              if (err) return done(err);
              expect(found).to.be.null;
              return done();
            });
          });
      });

      it('should not delete the category with a fake id, even if well formatted', function (done) {
        request(app)
          .delete('/api/categories/' + mongoose.Types.ObjectId())
          // TODO: without auth, we should get a 401!!
          .set('authorization', 'Bearer ' + authToken)
          .send()
          .expect(400)
          //.expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            Category.findById(res.body._id, function (err, found) {
              if (err) return done(err);
              expect(found).to.be.null;
              return done();
            });
          });
      });

      it('should delete the category', function (done) {
        request(app)
          .delete('/api/categories/' + category._id)
          .set('authorization', 'Bearer ' + authToken)
          .send()
          .expect(204)
          //.expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            Category.findById(res.body._id, function (err, found) {
              if (err) return done(err);
              category = found;
              expect(found).to.be.null;
              return done();
            });
          });
      });

    });

  });

  describe('Category - Test method: list and find', function () {

    describe('Model test', function () {

      it('should list categories', function (done) {
        Category.find({active: true}, function (err, list) {
          if (err) return done(err);
          expect(list).to.be.instanceof(Array);
          expect(list.length).to.be.equal(categoryArray.length - 1);
          return done();
        })

      });

      it('should list categories for companyArray[1]', function (done) {
        Category.findByCompanies([companyArray[1]], {onlyActive: true}, function (err, list) {
          if (err) return done(err);
          expect(list).to.be.instanceof(Array);
          expect(list.length).to.be.equal(1);
          expect(list[0]._id.toString()).to.be.equal(categoryArray[1]._id.toString());
          return done();
        })
      });

      it('should list categories for companyArray[1] - onlyActive: false', function (done) {
        Category.findByCompanies([companyArray[1]], {onlyActive: false}, function (err, list) {
          if (err) return done(err);
          expect(list).to.be.instanceof(Array);
          expect(list.length).to.be.equal(2);
          return done();
        })
      });

    });

    describe('Controller test', function () {

      // login user
      before(function (done) {
        user = userArray[3];
        utils.restLogin(user.email, user.password, function (err, res) {
          if (err) return done(err);
          expect(res.body).to.be.instanceOf(Object);
          expect(res.body).to.have.property('token');
          jsonwebtoken.verify(res.body.token, config.secrets.session, function (err, decoded) {
            if (err) return done(err);
            expect(decoded._id).to.be.equal('' + user._id);
            authToken = res.body.token;
            return done();
          });
        });
      });

      it('should list all categories - onlyActive: true (default)', function (done) {

        request(app)
          .get('/api/categories')
          .set('authorization', 'Bearer ' + authToken)
          .send()
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            expect(res.body).to.be.instanceof(Array);
            expect(res.body.length).to.be.equal(2);
            return done();
          });
      });

      it('should list all categories - onlyActive: false', function (done) {

        request(app)
          .get('/api/categories?onlyActive=false')
          .set('authorization', 'Bearer ' + authToken)
          .send()
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            expect(res.body).to.be.instanceof(Array);
            expect(res.body.length).to.be.equal(3);
            return done();
          });
      });

      it('should list all categories - only admin', function (done) {

        request(app)
          .get('/api/categories?admin=true&purchase=false&team=false')
          .set('authorization', 'Bearer ' + authToken)
          .send()
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

  // TODO: completare questi test ed i relativi metodi     <--------------------<<<<
  //describe('Category - Test method: show', function () {
  //
  //  var category;
  //
  //  // set category test data
  //  before(function (done) {
  //    category = _.clone(categoryTemplate);
  //    category._company = company._id;
  //
  //    Category.create(category, function (err, inserted) {
  //      if (err) return done(err);
  //      category = inserted;
  //      return done();
  //    });
  //
  //  });
  //
  //  // remove all categories from DB
  //  after(function (done) {
  //    utils.mongooseRemoveAll([Category], done);
  //  });
  //
  //  describe('Model test', function () {
  //
  //    it('should find the category', function (done) {
  //      Category.findById(category._id, function (err, found) {
  //        if (err) return done(err);
  //        expect(found).to.be.an.instanceOf(Category);
  //        return done();
  //      });
  //    });
  //
  //    it('should not find the category', function (done) {
  //      Category.findById(mongoose.Types.ObjectId(), function (err, found) {
  //        if (err) return done(err);
  //        expect(found).to.be.null;
  //        return done();
  //      });
  //    });
  //
  //  });
  //
  //  describe('Controller test', function () {
  //
  //    it('should find the category', function (done) {
  //      request(app)
  //        .get('/test/categories/' + category._id)
  //        .send()
  //        .expect(200)
  //        .expect('Content-Type', /json/)
  //        .end(function (err, res) {
  //          if (err) return done(err);
  //          expect(res.body).to.be.instanceof(Object);
  //          expect(res.body._id.toString()).to.be.equal(category._id.toString());
  //          return done();
  //        });
  //    });
  //
  //    it('should not find the category by a fake id', function (done) {
  //      request(app)
  //        .get('/test/categories/your id here')
  //        .send()
  //        .expect(404)
  //        //.expect('Content-Type', /json/)
  //        .end(function (err, res) {
  //          if (err) return done(err);
  //          return done();
  //        });
  //    });
  //
  //    it('should not find the category by a fake id, even if well formatted', function (done) {
  //      request(app)
  //        .get('/test/categories/' + mongoose.Types.ObjectId())
  //        .send()
  //        .expect(404)
  //        //.expect('Content-Type', /json/)
  //        .end(function (err, res) {
  //          if (err) return done(err);
  //          return done();
  //        });
  //    });
  //
  //  });
  //
  //});
  //
  //describe('Category - Test method: update', function () {
  //
  //  var category;
  //  var userArray;
  //
  //  // set users test data
  //  before(function (done) {
  //    userArray = _.clone(userTemplateArray);
  //
  //    User.create(userArray, function (err, insertedArray) {
  //      if (err) return done(err);
  //      insertedArray.forEach(function (item, i) {
  //        userArray[i] = item;
  //      });
  //      return done();
  //    });
  //
  //  });
  //
  //  // set category test data
  //  beforeEach(function (done) {
  //    category = _.clone(categoryTemplate);
  //    category._company = company._id;
  //    category.purchaseUsers = [userArray[0]._id, userArray[1]._id];
  //
  //    Category.create(category, function (err, inserted) {
  //      if (err) return done(err);
  //      category = inserted;
  //      return done();
  //    });
  //  });
  //
  //  // prepare category test data
  //  beforeEach(function (done) {
  //    category.purchaseUsers = [userArray[0]._id];
  //    return done();
  //  });
  //
  //  // remove all companies from DB
  //  afterEach(function (done) {
  //    utils.mongooseRemoveAll([Category], done);
  //  });
  //
  //  // remove all categories and users from DB
  //  after(function (done) {
  //    utils.mongooseRemoveAll([Category, User], done);
  //  });
  //
  //  describe('Model test', function () {
  //
  //    it('should update the category', function (done) {
  //      expect(category.purchaseUsers).to.have.length(1);
  //      category.save(function (err, saved) {
  //        if (err) return done(err);
  //        expect(saved).to.be.an.instanceOf(Category);
  //        expect(saved).to.have.property('_id', category._id);
  //        expect(saved.purchaseUsers).to.have.length(1);
  //        return done();
  //      });
  //    });
  //
  //  });
  //
  //  describe('Controller test', function () {
  //
  //    it('should update the category', function (done) {
  //      expect(category.purchaseUsers).to.have.length(1);
  //      request(app)
  //        .put('/test/categories/' + category._id)
  //        .send(category)
  //        .expect(200)
  //        .expect('Content-Type', /json/)
  //        .end(function (err, res) {
  //          if (err) return done(err);
  //          expect(res.body).to.have.property('_id', category._id.toString());
  //          expect(res.body.purchaseUsers).to.have.length(1);
  //          return done();
  //        });
  //    });
  //
  //    it('should not update the category if a fake id is sent', function (done) {
  //      expect(category.purchaseUsers).to.have.length(1);
  //      request(app)
  //        .put('/test/categories/' + 'fake id')
  //        .send(category)
  //        .expect(404)
  //        //.expect('Content-Type', /json/)
  //        .end(function (err, res) {
  //          if (err) return done(err);
  //          return done();
  //        });
  //    });
  //
  //    it('should not update the category if a fake id is sent, even id it\'s a valid objectId', function (done) {
  //      expect(category.purchaseUsers).to.have.length(1);
  //      request(app)
  //        .put('/test/categories/' + mongoose.Types.ObjectId())
  //        .send(category)
  //        .expect(404)
  //        //.expect('Content-Type', /json/)
  //        .end(function (err, res) {
  //          if (err) return done(err);
  //          return done();
  //        });
  //    });
  //
  //  });
  //
  //});
  //
  //describe('Category - Test method: destroy', function () {
  //
  //  var category;
  //
  //  // set category test data
  //  beforeEach(function (done) {
  //    category = _.clone(categoryTemplate);
  //    category._company = company._id;
  //
  //    Category.create(category, function (err, inserted) {
  //      if (err) return done(err);
  //      category = inserted;
  //      return done();
  //    });
  //
  //  });
  //
  //  // remove all companies from DB
  //  afterEach(function (done) {
  //    utils.mongooseRemoveAll([Category], done);
  //  });
  //
  //  describe('Model test', function () {
  //
  //    it('should delete the category', function (done) {
  //      category.remove(function (err) {
  //        if (err) return done(err);
  //        return done();
  //      });
  //    });
  //
  //  });
  //
  //  describe('Controller test', function () {
  //
  //    it('should delete the category', function (done) {
  //      request(app)
  //        .delete('/test/categories/' + category._id)
  //        .send()
  //        .expect(204)
  //        //.expect('Content-Type', /json/)
  //        .end(function (err, res) {
  //          if (err) return done(err);
  //          Category.count({'_id': category._id}, function (err, c) {
  //            if (err) return done(err);
  //            expect(c).to.be.equal(0);
  //            return done();
  //          });
  //        });
  //    });
  //
  //    it('should not delete the category with a fake id', function (done) {
  //      request(app)
  //        .delete('/test/categories/' + 'fake id')
  //        .send()
  //        .expect(404)
  //        //.expect('Content-Type', /json/)
  //        .end(function (err, res) {
  //          if (err) return done(err);
  //          Category.count({'_id': category._id}, function (err, c) {
  //            if (err) return done(err);
  //            expect(c).to.be.equal(1);
  //            return done();
  //          });
  //        });
  //    });
  //
  //    it('should not delete the category with a fake id, even if well formatted', function (done) {
  //      request(app)
  //        .delete('/test/categories/' + mongoose.Types.ObjectId())
  //        .send()
  //        .expect(404)
  //        //.expect('Content-Type', /json/)
  //        .end(function (err, res) {
  //          if (err) return done(err);
  //          Category.count({'_id': category._id}, function (err, c) {
  //            if (err) return done(err);
  //            expect(c).to.be.equal(1);
  //            return done();
  //          });
  //        });
  //    });
  //
  //  });
  //
  //});

});

describe('OptionsMdw test', function () {

  var testPath = '/test/optionsMdw';

  // set the test routes for this controller method
  before(function () {
    var router = express.Router();
    router.use(categoryController.optionsMdw);
    app.use(testPath, router.get('/', returnReqData('options')));
  });

  it('optionsMdw test', function (done) {

    var options = {
      admin: true,
      purchase: null,
      team: false,
      onlyActive: null
    };

    request(app)
      .get(testPath + setQueryString(options))
      .send()
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) return done(err);
        _.forEach(res.body, function(value, index){
          expect(value).to.be.equal(options[index] === null ? true : options[index]);
        });
        done();
      });
  });


});

/**
 * Test function that returns req[name] as a response with http 200.
 * If name is not passed, it defaults to 'target'.
 * @param name
 */
function returnReqData(name) {
  if (!name) name = 'target';
  return function (req, res, next) {
    if (!req[name]) return res.status(599).send("ERROR");
    return res.status(200).json(req[name]);
  }
}

function setQueryString(options) {
  var queryString = '?';
  _.forEach(options, function (value, key) {
    queryString += key;
    queryString += '=';
    queryString += value;
    queryString += '&';
  });
  return queryString.slice(0, -1);
}
