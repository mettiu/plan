'use strict';

var async = require('async'),
  app = require('../../app'),
  request = require('supertest');

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

/**
 * Logs user with supplied email and password, then callback is called
 * with parameters
 * - err
 * - res
 * @param {string} email
 * @param {string} password
 * @param {function} callback
 */
exports.restLogin = function (email, password, callback) {
  request(app)
    .post('/auth/local')
    .send({email: email, password: password})
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function (err, res) {
      if (err) return callback(err);
      callback(null, res);
    });
};
