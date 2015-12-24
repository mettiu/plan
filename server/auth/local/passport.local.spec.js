'use strict';

var should = require('should');
var request = require('supertest');
var jwt = require('jsonwebtoken');
var app = require('../../app');
var config = require('../../config/environment');
var User = require('../../api/user/user.model');
var Token = require('../../api/token/token.model');

var user = new User({
  provider: 'local',
  name: 'Fake User',
  email: 'test@test.com',
  password: 'password'
});

describe('Passport local strategy test', function () {
  before(function (done) {
    // Clear users and companies before testing
    User.remove().exec().then(function () {
      done();
    });
  });

  after(function (done) {
    // Clear users and companies after testing
    User.remove().exec().then(function () {
      Token.remove().exec().then(function(){
        done();
      })

    });
  });

  it('should begin with no users and no companies', function (done) {
    User.find({}, function (err, users) {
      users.should.have.length(0);
        done();
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

  it("should authenticate user if password is valid", function (done) {
    request(app)
      .post('/auth/local')
      .send({email: user.email, password: user.password})
      //.field('email', user.email)
      //.field('password', user.password)
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) return done(err);
        //console.log(res.body);
        res.body.should.be.instanceOf(Object);
        res.body.should.have.property('token');
        jwt.verify(res.body.token, config.secrets.session, function(err, decoded) {
          if (err) return done(err);
          //console.log(decoded._id);
          //console.log(user._id);
          decoded._id.should.be.equal('' + user._id);
          done();
        });
      });
  });

  it("should not authenticate user if password is invalid", function () {
    return user.authenticate('blah').should.not.be.true;
  });

});

