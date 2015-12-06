'use strict';

var _ = require('lodash');
var Feature = require('./feature.model');

// Get list of features
exports.index = function(req, res) {
  Feature.find({})
    .sort('tId')
    .exec(function (err, features) {
      if(err) { return handleError(res, err); }
      return res.status(200).json(features);
    });


  //Feature.find(function (err, features) {
  //  if(err) { return handleError(res, err); }
  //  return res.status(200).json(features);
  //});
};

// Get a single feature
exports.show = function(req, res) {
  Feature.findById(req.params.id, function (err, feature) {
    if(err) { return handleError(res, err); }
    if(!feature) { return res.status(404).send('Not Found'); }
    return res.json(feature);
  });
};

// Creates a new feature in the DB.
exports.create = function(req, res) {
  Feature.create(req.body, function(err, feature) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(feature);
  });
};

// Updates an existing feature in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Feature.findById(req.params.id, function (err, feature) {
    if (err) { return handleError(res, err); }
    if(!feature) { return res.status(404).send('Not Found'); }
    var updated = _.merge(feature, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(feature);
    });
  });
};

// Deletes a feature from the DB.
exports.destroy = function(req, res) {
  Feature.findById(req.params.id, function (err, feature) {
    if(err) { return handleError(res, err); }
    if(!feature) { return res.status(404).send('Not Found'); }
    feature.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}
