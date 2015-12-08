'use strict';

// good ideas here: http://sahatyalkabov.com/how-to-implement-password-reset-in-nodejs/

var crypto = require('crypto');
var ms = require('ms');
var TOKEN_EXPIRATION_MS = ms('1d'); // token expiration date is 1 day
var TOKEN_DELETION_DELAY_AFTER_EXPIRATION = ms('5m'); // tokens are deleted 5 min after expiration
var TOKEN_LENGTH = 20;

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var TokenSchema = new Schema({
  token: {
    type: String,
    default: crypto.randomBytes(TOKEN_LENGTH).toString('hex').toUpperCase(),
    minLength: TOKEN_LENGTH,
    maxLength: TOKEN_LENGTH
  },
  _user: {type: Schema.Types.ObjectId, ref: 'User'},
  creationDate: {type: Date, default: Date.now()},
  expirationDate: {
    type: Date,
    default: Date.now() + TOKEN_EXPIRATION_MS,
    expires: (TOKEN_DELETION_DELAY_AFTER_EXPIRATION / 1000) // in seconds!
  },
  type: {
    type: String,
    minLength: 3,
    maxLength: 20
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

  findToken: function (token, userId, cb) {
    return this.findOne({token: token, _user: userId, fired: false}, cb);
  },

};

/**
 * Methods
 */
TokenSchema
  .methods = {

  createTokenForUser: function (userId, type) {
    switch (type) {
      case 'lostPassword':
        this.token = '0';
        this._user = userId;
        this.creationDate = Date.now();
        this.expirationDate = this.creationDate.getTime() + TOKEN_EXPIRATION_MS;
        break;
      case 'fake second case':
        break;
    }
    return this.token;
  },

  fire: function () {
    this.fired = true;
  }
};

module.exports = mongoose.model('Token', TokenSchema);
