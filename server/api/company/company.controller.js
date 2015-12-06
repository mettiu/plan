'use strict';

var _ = require('lodash');
var Company = require('./company.model');

// Get list of companys
exports.index = function(req, res) {
  Company.find(function (err, companys) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(companys);
  });
};

// Get list of companys
exports.find = function(req, res) {
  Company.find({'name': new RegExp('^' + req.query.value, 'i')}, '_id name', function (err, companies) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(companies);
  });
};

// Get a single company
exports.show = function(req, res) {
  Company.findById(req.params.id, function (err, company) {
    if(err) { return handleError(res, err); }
    if(!company) { return res.status(404).send('Not Found'); }
    return res.json(company);
  });
};

// Creates a new company in the DB.
exports.create = function(req, res) {
  Company.create(req.body, function(err, company) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(company);
  });
};

// Updates an existing company in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Company.findById(req.params.id, function (err, company) {
    if (err) { return handleError(res, err); }
    if(!company) { return res.status(404).send('Not Found'); }
    var updated = _.merge(company, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(company);
    });
  });
};

// Deletes a company from the DB.
exports.destroy = function(req, res) {
  Company.findById(req.params.id, function (err, company) {
    if(err) { return handleError(res, err); }
    if(!company) { return res.status(404).send('Not Found'); }
    company.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}
