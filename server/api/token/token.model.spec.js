'use strict';

var should = require('should');
var faker = require('faker');
faker.locale = "it";
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

  //after(function (done) {
  //  // Clear users and companies after testing
  //  User.remove().exec().then(function () {
  //    Token.remove().exec().then(function () {
  //      done();
  //    });
  //  });
  //});

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
    var token = new Token( { _user: user._id, type: 'lostPassword' } );
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

  it('should find one only token (looking directly in DB)', function(done) {
    Token.find({}, function (err, items) {
      items.should.have.length(1);
      done();
    });
  })

  it('should find a valid token for fake user', function (done) {
    Token.findToken(tokenString, user._id, function(err, item) {
      if (err) return done();
      item.should.be.instanceOf(Object);
      item.isValid.should.be.equal(true); //newly created token should not be expired yet!
      done();
    })
  });

  it('should not find the token after firing it', function (done) {
    Token.findToken(tokenString, user._id, function(err, item) {
      if (err) return done();
      item.should.be.instanceOf(Object);
      item.isValid.should.be.equal(true); //newly created token should not be expired yet!
      item.fire();
      item.isValid.should.be.equal(false);
      done();
    })
  });

});
