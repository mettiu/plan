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

//    default: randomString.generate(TOKEN_LENGTH), //randomAsciiString(TOKEN_LENGTH), //crypto.randomBytes(TOKEN_LENGTH).toString('base64').toUpperCase(),
    minlength: TOKEN_LENGTH,
    maxlength: TOKEN_LENGTH
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
    //console.log("findToken: " + token);
    this.findOne({token: token}, cb);
    //this.findOne({email: email}, cb);
  },

  findValidToken: function (token, cb) {
    //console.log("findToken: " + token);
    this.findOne({token: token}, function(err, item) {
      if (err) return cb(err, null);
      if (!item || !item.isValid) return cb(null, null);
      return cb(null, item);
    });
    //this.findOne({email: email}, cb);
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

  //createTokenForUser: function (userId, type) {
  //  // TODO: questa funzione dovrebbe anche salvare il token, oltre a crearlo.
  //  // TODO: questo metodo dovrebbe essere uno static
  //  // TODO: la stringa del token è '0': mettere una stringe reale. Cioè inserire solo lo username e poi con save() tutti i defaul vanno a posto (cerificare e scrivere i test)
  //  switch (type) {
  //    case 'lostPassword':
  //      this.token = '0';
  //      this._user = userId;
  //      this.creationDate = Date.now();
  //      this.expirationDate = this.creationDate.getTime() + TOKEN_EXPIRATION_MS;
  //      break;
  //    case 'fake second case':
  //      break;
  //  }
  //  return this.token;
  //},

  fire: function (callback) {
    this.fired = true;
    this.save(callback);
  }

};

module.exports = mongoose.model('Token', TokenSchema);

///** Sync */
//function randomString(length, chars) {
//  if (!chars) {
//    throw new Error('Argument \'chars\' is undefined');
//  }
//
//  var charsLength = chars.length;
//  if (charsLength > 256) {
//    throw new Error('Argument \'chars\' should not have more than 256 characters'
//      + ', otherwise unpredictability will be broken');
//  }
//
//  var randomBytes = crypto.randomBytes(length);
//  var result = new Array(length);
//
//  var cursor = 0;
//  for (var i = 0; i < length; i++) {
//    cursor += randomBytes[i];
//    result[i] = chars[cursor % charsLength];
//  }
//
//  return result.join('');
//}
//
///** Sync */
//function randomAsciiString(length) {
//  return randomString(length,
//    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
//}
