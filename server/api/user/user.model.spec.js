'use strict';

var should = require('should');
var faker = require('faker');
faker.locale = "it";
var app = require('../../app');
var User = require('./user.model');
var Company = require('../company/company.model');

var companyArraySize = 300;

var user = new User({
  provider: 'local',
  name: 'Fake User',
  email: 'test@test.com',
  password: 'password'
});

var companyArray = [];
for (var i = 0; i < companyArraySize; i++) {
  var company = new Company({
    name: faker.company.companyName() + ' ' + faker.company.companySuffix(),
    info: faker.lorem.sentence()
  });
  companyArray.push(company);
}

describe('User Model with Company', function () {
  before(function (done) {
    // Clear users before testing
    User.remove().exec().then(function () {
      Company.remove().exec().then(function () {
        done();
      });
    });
  });

  //afterEach(function(done) {
  //  User.remove().exec().then(function() {
  //    done();
  //  });
  //});

  it('should begin with no users and no companies', function (done) {
    User.find({}, function (err, users) {
      users.should.have.length(0);
      Company.find({}, function (err, companies) {
        companies.should.have.length(0);
        done();
      });
    });
  });

  it('should save ' + companyArraySize + ' fake companies', function (done) {
    companyArray.forEach(function (item) {
      item.save();
    });
    done();
  });

  it('should find all the ' + companyArraySize + ' fake companies saved', function (done) {
    Company.find({}, function (err, comps) {
      comps.should.have.length(companyArraySize);
    });
    done();
  });

  it('should save the fake user', function (done) {
    user.acls = [
      {_company: companyArray[0]._id, role: 'fakeRole-1'},
      {_company: companyArray[1]._id, role: 'fakeRole-2'}
    ];
    user.save(function () {
      User.find({}, function (err, users) {
        users.should.have.length(1);
        done();
      });
    });
  });

  it('should add a new role to User', function (done) {
    var aclsCount = user.acls.length;
    user.setUserRoleForCompany('fakeRole-3', companyArray[0]._id).should.be.equal(true);
    user.save().then(function (savedUser) {
      savedUser.acls.should.have.length(aclsCount + 1);
      //console.log("dopo: " + acls);
      done();
    });
  });

  it('should check role existence for User', function (done) {
    user.hasAuthorizationForRoleAndCompanyId('fakeRole-3', companyArray[0]._id).should.be.equal(true);
    user.hasAuthorizationForRoleAndCompanyId('non-sense', companyArray[0]._id).should.be.equal(false);
    done();
  });

  it('should not add a duplicate role to User', function (done) {
    var aclsCount = user.acls.length;
    user.setUserRoleForCompany('fakeRole-3', companyArray[0]._id).should.be.equal(false);
    user.save().then(function (savedUser) {
      savedUser.acls.should.have.length(aclsCount);
      done();
    });
  });

  it('should get the user roles', function (done) {
    var roleArray = user.getUserRolesForCompany(companyArray[0]._id);
    roleArray.should.be.a.Array();
    roleArray.should.have.length(2);
    roleArray.should.containEql('fakeRole-1');
    roleArray.should.containEql('fakeRole-3');
    roleArray.should.not.containEql('non-sense');
    done();
  });

  it('should add an acl with a new role to User', function (done) {
    var aclsCount = user.acls.length;
    user.setUserAcl({role: 'fakeRole-4', _company: companyArray[0]._id}).should.be.equal(true);
    user.save().then(function (savedUser) {
      savedUser.acls.should.have.length(aclsCount + 1);
      done();
    });
  });

  it('should not add an acl with a duplicate role to User', function (done) {
    var aclsCount = user.acls.length;
    user.setUserAcl({role: 'fakeRole-4', _company: companyArray[0]._id}).should.be.equal(false);
    user.save().then(function (savedUser) {
      savedUser.acls.should.have.length(aclsCount);
      done();
    });
  });

  it('should not add a badly formatted acl', function (done) {
    var aclsCount = user.acls.length;
    user.setUserAcl({roleNonSense: 'fakeRole-4', _company: companyArray[0]._id}).should.be.equal(false);
    user.setUserAcl({role: 'fakeRole-4', _companyNonSense: companyArray[0]._id}).should.be.equal(false);
    user.setUserAcl({_company: companyArray[0]._id}).should.be.equal(false);
    user.setUserAcl({roleNonSense: 'fakeRole-4'}).should.be.equal(false);
    user.setUserAcl({}).should.be.equal(false);
    user.setUserAcl(123456).should.be.equal(false);
    user.setUserAcl("123456").should.be.equal(false);
    user.save().then(function (savedUser) {
      savedUser.acls.should.have.length(aclsCount);
      done();
    });
  });

  it('should add some acls to User', function (done) {
    var aclsCount = user.acls.length;
    user.setUserAcls([
      {role: 'fakeRole-1', _company: companyArray[0]._id}, // already exists
      {role: 'fakeRole-2', _company: companyArray[0]._id}, // new
      {role: 'fakeRole-3', _company: companyArray[0]._id}, // already exists
      {role: 'fakeRole-4', _company: companyArray[0]._id}, // already exists
      {role: 'fakeRole-5', _company: companyArray[0]._id}  // new
    ]).should.be.equal(2); // 2 inserted
    user.save().then(function (savedUser) {
      savedUser.acls.should.have.length(aclsCount + 2);
      done();
    });
  });

  it('should fail when saving a duplicate user', function (done) {
    user.save(function () {
      var userDup = new User(user);
      userDup.save(function (err) {
        should.exist(err);
        done();
      });
    });
  });

  it('should fail when saving without an email', function (done) {
    user.email = '';
    user.save(function (err) {
      should.exist(err);
      done();
    });
  });

  it("should authenticate user if password is valid", function () {
    return user.authenticate('password').should.be.true;
  });

  it("should not authenticate user if password is invalid", function () {
    return user.authenticate('blah').should.not.be.true;
  });

});
