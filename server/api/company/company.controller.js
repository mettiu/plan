'use strict';

var _ = require('lodash');
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
 * @param next
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
 * @param next
 */
exports.find = function (req, res, next) {
  Company.find({'name': new RegExp('^' + req.query.value, 'i'), active: true}, '_id name', function (err, companies) {
    if (err) {
      return next(err);
    }
    return res.status(200).json(companies);
  });
};

/**
 * Get details for one company, finding by Id.
 * CastError is thrown by Mongoose (and sent to next()) if id string does not represent a valid ObjectId.
 * In case of success returns http code 200 with found company. If no company matches with the given Id,
 * 404 is returned.
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

/**
 * Update a company by its Id.
 * CastError is thrown by Mongoose (and sent to next()) if id string does not represent a valid ObjectId.
 * In case of success returns http code 200 with the updated company. If no company matches with the given Id,
 * 404 is returned.
 * @param req
 * @param res
 * @param next
 */
exports.update = function (req, res, next) {
  if (req.body._id) {
    delete req.body._id;
  }
  Company.findById(req.params.id, function (err, company) {
    if (err) {
      return next(err);
    }
    if (!company) {
      return res.status(404).send('Not Found');
    }

    // array proprerties are replaced with new ones
    var updated = _.merge(company, req.body, function (from, to) {
      if (_.isArray(from)) {
        return to;
      }
    });
    updated.save(function (err) {
      if (err) {
        return next(err);
      }
      return res.status(200).json(updated);
    });
  });
};

/**
 * Deletes from DB a Company, finding it by its Id.
 * CastError is thrown by Mongoose (and sent to next()) if id string does not represent a valid ObjectId.
 * In case of success returns http code 204. If no company matches with the given Id, 404 is returned.
 * @param req
 * @param res
 * @param next
 */
exports.destroy = function (req, res, next) {
  Company.findById(req.params.id, function (err, company) {
    if (err) {
      return next(err);
    }
    if (!company) {
      return res.status(404).send('Not Found');
    }
    company.remove(function (err) {
      if (err) {
        return next(err);
      }
      return res.status(204).send('No Content');
    });
  });
};
