'use strict';

var should = require('should');
var faker = require('faker');
faker.locale = "it";
var request = require('supertest');
var app = require('../../app');
var User = require('../user/user.model');
var Token = require('./token.model');

var user = new User({
  provider: 'local',
  name: 'Fake User',
  email: 'test@test.com',
  password: 'password'
});


describe('User Model with Token', function () {
  before(function (done) {
    // Clear users and companies before testing
    User.remove().exec().then(function () {
      Token.remove().exec().then(function () {
        done();
      });
    });
  });

  after(function (done) {
    // Clear users and companies after testing
    User.remove().exec().then(function () {
      Token.remove().exec().then(function () {
        done();
      });
    });
  });

  it('should begin with no users and no companies', function (done) {
    User.find({}, function (err, users) {
      users.should.have.length(0);
      Token.find({}, function (err, items) {
        items.should.have.length(0);
        done();
      });
    });
  });

  it('should save the fake user', function (done) {
    user.save(function () {
      User.find({}, function (err, users) {
        users.should.have.length(1);
        done();
      });
    });
  });

  var tokenString = null;

  it('should create a token for the fake user', function (done) {
    var token = new Token({_user: user._id, type: 'lostPassword'});
    token.save(function (err, savedItem, numAffected) {
      if (err) return done(err);
      tokenString = token.token;
      tokenString.should.be.a.String();
      savedItem.should.be.instanceOf(Object);
      savedItem._user.should.be.equal(user._id);
      numAffected.should.be.equal(1);
      done();
    });
  });

  it('should find one only token (looking directly in DB)', function (done) {
    Token.find({}, function (err, items) {
      items.should.have.length(1);
      done();
    });
  });

  it('should find a valid token for valid user', function (done) {
    Token.findToken(tokenString, function (err, item) {
      if (err) return done(err);
      item.should.be.instanceOf(Object);
      item.isValid.should.be.equal(true); //newly created token should not be expired yet!
      done();
    })
  });

  it('should not find a valid token if a fake token is provided for a valid user', function (done) {
    Token.findToken('fake-token-should-return-null', function (err, item) {
      if (err) return done(err);
      should.not.exist(item);
      done();
    })
  });

  it('should not find the token after firing it', function (done) {
    Token.findToken(tokenString, function (err, item) {
      if (err) return done();
      item.should.be.instanceOf(Object);
      item.isValid.should.be.equal(true); //newly created token should not be expired yet!
      item.fire();
      item.isValid.should.be.equal(false);
      done();
    })
  });


  it("should get a true result when a valid token is checked", function (done) {
    var token = new Token({_user: user._id, type: 'lostPassword'});
    token.save(function (err) {
      if (err) return done(err);
      console.log(tokenString);
      request(app)
        .post('/api/users/lostpassword?t=' + token.token)
        .send()
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) return done(err);
          console.log(res.body);
          res.body.should.be.instanceOf(Object);
          res.body.result.should.be.Boolean();
          res.body.result.should.be.true();
          done();
        });
    });
  });

});
