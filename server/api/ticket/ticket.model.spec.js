'use strict';

var express = require('express');
var chai = require('chai');
var expect = chai.expect;
var _ = require('lodash');
var request = require('supertest');
var mongoose = require('mongoose');
var jsonwebtoken = require('jsonwebtoken');
var app = require('../../app');
var config = require('../../config/environment');
var ticketController = require('./ticket.controller.js');
var Ticket = require('./ticket.model');
var Category = require('../category/category.model');
var Company = require('../company/company.model');
var User = require('../user/user.model');
var utils = require('../../components/utils');

var categoryTemplateArray = [
  { name: 'test category', description: 'test category description', active: true },
  { name: 'flower category', description: 'flower category description', active: true },
  { name: 'dead category', description: 'flower category description', active: false },
];

var categoryTemplate = _.clone(categoryTemplateArray[0]);

var companyTemplateArray = [
  { name: 'test company', info: 'test company info', purchaseUsers: [], teamUsers: [], adminUsers: [] },
  { name: 'flower company', info: 'flower company info', purchaseUsers: [], teamUsers: [], adminUsers: [] },
];

var userTemplateArray = [
  { provider: 'local', name: 'Fake User 0', email: 'test1@test.com', password: 'password' },
  { provider: 'local', name: 'Fake User 1', email: 'test2@test.com', password: 'password' },
  { provider: 'local', name: 'Fake User 2', email: 'test3@test.com', password: 'password' },
  { provider: 'local', name: 'Fake User 3', email: 'test4@test.com', password: 'password' },
  { provider: 'local', name: 'Fake User 4', email: 'test5@test.com', password: 'password' },
  { provider: 'local', name: 'Fake User 5', email: 'test6@test.com', password: 'password' },
];

var ticketTemplateArray = [
  { title: 'Ticket0 Title', description: 'Ticket0 Description', state: 'draft' },
  { title: 'Ticket1 Title', description: 'Ticket1 Description', state: 'draft' },
  { title: 'Ticket2 Title', description: 'Ticket2 Description', state: 'draft' },
];

var ticketTemplate = _.clone(ticketTemplateArray[0]);

describe('Ticket', function() {

  var userArray;
  var companyArray;
  var categoryArray;
  var ticketArray;
  var category;
  var company;
  var user;
  var authToken;

  // remove all Category, Company, User from DB to start with a clean environment
  before(function(done) {
    utils.mongooseRemoveAll([Category, Company, Ticket, User], done);
  });

  // set user data
  before(function(done) {
    userArray = _.clone(userTemplateArray);

    utils.mongooseCreate(User, userArray, function(err, insertedArray) {
      if (err) return done(err);
      insertedArray.forEach(function(element, index) {
        userArray[index] = element;
      });

      return done();
    });
  });

  // set company data
  before(function(done) {
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

    utils.mongooseCreate(Company, companyArray, function(err, insertedArray) {
      if (err) return done(err);
      insertedArray.forEach(function(element, index) {
        companyArray[index] = element;
      });

      return done();
    });
  });

  // set category data
  before(function(done) {
    categoryArray = _.clone(categoryTemplateArray);

    categoryArray[0]._company = companyArray[0]._id;
    categoryArray[1]._company = companyArray[1]._id;
    categoryArray[2]._company = companyArray[1]._id;

    Category.create(categoryArray, function(err, insertedArray) {
      if (err) return done(err);
      insertedArray.forEach(function(element, index) {
        categoryArray[index] = element;
      });

      return done();
    });
  });

  // set ticket data
  before(function(done) {
    ticketArray = _.clone(ticketTemplateArray);

    ticketArray[0]._category = categoryArray[0]._id;
    ticketArray[1]._category = categoryArray[1]._id;
    ticketArray[2]._category = categoryArray[2]._id;

    ticketArray[0]._author = userArray[0]._id;
    ticketArray[1]._author = userArray[2]._id;
    ticketArray[2]._author = userArray[2]._id;

    Ticket.create(ticketArray, function(err, insertedArray) {
      if (err) return done(err);
      insertedArray.forEach(function(element, index) {
        ticketArray[index] = element;
      });

      return done();
    });
  });

  // set company and user data for single company/user tests
  before(function(done) {
    category = categoryArray[0];
    company = companyArray[0];
    user = userArray[2];
    done();
  });

  // remove all Category, Company, User from DB
  after(function(done) {
    utils.mongooseRemoveAll([Category, Company, User], done);
  });

  describe('Ticket - Test method: create and destroy', function() {

    var ticket;

    describe('Model test', function() {

      // set ticket variable with test data
      before(function() {
        ticket = _.clone(ticketTemplate);
        ticket._category = category._id;
        ticket._author = user._id;
      });

      it('should create a ticket', function(done) {
        Ticket.create(ticket, function(err, created) {
          if (err) return done(err);
          Ticket.findById(created._id, function(err, found) {
            if (err) return done(err);
            ticket = found;
            expect(found).to.be.instanceof(Ticket);
            expect(found).to.have.property('_id');
            return done();
          });
        });
      });

      it('should delete the ticket', function(done) {
        ticket.remove(function(err) {
          if (err) return done(err);
          return done();
        });
      });

    });

    describe('Controller test', function() {

      // set ticket variable with test data
      before(function() {
        ticket = _.clone(ticketTemplate);
        ticket._category = category._id;
        ticket._author = user._id;
      });

      // login user
      before(function(done) {
        utils.restLogin(user.email, user.password, function(err, res) {
          if (err) return done(err);
          expect(res.body).to.be.instanceOf(Object);
          expect(res.body).to.have.property('token');
          jsonwebtoken.verify(res.body.token, config.secrets.session, function(err, decoded) {
            if (err) return done(err);
            expect(decoded._id).to.be.equal('' + user._id);
            authToken = res.body.token;
            return done();
          });
        });
      });

      it('should create ticket', function(done) {
        request(app)
          .post('/api/tickets/')
          .set('authorization', 'Bearer ' + authToken)
          .send(ticket)
          .expect(201)
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            Ticket.findById(res.body._id, function(err, found) {
              if (err) return done(err);
              ticket = found;
              expect(found).to.be.instanceof(Ticket);
              expect(found).to.have.property('_id');
              return done();
            });
          });
      });

      it('should not delete the ticket with a fake id', function(done) {
        request(app)
          .delete('/api/ticket/' + 'fake id')

          // TODO: without auth, we should get a 401!!
          .set('authorization', 'Bearer ' + authToken)
          .send()
          .expect(404)

          //.expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            Ticket.findById(res.body._id, function(err, found) {
              if (err) return done(err);
              //expect(found).to.be.null;
              return done();
            });
          });
      });

      it('should not delete the ticket with a fake id, even if well formatted', function(done) {
        request(app)
          .delete('/api/tickets/' + mongoose.Types.ObjectId())

          // TODO: without auth, we should get a 401!!
          .set('authorization', 'Bearer ' + authToken)
          .send()
          .expect(400)

          //.expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            Ticket.findById(res.body._id, function(err, found) {
              if (err) return done(err);
              //expect(found).to.be.null;
              return done();
            });
          });
      });

      it('should delete the ticket', function(done) {
        request(app)
          .delete('/api/tickets/' + ticket._id)
          .set('authorization', 'Bearer ' + authToken)
          .send()
          .expect(204)

          //.expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            Ticket.findById(res.body._id, function(err, found) {
              if (err) return done(err);
              ticket = found;
              expect(found).to.be.null;
              return done();
            });
          });
      });

    });

  });

  describe('Ticket - Test method: list', function() {

    describe('Model test', function() {

      it('should list tickets', function(done) {
        Ticket.find({},  function(err, list) {
          if (err) return done(err);
          expect(list).to.be.instanceof(Array);
          expect(list.length).to.be.equal(ticketArray.length);
          return done();
        });

      });

      //it('should list categories for companyArray[1]', function(done) {
      //  Category.findByCompanies([companyArray[1]], { onlyActive: true }, function(err, list) {
      //    if (err) return done(err);
      //    expect(list).to.be.instanceof(Array);
      //    expect(list.length).to.be.equal(1);
      //    expect(list[0]._id.toString()).to.be.equal(categoryArray[1]._id.toString());
      //    return done();
      //  });
      //});

      //it('should list categories for companyArray[1] - onlyActive: false', function(done) {
      //  Category.findByCompanies([companyArray[1]], { onlyActive: false }, function(err, list) {
      //    if (err) return done(err);
      //    expect(list).to.be.instanceof(Array);
      //    expect(list.length).to.be.equal(2);
      //    return done();
      //  });
      //});

    });

    describe('Controller test', function() {

      // login user
      before(function(done) {
        user = userArray[2];
        utils.restLogin(user.email, user.password, function(err, res) {
          if (err) return done(err);
          expect(res.body).to.be.instanceOf(Object);
          expect(res.body).to.have.property('token');
          jsonwebtoken.verify(res.body.token, config.secrets.session, function(err, decoded) {
            if (err) return done(err);
            expect(decoded._id).to.be.equal('' + user._id);
            authToken = res.body.token;
            return done();
          });
        });
      });

      it('should list all tickets for a user', function(done) {

        request(app)
          .get('/api/tickets')
          .set('authorization', 'Bearer ' + authToken)
          .send()
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            expect(res.body).to.be.instanceof(Array);
            expect(res.body.length).to.be.equal(2);
            return done();
          });
      });

      it('should list all categories - onlyActive: false', function(done) {

        request(app)
          .get('/api/tickets?onlyActive=false')
          .set('authorization', 'Bearer ' + authToken)
          .send()
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            expect(res.body).to.be.instanceof(Array);
            expect(res.body.length).to.be.equal(3);
            return done();
          });
      });

      it('should list all categories - only admin', function(done) {

        request(app)
          .get('/api/tickets?admin=true&purchase=false&team=false')
          .set('authorization', 'Bearer ' + authToken)
          .send()
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            expect(res.body).to.be.instanceof(Array);
            expect(res.body.length).to.be.equal(0);
            return done();
          });
      });

    });

  });

  describe('Ticket - Test method: show', function() {

    var ticket;

    before(function(done) {
      ticket = ticketArray[0];
      done();
    });

    describe('Model test', function() {

      it('should find the ticket', function(done) {
        Ticket.findById(ticket._id, function(err, found) {
          if (err) return done(err);
          expect(found).to.be.an.instanceOf(Ticket);
          expect(found._id.toString()).to.be.equal(ticket._id.toString());
          return done();
        });
      });

      it('should not find the ticket', function(done) {
        Ticket.findById(mongoose.Types.ObjectId(), function(err, found) {
          if (err) return done(err);
          expect(found).to.be.null;
          return done();
        });
      });

    });

    describe('Controller test', function() {

      // login user
      before(function(done) {
        //        user = userArray[1];
        utils.restLogin(user.email, user.password, function(err, res) {
          if (err) return done(err);
          expect(res.body).to.be.instanceOf(Object);
          expect(res.body).to.have.property('token');
          jsonwebtoken.verify(res.body.token, config.secrets.session, function(err, decoded) {
            if (err) return done(err);
            expect(decoded._id).to.be.equal('' + user._id);
            authToken = res.body.token;
            return done();
          });
        });
      });

      it('should find the ticket', function(done) {
        request(app)
          .get('/api/tickets/' + ticketArray[0]._id)
          .send()
          .set('authorization', 'Bearer ' + authToken)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            expect(res.body).to.be.instanceof(Object);
            expect(res.body._id.toString()).to.be.equal(ticketArray[0]._id.toString());
            return done();
          });
      });

      it('should not find the ticket by a fake id', function(done) {
        request(app)
          .get('/test/categories/your id here')
          .set('authorization', 'Bearer ' + authToken)
          .send()
          .expect(404)

          //.expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            return done();
          });
      });

      it('should not find the ticket by a fake id, even if well formatted', function(done) {
        request(app)
          .get('/test/categories/' + mongoose.Types.ObjectId())
          .set('authorization', 'Bearer ' + authToken)
          .send()
          .expect(404)

          //.expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            return done();
          });
      });

    });

  });

  describe('Ticket - Test method: update', function() {

    var ticket;
    var newName = 'New Name';

    // set company and user data for single company/user tests
    before(function(done) {
      ticket = ticketArray[0];
      done();
    });

    describe('Model test', function() {

      it('should update the ticket', function(done) {
        ticket.name = 'New Name';
        ticket.save(function(err, saved) {
          if (err) return done(err);
          expect(saved).to.be.an.instanceOf(Ticket);
          expect(saved).to.have.property('_id', ticket._id);
          expect(saved.name).to.be.equal('New Name');
          return done();
        });
      });

    });

    describe('Controller test', function() {

      // login user
      before(function(done) {
        //        user = userArray[1];
        utils.restLogin(user.email, user.password, function(err, res) {
          if (err) return done(err);
          expect(res.body).to.be.instanceOf(Object);
          expect(res.body).to.have.property('token');
          jsonwebtoken.verify(res.body.token, config.secrets.session, function(err, decoded) {
            if (err) return done(err);
            expect(decoded._id).to.be.equal('' + user._id);
            authToken = res.body.token;
            return done();
          });
        });
      });

      it('should update the ticket', function(done) {
        ticket.title = newName;
        request(app)
          .put('/api/tickets/' + ticket._id)
          .set('authorization', 'Bearer ' + authToken)
          .send(ticket)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            expect(res.body.title).to.be.equal(newName);
            return done();
          });
      });

      it('should not update the ticket if a fake id is sent', function(done) {
        request(app)
          .put('/test/tickets/' + 'fake id')
          .send(category)
          .expect(404)

          //.expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            return done();
          });
      });

      it('should not update the ticket if a fake id is sent, even id it\'s a valid objectId', function(done) {
        request(app)
          .put('/test/tickets/' + mongoose.Types.ObjectId())
          .send(category)
          .expect(404)

          //.expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            return done();
          });
      });

    });

  });

});
//
//describe('OptionsMdw test', function() {
//
//  var testPath = '/test/optionsMdw';
//
//  // set the test routes for this controller method
//  before(function() {
//    var router = express.Router();
//    router.use(categoryController.optionsMdw);
//    app.use(testPath, router.get('/', returnReqData('options')));
//  });
//
//  it('optionsMdw test', function(done) {
//
//    var options = {
//      admin: true,
//      purchase: null,
//      team: false,
//      onlyActive: null,
//    };
//
//    request(app)
//      .get(testPath + setQueryString(options))
//      .send()
//      .expect(200)
//      .expect('Content-Type', /json/)
//      .end(function(err, res) {
//        if (err) return done(err);
//        _.forEach(res.body, function(value, index) {
//          expect(value).to.be.equal(options[index] === null ? true : options[index]);
//        });
//
//        done();
//      });
//  });
//
//});
//
///**
// * Test function that returns req[name] as a response with http 200.
// * If name is not passed, it defaults to 'target'.
// * @param name
// */
//function returnReqData(name) {
//  if (!name) name = 'target';
//  return function(req, res, next) {
//    if (!req[name]) return res.status(599).send('ERROR');
//    return res.status(200).json(req[name]);
//  };
//}
//
//function setQueryString(options) {
//  var queryString = '?';
//  _.forEach(options, function(value, key) {
//    queryString += key;
//    queryString += '=';
//    queryString += value;
//    queryString += '&';
//  });
//
//  return queryString.slice(0, -1);
//}
