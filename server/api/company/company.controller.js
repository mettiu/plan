'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var Company = require('./company.model');

/**
 * Creates new company in DB.
 * In case of success returns http code 201 with the company created.
 * @param req
 * @param res
 */
exports.create = function (req, res, next) {
  Company.create(req.body, function (err, company) {
    if (err) {
      return next(err);
    }
    return res.status(201).json(company);
  });
};

/**
 * List companies. Accepts optional parameter req.body.active <boolean> to match only active
 * or inactive companies.
 * In case of success returns http code 200 with the array of companies found.
 * @param req
 * @param res
 */
exports.index = function (req, res, next) {
  var query = {};
  if (req.body.active !== undefined && typeof(req.body.active) === "boolean") query = {active: req.body.active};
  Company.find(query, function (err, companys) {
    if (err) {
      return next(err);
    }
    return res.status(200).json(companys);
  });
};

/**
 * List active companies, filtering by company name. Company name is got from query 'value' parameter.
 * Every company whose name starts with 'value' id found.
 * In case of success returns http code 200 with the array of companies found.
 * @param req
 * @param res
 */
exports.find = function (req, res) {
  Company.find({'name': new RegExp('^' + req.query.value, 'i'), active: true}, '_id name', function (err, companies) {
    if (err) {
      return next(err);
    }
    return res.status(200).json(companies);
  });
};

// Get a single company
/**
 * Get details for one company, finding by Id.
 * CastError is thrown by Mongoose if id string does not represent a valid ObjectId.
 * @param req
 * @param res
 * @param next
 */
exports.show = function (req, res, next) {
  Company.findById(req.params.id, function (err, company) {
    if (err) {
      return next(err);
    }
    if (!company) {
      return res.status(404).send('Not Found');
    }
    return res.status(200).json(company);
  });
};

// Updates an existing company in the DB.
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Company.findById(req.params.id, function (err, company) {
    if (err) {
      return handleError(res, err);
    }
    if (!company) {
      return res.status(404).send('Not Found');
    }
    var updated = _.merge(company, req.body);
    updated.save(function (err) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(200).json(company);
    });
  });
};

// Deletes a company from the DB.
exports.destroy = function (req, res) {
  Company.findById(req.params.id, function (err, company) {
    if (err) {
      return handleError(res, err);
    }
    if (!company) {
      return res.status(404).send('Not Found');
    }
    company.remove(function (err) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(204).send('No Content');
    });
  });
};

//TODO: check this function (handleError)
//function handleError(res, err) {
//  return res.status(500).send(err);
//}
