'use strict';

//var should = require('should');
//var should = require('chai').should; //actually call the function
var chai = require('chai');
var expect = chai.expect;
chai.use(require('chai-datetime'));
chai.use(require('chai-interface'));
var faker = require('faker');
var _ = require('lodash');
faker.locale = "it";
var ms = require('ms');
var request = require('supertest');
var app = require('../../app');
var User = require('../user/user.model');
var Token = require('./token.model');
//var randomString = require('randomstring');

var tokenCheckResponseInterface = {
  result: Boolean,
};

var tokenInterface = {
  token: String,
  type: String,
  fired: Boolean,
};

var userData = {
  provider: 'local',
  name: 'Fake User',
  email: 'test@test.com',
  password: 'password'
};
var user = null;
var token = null;

describe('Token Model', function () {
  before(function (done) {
    // Clear users and tokens before testing
    User.remove().exec().then(function () {
      Token.remove().exec().then(function () {
        return done();
      });
    });
  });
  after(function (done) {
    // Clear users and tokens before testing
    User.remove().exec().then(function () {
      Token.remove().exec().then(function () {
        return done();
      });
    });
  });
  describe('Test for token creation', function () { // each test starts with a new user
    beforeEach(function (done) {
      // create a user for test
      user = new User(userData);
      user.save(function (err) {
        if (err) return done(err);
        User.find({}, function (err, users) {
          expect(users).to.have.length(1);
          return done();
        });
      });
    });
    afterEach(function (done) {
      User.findOneAndRemove({_id: user._id}, function (err, item) {
        if (err) return done(err);
        user = null;
        return done();
      });
    });
    it('should begin with 1 user', function (done) {
      User.find({}, function (err, items) {
        if (err) return done(err);
        expect(items).to.have.length(1);
        return done();
      });
    });
    it('should begin with no tokens', function (done) {
      Token.find({}, function (err, items) {
        if (err) return done(err);
        expect(items).to.have.length(0);
        return done();
      });
    });
    it('should create a new valid token', function (done) {
      Token.createNew({type: 'lostPassword', _user: user._id}, function (err, newToken) {
        if (err) return done(err);
        expect(newToken).to.have.property('token');
        expect(newToken.token).to.have.length.above(10);
        expect(newToken).to.have.property('type')
          .and.be.equal('lostPassword');
        expect(newToken).to.have.property('fired')
          .and.be.equal(false);
        expect(newToken).to.have.property('_user')
          .and.be.deep.equal(user._id);
        expect(newToken).to.have.property('isValid')
          .and.be.equal(true);
        expect(newToken).to.have.property('creationDate');
        expect(newToken.creationDate.getTime()).to.be.at.most(Date.now());
        expect(newToken).to.have.property('expirationDate');
        expect(newToken.expirationDate.getTime()).to.be.at.least(Date.now());

        token = newToken; // save the token for next tests

        Token.findValidToken(token.token, function (err, item) {
          if (err) return done(err);
          expect(item).to.be.not.null;
          expect(item.token).to.be.equal(token.token);
          expect(item._id).to.be.deep.equal(token._id);
          return done();
        });
      });
    });
    it('should find the token', function (done) {

      Token.findToken(token.token, function (err, item) {
        if (err) return done(err);
        expect(item.token).to.be.equal(token.token);
        expect(item._id).to.be.deep.equal(token._id);
        return done();
      });
    });
    it('should remove the token', function (done) {
      Token.remove({token: token.token}, function (err, obj) {
        if (err) return done(err);
        expect(obj.result.n).to.be.equal(1);
        token = null;
        return done();
      });
    });
  });

  describe('Test for token creation', function () { // each test starts with a new user
    beforeEach(function (done) {
      // create a user for test
      user = new User(userData);
      user.save(function (err) {
        if (err) return done(err);
        User.find({}, function (err, users) {
          expect(users).to.have.length(1);
          return done();
        });
      });
    });
    afterEach(function (done) {
      User.findOneAndRemove({_id: user._id}, function (err, item) {
        if (err) return done(err);
        Token.remove({}, function (err, obj) {
          if (err) return done(err);
          expect(obj.result.n).to.be.at.most(1);
          user = null;
          token = null;
          return done();
        });
      });
    });
    it('should not be a valid token if a token with past expiration dates is created', function (done) {
      Token.createNew({
        type: 'lostPassword',
        _user: user._id,
        creationDate: Date.now() - ms('365d'),
        expirationDate: Date.now() - ms('300d')
      }, function (err, newToken) {
        if (err) return done(err);
        expect(newToken).to.have.property('token');
        expect(newToken.token).to.have.length.above(10);
        expect(newToken).to.have.property('type')
          .and.be.equal('lostPassword');
        expect(newToken).to.have.property('fired')
          .and.be.equal(false);
        expect(newToken).to.have.property('_user')
          .and.be.deep.equal(user._id);
        expect(newToken).to.have.property('isValid')
          .and.be.equal(false);
        expect(newToken).to.have.property('creationDate');
        expect(newToken.creationDate.getTime()).to.be.at.most(Date.now());
        expect(newToken).to.have.property('expirationDate');
        expect(newToken.expirationDate.getTime()).to.be.at.most(Date.now());

        Token.findValidToken(newToken.token, function (err, item) {
          if (err) return done(err);
          expect(item).to.be.null;
          return done();
        });
      });
    });
    it('should not be a valid token if a token with fired flag is created', function (done) {
      Token.createNew({
        type: 'lostPassword',
        _user: user._id,
        fired: true,
      }, function (err, newToken) {
        if (err) return done(err);
        expect(newToken).to.have.property('token');
        expect(newToken.token).to.have.length.above(10);
        expect(newToken).to.have.property('type')
          .and.be.equal('lostPassword');
        expect(newToken).to.have.property('fired')
          .and.be.equal(true);
        expect(newToken).to.have.property('_user')
          .and.be.deep.equal(user._id);
        expect(newToken).to.have.property('isValid')
          .and.be.equal(false);
        expect(newToken).to.have.property('creationDate');
        expect(newToken.creationDate.getTime()).to.be.at.most(Date.now());
        expect(newToken).to.have.property('expirationDate');
        expect(newToken.expirationDate.getTime()).to.be.at.least(Date.now());

        Token.findValidToken(newToken.token, function (err, item) {
          if (err) return done(err);
          expect(item).to.be.null;
          return done();
        });
      });
    });
    it('should not be a valid token if a token is fired and then checked', function (done) {
      Token.createNew({
        type: 'lostPassword',
        _user: user._id,
        fired: false,
      }, function (err, newToken) {
        if (err) return done(err);
        expect(newToken).to.have.property('token');
        expect(newToken.token).to.have.length.above(10);
        expect(newToken).to.have.property('type')
          .and.be.equal('lostPassword');
        expect(newToken).to.have.property('fired')
          .and.be.equal(false);
        expect(newToken).to.have.property('_user')
          .and.be.deep.equal(user._id);
        expect(newToken).to.have.property('isValid')
          .and.be.equal(true);
        expect(newToken).to.have.property('creationDate');
        expect(newToken.creationDate.getTime()).to.be.at.most(Date.now());
        expect(newToken).to.have.property('expirationDate');
        expect(newToken.expirationDate.getTime()).to.be.at.least(Date.now());

        Token.findValidToken(newToken.token, function (err, item) {
          if (err) return done(err);
          expect(item).to.be.not.null;

          item.fire();
          expect(item).to.have.property('fired')
            .and.be.equal(true);
          expect(item).to.have.property('isValid')
            .and.be.equal(false);

          Token.findValidToken(item.token, function (err, internalItem) {
            if (err) return done(err);
            expect(internalItem).to.be.null;
            return done();
          });
        });
      });
    });
    it('should not find a token if it does not exist', function (done) {
      Token.createNew({
        type: 'lostPassword',
        _user: user._id,
        fired: false,
      }, function (err, newToken) {
        if (err) return done(err);
        expect(newToken).to.have.property('token');
        expect(newToken.token).to.have.length.above(10);
        expect(newToken).to.have.property('type')
          .and.be.equal('lostPassword');
        expect(newToken).to.have.property('fired')
          .and.be.equal(false);
        expect(newToken).to.have.property('_user')
          .and.be.deep.equal(user._id);
        expect(newToken).to.have.property('isValid')
          .and.be.equal(true);
        expect(newToken).to.have.property('creationDate');
        expect(newToken.creationDate.getTime()).to.be.at.most(Date.now());
        expect(newToken).to.have.property('expirationDate');
        expect(newToken.expirationDate.getTime()).to.be.at.least(Date.now());

        Token.findToken('fake-token', function (err, item) {
          if (err) return done(err);
          expect(item).to.be.null;
          return done();
        });
      });
    });
    it('should not find a valid token if it does not exist', function (done) {
      Token.createNew({
        type: 'lostPassword',
        _user: user._id,
        fired: false,
      }, function (err, newToken) {
        if (err) return done(err);
        expect(newToken).to.have.property('token');
        expect(newToken.token).to.have.length.above(10);
        expect(newToken).to.have.property('type')
          .and.be.equal('lostPassword');
        expect(newToken).to.have.property('fired')
          .and.be.equal(false);
        expect(newToken).to.have.property('_user')
          .and.be.deep.equal(user._id);
        expect(newToken).to.have.property('isValid')
          .and.be.equal(true);
        expect(newToken).to.have.property('creationDate');
        expect(newToken.creationDate.getTime()).to.be.at.most(Date.now());
        expect(newToken).to.have.property('expirationDate');
        expect(newToken.expirationDate.getTime()).to.be.at.least(Date.now());

        Token.findValidToken('fake-token', function (err, item) {
          if (err) return done(err);
          expect(item).to.be.null;
          return done();
        });
      });
    });

    it("should return 400 if a mail is not passed (no body object) for token issueing", function (done) {
      request(app)
        .post('/api/tokens/issue')
        .send()
        .expect(400)
        .end(function (err, res) {
          if (err) return done(err);
          done();
        });
    });

    it("should return 400 if a mail is not passed (empty body object) for token issueing", function (done) {
      request(app)
        .post('/api/tokens/issue')
        .send({})
        .expect(400)
        .end(function (err, res) {
          if (err) return done(err);
          done();
        });
    });

    it("should return 404 if wrong a mail is passed for token issueing", function (done) {
      request(app)
        .post('/api/tokens/issue')
        .send({email: 'fake-email-not-exist@example.com'})
        .expect(404)
        .end(function (err, res) {
          if (err) return done(err);
          done();
        });
    });

    it("should return 200 if a right mail is passed for token issueing", function (done) {
      request(app)
        .post('/api/tokens/issue')
        .send({email: user.email})
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);

          Token.findOne({_user: user._id}, function (err, item) {
            if (err) return done(err);

            expect(item).to.be.not.null
              .and.have.interface(tokenInterface);
            Token.findValidToken(item.token, function (err, validToken) {
              if (err) return done(err);

              expect(item).to.be.not.null
                .and.have.interface(tokenInterface);
              return done();
            });
          });
        });
    });

    it("should return 400 if no token is checked (1)", function (done) {
      request(app)
        .get('/api/tokens/check')
        .expect(400)
        .end(function (err, res) {
          if (err) return done(err);
          done();
        });
    });

    it("should return 400 if no token is checked (2)", function (done) {
      request(app)
        .get('/api/tokens/check?')
        .expect(400)
        .end(function (err, res) {
          if (err) return done(err);
          done();
        });
    });

    it("should return 400 if no token is checked (3)", function (done) {
      request(app)
        .get('/api/tokens/check?t')
        .expect(400)
        .end(function (err, res) {
          if (err) return done(err);
          done();
        });
    });

    it("should return 400 if no token is checked (4)", function (done) {
      request(app)
        .get('/api/tokens/check?t=')
        .expect(400)
        .end(function (err, res) {
          if (err) return done(err);
          done();
        });
    });

    it("should return false if a wrong token is checked", function (done) {
      request(app)
        .get('/api/tokens/check?t=wrong-token')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) return done(err);
          expect(res.body).to.exist;
          expect(res.body).to.have.interface(tokenCheckResponseInterface);
          expect(res.body.result).to.be.equal(false);
          done();
        });
    });

    it('should return true if a good token is checked', function (done) {
      request(app)
        .post('/api/tokens/issue')
        .send({email: user.email})
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);

          Token.findOne({_user: user._id}, function (err, item) {
            if (err) return done(err);
            request(app)
              .get('/api/tokens/check?t=' + item.token)
              .expect(200)
              .expect('Content-Type', /json/)
              .end(function (err, res) {
                if (err) return done(err);
                expect(res.body).to.exist;
                expect(res.body).to.have.interface(tokenCheckResponseInterface);
                expect(res.body.result).to.be.equal(true);
                done();
              });
          });
        });
    });

    it('should return true if a fired token is checked', function (done) {
      request(app)
        .post('/api/tokens/issue')
        .send({email: user.email})
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);

          Token.findOne({_user: user._id}, function (err, item) {
            if (err) return done(err);
            item.fire();
            request(app)
              .get('/api/tokens/check?t=' + item.token)
              .expect(200)
              .expect('Content-Type', /json/)
              .end(function (err, res) {
                if (err) return done(err);
                expect(res.body).to.exist;
                expect(res.body).to.have.interface(tokenCheckResponseInterface);
                expect(res.body.result).to.be.equal(false);
                done();
              });
          });
        });
    });

    it("should return 403 if no token is passed to /passwordChange", function (done) {
      request(app)
        .post('/api/tokens/passwordChange')
        .expect(403)
        .send({})
        .end(function (err, res) {
          if (err) return done(err);
          done();
        });
    });

    it("should return 403 if empty token is passed to /passwordChange", function (done) {
      request(app)
        .post('/api/tokens/passwordChange')
        .expect(403)
        .send({token: ''})
        .end(function (err, res) {
          if (err) return done(err);
          done();
        });
    });
// ***************************************************************************************************************************
    it("should return 403 if wrong token is passed to /passwordChange", function (done) {
      request(app)
        .post('/api/tokens/passwordChange')
        .expect(403)
        .send({token: 'fake-token', password: 'new-password'})
        .end(function (err, res) {
          if (err) return done(err);
          done();
        });
    });

    it("should return 403 if /passwordChange is callen without new password", function (done) {
      request(app)
        .post('/api/tokens/issue')
        .send({email: user.email})
        .expect(200)
        .end(function (err, res) {
          Token.findOne({_user: user._id}, function (err, foundToken) {
            if (err) return done(err);

            expect(foundToken).to.have.property('isValid')
              .and.be.equal(true);

            request(app)
              .post('/api/tokens/passwordChange')
              .send({token: foundToken.token})
              .expect(403)
              .end(function (err, res) {
                if (err) return done(err);
                  return done();
              });
          });
        });
    });

    it("should return 200 (and change password) if /passwordChange goes, than token is not valid anymore", function (done) {
      request(app)
        .post('/api/tokens/issue')
        .send({email: user.email})
        .expect(200)
        .end(function (err, res) {
          Token.findOne({_user: user._id}, function (err, foundToken) {
            if (err) return done(err);

            expect(foundToken).to.have.property('isValid')
              .and.be.equal(true);

            request(app)
              .post('/api/tokens/passwordChange')
              .send({token: foundToken.token, password: 'New-Password-JuHy776.09$'})
              .expect(200)
              .end(function (err, res) {
                if (err) return done(err);
                User.findOne({_id: user._id}, function (err, foundUser) {
                  expect(foundUser.hashedPassword).to.exist;
                  expect(user.hashedPassword).to.exist;
                  expect(foundUser.hashedPassword).to.be.not.equal(user.hashedPassword);

                  request(app)
                    .get('/api/tokens/check?t=' + foundToken.token)
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                      if (err) return done(err);
                      expect(res.body).to.exist;
                      expect(res.body).to.have.interface(tokenCheckResponseInterface);
                      expect(res.body.result).to.be.equal(false);
                      return done();
                    });
                });
              });
          });
        });
    });

  });

});
