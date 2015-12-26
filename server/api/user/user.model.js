'use strict';
//var _ = require('lodash');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var _ = require('lodash');
var authTypes = ['github', 'twitter', 'facebook', 'google'];
var Category = require('../category/category.model');
var Team = require('../team/team.model');

var SupplyCategoriesSchema = new Schema({
  _company: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  _category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  }
});

var TeamSchema = new Schema({
  _company: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  _team: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  }
});

var UserSchema = new Schema({
  name: String,
  email: {type: String, lowercase: true},
  companies: [{
    type: Schema.Types.ObjectId,
    ref: 'Company'
  }],
  teams: [ TeamSchema ],
  categories: [{
    type: Schema.Types.ObjectId,
    ref: 'Category'
  }],
  supplyCategories: [ SupplyCategoriesSchema ],
  hashedPassword: String,
  provider: String,
  salt: String,
  facebook: {},
  twitter: {},
  google: {},
  github: {}
});


/**
 * Virtuals
 */
UserSchema
  .virtual('password')
  .set(function (password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashedPassword = this.encryptPassword(password);
  })
  .get(function () {
    return this._password;
  });

// Public profile information
UserSchema
  .virtual('profile')
  .get(function () {
    return {
      '_id': this._id,
      'name': this.name,
      'email': this.email,
      '_company': this._company,
      'role': this.role
    };
  });

// Non-sensitive info we'll be putting in the token
UserSchema
  .virtual('token')
  .get(function () {
    return {
      '_id': this._id,
      'role': this.role
    };
  });

/**
 * Validations
 */

// Validate empty email
UserSchema
  .path('email')
  .validate(function (email) {
    if (authTypes.indexOf(this.provider) !== -1) return true;
    return email.length;
  }, 'Email cannot be blank');

// Validate empty password
UserSchema
  .path('hashedPassword')
  .validate(function (hashedPassword) {
    if (authTypes.indexOf(this.provider) !== -1) return true;
    return hashedPassword.length;
  }, 'Password cannot be blank');

// Validate email is not taken
UserSchema
  .path('email')
  .validate(function (value, respond) {
    var self = this; //save 'this' into a temp variable named 'self'
    this.constructor.findOne({email: value}, function (err, user) {
      if (err) throw err;
      if (user) {
        if (self.id === user.id) return respond(true);
        return respond(false);
      }
      respond(true);
    });
  }, 'The specified email address is already in use.');

// Validate supplyCategories
UserSchema
  .path('supplyCategories')
  .validate(function (supplyCategoriesArray, respond) {
    validateCategoriesOrTeams(supplyCategoriesArray, respond, ['_company', '_category'], this, Category);
  }, 'The specified supply categories are not valid.');

// Validate Teams
UserSchema
  .path('teams')
  .validate(function (supplyTeamsArray, respond) {
    validateCategoriesOrTeams(supplyTeamsArray, respond, ['_company', '_team'], this, Team);
  }, 'The specified teams are not valid.');

// fieldArray shuld containf the name of the fields of supplyCategory or Team.
// the order matters! first is company id field, second is team/category id field!!
function validateCategoriesOrTeams (validationArray, respond, fieldArray, selfDocument, obj) {
  // nothing to do...
  if (!validationArray.length) return respond(true);

  // otherwise, let's work!
  removeDuplicates(validationArray, fieldArray);
  // get the list of companies involved for which user have al least one category
  var supplyCategoriesOrTeamsCompaniesArray = _.uniq(_.pluck(validationArray, '_company'));
  // get intersection between these companies and the list of companies the user is allowed to work for
  var intersection = _.intersection(supplyCategoriesOrTeamsCompaniesArray, selfDocument._doc.companies);
  // Supply categories (or teams) set should be contained into company list set:
  // so intesection should be equal to supply categories set. Otherwise, there is a category/company (or team/company)
  // whose company is not allowed for user
  if (intersection.length !== supplyCategoriesOrTeamsCompaniesArray.length) return respond(false);

  // now let's check if the categories (or teams) exist and are linked to user's companies
  var expressionArray = [];
  validationArray.forEach(function(element) {
    //expressionArray.push({'_id': element._category, '_company': element._company});
    expressionArray.push({'_id': element[fieldArray[1]], '_company': element[fieldArray[0]]});
  });
  obj.count({$or: expressionArray}, function (err, count) {
    if (err) return respond(false);
    if (count < validationArray.length) return respond(false);
    return respond(true);
  });

}

var validatePresenceOf = function (value) {
  return value && value.length;
};

/**
 * Pre-save hook
 */
UserSchema
  .pre('save', function (next) {
    if (!this.isNew) return next();

    if (!validatePresenceOf(this.hashedPassword) && authTypes.indexOf(this.provider) === -1)
      next(new Error('Invalid password'));
    else
      next();
  });

/**
 * Statics
 */
UserSchema
  .statics = {

  findByEmail: function (email, cb) {
    var xxx = this.findOne({email: email}, cb);
    return xxx;
  },

  createNew: function (model, callback) {
    (new this(model)).save(callback);
  }
};

/**
 * Methods
 */
UserSchema.methods = {
  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
   */
  authenticate: function (plainText) {
    return this.encryptPassword(plainText) === this.hashedPassword;
  },

  /**
   * Make salt
   *
   * @return {String}
   * @api public
   */
  makeSalt: function () {
    return crypto.randomBytes(16).toString('base64');
  },

  /**
   * Encrypt password
   *
   * @param {String} password
   * @return {String}
   * @api public
   */
  encryptPassword: function (password) {
    if (!password || !this.salt) return '';
    var salt = new Buffer(this.salt, 'base64');
    return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
  },

  addUserCategory: function (categoryId, callback) {
    // TODO: check if category exists!
    this.categories.push(categoryId);
    if (callback) this.save(callback);
  },

  removeUserCategory: function (categoryId) {
    var removed = _.remove(this.categories, function (catId) {
      return catId.toString() === categoryId.toString();
    });
    if (callback) this.save(callback);
  },

  addSupplyCategoryForCompany: function (supplyCategoryId, companyId) {
    console.log("Aggiungo!");
    return true;
  }


};

function checkAcl(acl) {
  return !!(typeof acl === 'object' && acl.hasOwnProperty('_company') && acl.hasOwnProperty('role'));

}

// TODO: bring this to a service module
function removeDuplicates(arr, fieldArray) {
  // save a copy of the array and uniq the copy into a temp variable
  var temp = _.uniq(_.clone(arr), function (item) {
    var returnString = '';
    fieldArray.forEach(function (element) {
      returnString += item[element];
    });
    return returnString; //item['_company'].toString() + item['_category'].toString();
  });
  //console.log('[' + arr.length + ',' + temp.length + ']');
  //empty the original array
  arr.splice(0, arr.length);
  // push into the origina array the uniq-ed array
  for (var i = 0; i < temp.length; i++) {
    arr.push(temp[i]);
  }
  // if we don't do in this way, all the references to the array (user in other parts of mongoose framework)
  // does not point to the new array. Array substitution creates a new variable and the other references are lost!
}

module.exports = mongoose.model('User', UserSchema);
