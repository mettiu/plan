'use strict';

//var _ = require('lodash');
var Category = require('./category.model');
var errors = require('../../components/errors');


/**
 * Creates new category in DB.
 * In case of success returns http code 201 with the company created.
 * @param req
 * @param res
 */
exports.create = function (req, res, next) {
  Category.create(req.body, function (err, category) {
    if (err) {
      return next(err);
    }
    return res.status(201).json(category);
  });
};


