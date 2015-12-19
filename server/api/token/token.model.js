'use strict';

// good ideas here: http://sahatyalkabov.com/how-to-implement-password-reset-in-nodejs/

//var crypto = require('crypto');
var randomString = require('randomstring');
var ms = require('ms');
var TOKEN_EXPIRATION_MS = ms('1d'); // token expiration date is 1 day
var TOKEN_DELETION_DELAY_AFTER_EXPIRATION = ms('5m'); // tokens are deleted 5 min after expiration
var TOKEN_LENGTH = 50;

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var TokenSchema = new Schema({
  token: {
    type: String,
    minlength: TOKEN_LENGTH,
    maxlength: TOKEN_LENGTH
  },
  _user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creationDate: {type: Date, default: Date.now()},
  expirationDate: {
    type: Date,
    default: Date.now() + TOKEN_EXPIRATION_MS,
    expires: (TOKEN_DELETION_DELAY_AFTER_EXPIRATION / 1000) // in seconds!
  },
  type: {
    type: String,
    minlength: 3,
    maxlength: 20
  },
  fired: {
    type: Boolean,
    default: false
  } // when a token gets fired, it can't be used any more
});

TokenSchema
  .virtual('isValid')
  .get(function () {
    return !(Date.now() > this.expirationDate.getTime() || this.fired);
  });

/**
 * Statics
 */
TokenSchema
  .statics = {

  findToken: function (token, cb) {
    this.findOne({token: token}, cb);
  },

  findValidToken: function (token, cb) {
    this.findOne({token: token}, function(err, item) {
      if (err) return cb(err, null);
      if (!item || !item.isValid) return cb(null, null);
      return cb(null, item);
    });
  },

  createNew: function (model, callback) {
    model.token= randomString.generate(TOKEN_LENGTH);
    return (new this(model)).save(callback);
  }

};

/**
 * Methods
 */
TokenSchema
  .methods = {
  fire: function (callback) {
    this.fired = true;
    this.save(callback);
  }

};

module.exports = mongoose.model('Token', TokenSchema);
