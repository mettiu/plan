'use strict';

var async = require('async');

/**
 * Accepts an array of Monggoose models and empties the corresponding collections from the DB with a remove() call.
 * Pay attenction: nothing remains in collections after this function is called!
 *
 * @param modelsToRemove
 * @param callback
 */
exports.mongooseRemoveAll = function (modelsToRemove, callback) {
  if (!modelsToRemove || !Array.isArray(modelsToRemove)) {
    return callback('first parameter should be an Array of Mongoose models')
  }
  async.each(modelsToRemove,
    function (model, cb) {
      model.remove(function (err) {
        if (err) cb(err);
        cb();
      });
    }, function (err) {
      if (err) return callback(err);
      return callback();
    });
};

exports.mongooseCreate = function (model, documentsToCreate, callback) {
  if (!documentsToCreate || !Array.isArray(documentsToCreate)) {
    return callback('first parameter should be an Array of Mongoose models')
  }

  model.create(documentsToCreate, function(err, insertedDocuments) {
    if (err) return callback(err);
    callback(null, insertedDocuments);
  });
  //async.each(documentsToCreate,
  //  function (document, cb) {
  //    model.create(document, function (err, created) {
  //      if (err) return cb(err);
  //      cb();
  //    });
  //  }, function (err) {
  //    if (err) return callback(err);
  //    return callback();
  //  });
};


// CUSTOM ERROR TYPE EXAMPLE

//module.exports = function CustomError(message, extra) {
//  Error.captureStackTrace(this, this.constructor);
//  this.name = this.constructor.name;
//  this.message = message;
//  this.extra = extra;
//};
//
//require('util').inherits(module.exports, Error);
//
// ---------------------
//
//var CustomError = require('./errors/custom-error');
//
//function doSomethingBad() {
//  throw new CustomError('It went bad!', 42);
//}
