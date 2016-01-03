'use strict';

var express = require('express');
var chai = require('chai');
var expect = chai.expect;
var _ = require('lodash');
var request = require('supertest');
var mongoose = require('mongoose');
var app = require('../../app');
var teamController = require('./team.controller.js');
var Team = require('./team.model');
var Company = require('../company/company.model');
var User = require('../user/user.model');
var utils = require('../../components/utils');
var errorMiddleware = require('../../components/error-middleware');

function mountMiddleware() {
  app.use('/test/teams', express.Router().post('/create', teamController.create));
  app.use('/test/teams', express.Router().get('/', teamController.index));
  app.use('/test/teams', express.Router().get('/find', teamController.find));
  app.use('/test/teams', express.Router().get('/:id', teamController.show));
  app.use('/test/teams', express.Router().put('/:id', teamController.update));
  app.use('/test/teams', express.Router().delete('/:id', teamController.destroy));
  errorMiddleware(app);
}

var teamTemplate = {
  name: "test team",
  description: "test team description"
};

var companyTemplate = {
  name: "test company",
  info: "test company info"
};

var userTemplateArray = [
  {provider: 'local', name: 'Fake User One', email: 'testone@test.com', password: 'passwordone'},
  {provider: 'local', name: 'Fake User Two', email: 'testtwo@test.com', password: 'passwordtwo'}
];

describe('Team controller', function () {

  var company;

  // remove all categories from DB to start with a clean environment
  before(function (done) {
    utils.mongooseRemoveAll([Team, Company], done);
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

  describe('Team - Test method: create', function () {

    var team;

    // set category variable with test data
    before(function () {
      team = _.clone(teamTemplate);
      team._company = company._id;
    });

    describe('Model test', function () {

      // remove all teams from DB
      after(function (done) {
        utils.mongooseRemoveAll([Team], done);
      });

      it('should create a team', function (done) {
        Team.create(team, function (err, created) {
          if (err) return done(err);
          Team.count({}, function (err, count) {
            if (err) return done(err);
            expect(count).to.be.equal(1);
            return done();
          });
        });
      });

    });

    describe('Controller test', function () {

      // remove all teams from DB
      after(function (done) {
        utils.mongooseRemoveAll([Team], done);
      });

      it('should create team', function (done) {
        request(app)
          .post('/test/teams/create')
          .send(team)
          .expect(201)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            Team.count({}, function (err, count) {
              if (err) return done(err);
              expect(count).to.be.equal(1);
              return done();
            });
          });
      });

    });

  });

  describe('Team - Test method: list and find', function () {

    var teamList = [];
    var listSize = 10;

    // set test data
    before(function (done) {
      var team = _.clone(teamTemplate);
      team._company = company._id;
      for (var i = 0; i < listSize; i++) {
        teamList.push(_.clone(team));
      }
      teamList[0].active = false; // set one team as non-active
      teamList[1].name = "flowers team";
      utils.mongooseCreate(Team, teamList, done)
    });

    // remove all categories from DB
    after(function (done) {
      utils.mongooseRemoveAll([Team], done);
    });

    describe('Model test', function () {

      it('should list teams', function (done) {
        Team.find({active: true}, function (err, list) {
          if (err) return done(err);
          expect(list).to.be.instanceof(Array);
          expect(list.length).to.be.equal(listSize - 1);
          return done();
        })

      });

    });

    describe('Controller test', function () {

      it('should list all teams', function (done) {
        request(app)
          .get('/test/teams')
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

      it('should list all active teams', function (done) {
        request(app)
          .get('/test/teams')
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

      it('should list all active teams', function (done) {
        request(app)
          .get('/test/teams')
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

      it('should find all test active teams', function (done) {
        request(app)
          .get('/test/teams/find?value=test')
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

      it('should find all active teams (query parameter = \'\')', function (done) {
        request(app)
          .get('/test/teams/find?value=')
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

  describe('Team - Test method: show', function () {

    var team;

    // set team test data
    before(function (done) {
      team = _.clone(teamTemplate);
      team._company = company._id;

      Team.create(team, function (err, inserted) {
        if (err) return done(err);
        team = inserted;
        return done();
      });

    });

    // remove all categories from DB
    after(function (done) {
      utils.mongooseRemoveAll([Team], done);
    });

    describe('Model test', function () {

      it('should find the team', function (done) {
        Team.findById(team._id, function (err, found) {
          if (err) return done(err);
          expect(found).to.be.an.instanceOf(Team);
          return done();
        });
      });

      it('should not find the team', function (done) {
        Team.findById(mongoose.Types.ObjectId(), function (err, found) {
          if (err) return done(err);
          expect(found).to.be.null;
          return done();
        });
      });

    });

    describe('Controller test', function () {

      it('should find the team', function (done) {
        request(app)
          .get('/test/teams/' + team._id)
          .send()
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            expect(res.body).to.be.instanceof(Object);
            expect(res.body._id.toString()).to.be.equal(team._id.toString());
            return done();
          });
      });

      it('should not find the team by a fake id', function (done) {
        request(app)
          .get('/test/teams/your id here')
          .send()
          .expect(404)
          //.expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            return done();
          });
      });

      it('should not find the team by a fake id, even if well formatted', function (done) {
        request(app)
          .get('/test/teams/' + mongoose.Types.ObjectId())
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

  describe('Team - Test method: update', function () {

    var team;
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

    // set team test data
    beforeEach(function (done) {
      team = _.clone(teamTemplate);
      team._company = company._id;
      team.teamUsers = [userArray[0]._id, userArray[1]._id];

      Team.create(team, function (err, inserted) {
        if (err) return done(err);
        team = inserted;
        return done();
      });
    });

    // prepare team test data
    beforeEach(function (done) {
      team.teamUsers = [userArray[0]._id];
      return done();
    });

    // remove all teams from DB
    afterEach(function (done) {
      utils.mongooseRemoveAll([Team], done);
    });

    // remove all teams and users from DB
    after(function (done) {
      utils.mongooseRemoveAll([Team, User], done);
    });

    describe('Model test', function () {

      it('should update the team', function (done) {
        expect(team.teamUsers).to.have.length(1);
        team.save(function (err, saved) {
          if (err) return done(err);
          expect(saved).to.be.an.instanceOf(Team);
          expect(saved).to.have.property('_id', team._id);
          expect(saved.teamUsers).to.have.length(1);
          return done();
        });
      });

    });

    describe('Controller test', function () {

      it('should update the team', function (done) {
        expect(team.teamUsers).to.have.length(1);
        request(app)
          .put('/test/teams/' + team._id)
          .send(team)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            expect(res.body).to.have.property('_id', team._id.toString());
            expect(res.body.teamUsers).to.have.length(1);
            return done();
          });
      });

      it('should not update the team if a fake id is sent', function (done) {
        expect(team.teamUsers).to.have.length(1);
        request(app)
          .put('/test/teams/' + 'fake id')
          .send(team)
          .expect(404)
          //.expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            return done();
          });
      });

      it('should not update the team if a fake id is sent, even id it\'s a valid objectId', function (done) {
        expect(team.teamUsers).to.have.length(1);
        request(app)
          .put('/test/teams/' + mongoose.Types.ObjectId())
          .send(team)
          .expect(404)
          //.expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            return done();
          });
      });

    });

  });

  describe('Team - Test method: destroy', function () {

    var team;

    // set team test data
    beforeEach(function (done) {
      team = _.clone(companyTemplate);
      team._company = company._id;

      Team.create(team, function (err, inserted) {
        if (err) return done(err);
        team = inserted;
        return done();
      });

    });

    // remove all companies from DB
    afterEach(function (done) {
      utils.mongooseRemoveAll([Team], done);
    });

    describe('Model test', function () {

      it('should delete the team', function (done) {
        team.remove(function (err) {
          if (err) return done(err);
          return done();
        });
      });

    });

    describe('Controller test', function () {

      it('should delete the team', function (done) {
        request(app)
          .delete('/test/teams/' + team._id)
          .send()
          .expect(204)
          //.expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            Team.count({'_id': team._id}, function (err, c) {
              if (err) return done(err);
              expect(c).to.be.equal(0);
              return done();
            });
          });
      });

      it('should not delete the team with a fake id', function (done) {
        request(app)
          .delete('/test/teams/' + 'fake id')
          .send()
          .expect(404)
          //.expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            Team.count({'_id': team._id}, function (err, c) {
              if (err) return done(err);
              expect(c).to.be.equal(1);
              return done();
            });
          });
      });

      it('should not delete the team with a fake id, even if well formatted', function (done) {
        request(app)
          .delete('/test/teams/' + mongoose.Types.ObjectId())
          .send()
          .expect(404)
          //.expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            Team.count({'_id': team._id}, function (err, c) {
              if (err) return done(err);
              expect(c).to.be.equal(1);
              return done();
            });
          });
      });

    });

  });



});
