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
var teamController = require('./team.controller.js');
var Team = require('./team.model');
var Company = require('../company/company.model');
var User = require('../user/user.model');
var utils = require('../../components/utils');

var teamTemplateArray = [
  { name: 'test team', description: 'test team description', active: true },
  { name: 'flower team', description: 'flower team description', active: true },
  { name: 'dead team', description: 'flower team description', active: false },
];

var teamTemplate = _.clone(teamTemplateArray[0]);

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

describe('Team', function() {

  var userArray;
  var companyArray;
  var teamArray;
  var company;
  var user;
  var authToken;

  // remove all Team, Company, User from DB to start with a clean environment
  before(function(done) {
    utils.mongooseRemoveAll([Team, Company, User], done);
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

  // set team data
  before(function(done) {
    teamArray = _.clone(teamTemplateArray);

    teamArray[0]._company = companyArray[0]._id;
    teamArray[1]._company = companyArray[1]._id;
    teamArray[2]._company = companyArray[1]._id;

    Team.create(teamArray, function(err, insertedArray) {
      if (err) return done(err);
      insertedArray.forEach(function(element, index) {
        teamArray[index] = element;
      });

      return done();
    });
  });

  // set company and user data for single company/user tests
  before(function(done) {
    company = companyArray[0];
    user = userArray[1];
    done();
  });

  // remove all Team, Company, User from DB
  after(function(done) {
    utils.mongooseRemoveAll([Team, Company, User], done);
  });

  describe('Team - Test method: create and destroy', function() {

    var team;

    describe('Model test', function() {

      // set team variable with test data
      before(function() {
        team = _.clone(teamTemplate);
        team._company = company._id;
      });

      it('should create a team', function(done) {
        Team.create(team, function(err, created) {
          if (err) return done(err);
          Team.findById(created._id, function(err, found) {
            if (err) return done(err);
            team = found;
            expect(found).to.be.instanceof(Team);
            expect(found).to.have.property('_id');
            return done();
          });
        });
      });

      it('should delete the team', function(done) {
        team.remove(function(err) {
          if (err) return done(err);
          return done();
        });
      });

    });

    describe('Controller test', function() {

      // set team variable with test data
      before(function() {
        team = _.clone(teamTemplate);
        team._company = company._id;
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

      it('should create team', function(done) {
        request(app)
          .post('/api/teams/')
          .set('authorization', 'Bearer ' + authToken)
          .send(team)
          .expect(201)
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            Team.findById(res.body._id, function(err, found) {
              if (err) return done(err);
              team = found;
              expect(found).to.be.instanceof(Team);
              expect(found).to.have.property('_id');
              return done();
            });
          });
      });

      it('should not delete the team with a fake id', function(done) {
        request(app)
          .delete('/api/teams/' + 'fake id')

          // TODO: without auth, we should get a 401!!
          .set('authorization', 'Bearer ' + authToken)
          .send()
          .expect(404)

          //.expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            Team.findById(res.body._id, function(err, found) {
              if (err) return done(err);
              expect(found).to.be.null;
              return done();
            });
          });
      });

      it('should not delete the team with a fake id, even if well formatted', function(done) {
        request(app)
          .delete('/api/teams/' + mongoose.Types.ObjectId())

          // TODO: without auth, we should get a 401!!
          .set('authorization', 'Bearer ' + authToken)
          .send()
          .expect(400)

          //.expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            Team.findById(res.body._id, function(err, found) {
              if (err) return done(err);
              expect(found).to.be.null;
              return done();
            });
          });
      });

      it('should delete the team', function(done) {
        request(app)
          .delete('/api/teams/' + team._id)
          .set('authorization', 'Bearer ' + authToken)
          .send()
          .expect(204)

          //.expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            Team.findById(res.body._id, function(err, found) {
              if (err) return done(err);
              team = found;
              expect(found).to.be.null;
              return done();
            });
          });
      });

    });

  });

  describe('Team - Test method: list and find', function() {

    describe('Model test', function() {

      it('should list teams', function(done) {
        Team.find({ active: true }, function(err, list) {
          if (err) return done(err);
          expect(list).to.be.instanceof(Array);
          expect(list.length).to.be.equal(teamArray.length - 1);
          return done();
        });

      });

      it('should list teams for companyArray[1]', function(done) {
        Team.findByCompanies([companyArray[1]], { onlyActive: true }, function(err, list) {
          if (err) return done(err);
          expect(list).to.be.instanceof(Array);
          expect(list.length).to.be.equal(1);
          expect(list[0]._id.toString()).to.be.equal(teamArray[1]._id.toString());
          return done();
        });
      });

      it('should list teams for companyArray[1] - onlyActive: false', function(done) {
        Team.findByCompanies([companyArray[1]], { onlyActive: false }, function(err, list) {
          if (err) return done(err);
          expect(list).to.be.instanceof(Array);
          expect(list.length).to.be.equal(2);
          return done();
        });
      });

    });

    describe('Controller test', function() {

      // login user
      before(function(done) {
        user = userArray[3];
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

      it('should list all teams - onlyActive: true (default)', function(done) {

        request(app)
          .get('/api/teams')
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

      it('should list all teams - onlyActive: false', function(done) {

        request(app)
          .get('/api/teams?onlyActive=false')
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

      it('should list all teams - only admin', function(done) {

        request(app)
          .get('/api/teams?admin=true&purchase=false&team=false')
          .set('authorization', 'Bearer ' + authToken)
          .send()
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            expect(res.body).to.be.instanceof(Array);
            expect(res.body.length).to.be.equal(1);
            return done();
          });
      });

    });

  });

  describe('Team - Test method: show', function() {

    var team;

    before(function(done) {
      team = teamArray[0];
      done();
    });

    describe('Model test', function() {

      it('should find the team', function(done) {
        Team.findById(team._id, function(err, found) {
          if (err) return done(err);
          expect(found).to.be.an.instanceOf(Team);
          expect(found._id.toString()).to.be.equal(team._id.toString());
          return done();
        });
      });

      it('should not find the team', function(done) {
        Team.findById(mongoose.Types.ObjectId(), function(err, found) {
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

      it('should find the team', function(done) {
        request(app)
          .get('/api/teams/' + teamArray[0]._id)
          .send()
          .set('authorization', 'Bearer ' + authToken)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            expect(res.body).to.be.instanceof(Object);
            expect(res.body._id.toString()).to.be.equal(teamArray[0]._id.toString());
            return done();
          });
      });

      it('should not find the team by a fake id', function(done) {
        request(app)
          .get('/test/teams/your id here')
          .set('authorization', 'Bearer ' + authToken)
          .send()
          .expect(404)

          //.expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            return done();
          });
      });

      it('should not find the team by a fake id, even if well formatted', function(done) {
        request(app)
          .get('/test/teams/' + mongoose.Types.ObjectId())
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

  describe('Team - Test method: update', function() {

    var team;
    var newName = 'New Name';

    // set company and user data for single company/user tests
    before(function(done) {
      team = teamArray[0];
      done();
    });

    describe('Model test', function() {

      it('should update the team', function(done) {
        team.name = 'New Name';
        team.save(function(err, saved) {
          if (err) return done(err);
          expect(saved).to.be.an.instanceOf(Team);
          expect(saved).to.have.property('_id', team._id);
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

      it('should update the team', function(done) {
        team.name = newName;
        request(app)
          .put('/api/teams/' + team._id)
          .set('authorization', 'Bearer ' + authToken)
          .send(team)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            expect(res.body.name).to.be.equal(newName);
            return done();
          });
      });

      it('should not update the team if a fake id is sent', function(done) {
        request(app)
          .put('/test/teams/' + 'fake id')
          .send(team)
          .expect(404)

          //.expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            return done();
          });
      });

      it('should not update the team if a fake id is sent, even id it\'s a valid objectId', function(done) {
        request(app)
          .put('/test/teams/' + mongoose.Types.ObjectId())
          .send(team)
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

describe('OptionsMdw test', function() {

  var testPath = '/test/optionsMdw';

  // set the test routes for this controller method
  before(function() {
    var router = express.Router();
    router.use(teamController.optionsMdw);
    app.use(testPath, router.get('/', returnReqData('options')));
  });

  it('optionsMdw test', function(done) {

    var options = {
      admin: true,
      purchase: null,
      team: false,
      onlyActive: null,
    };

    request(app)
      .get(testPath + setQueryString(options))
      .send()
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) return done(err);
        _.forEach(res.body, function(value, index) {
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
  return function(req, res, next) {
    if (!req[name]) return res.status(599).send('ERROR');
    return res.status(200).json(req[name]);
  };
}

function setQueryString(options) {
  var queryString = '?';
  _.forEach(options, function(value, key) {
    queryString += key;
    queryString += '=';
    queryString += value;
    queryString += '&';
  });

  return queryString.slice(0, -1);
}
