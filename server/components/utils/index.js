'use strict';

var async = require('async');

/**
 * Accepts an array of Monggoose models and empties the corresponding collections from the DB with a remove() call.
 * Pay attenction: nothing remains in collections after this function is called!
 *
 * @param modelsToRemove
 * @param callback
 */
exports.mongooseRemoveAll = function(modelsToRemove, callback) {
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

