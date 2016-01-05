'use strict';

var _ = require('lodash');
var Category = require('./category.model');

/**
 * Creates new category in DB.
 * In case of success returns http code 201 with the category created.
 * @param req
 * @param res
 * @param next
 */
exports.create = function (req, res, next) {
  Category.create(req.body, function (err, category) {
    if (err) {
      return next(err);
    }
    return res.status(201).json(category);
  });
};

/**
 * List categories. Accepts optional parameter req.body.active <boolean> to match only active
 * or inactive companies.
 * In case of success returns http code 200 with the array of companies found.
 * @param req
 * @param res
 * @param next
 */
exports.index = function (req, res, next) {
  var query = {};
  if (req.body.active !== undefined && typeof(req.body.active) === "boolean")
    query.active = req.body.active;
  Category.find(query, function (err, categories) {
    if (err) {
      return next(err);
    }
    return res.status(200).json(categories);
  });
};

/**
 * List active categories, filtering by category name. Category name is got from query 'value' parameter.
 * Every category whose name starts with 'value' id found.
 * In case of success returns http code 200 with the array of categories found.
 * @param req
 * @param res
 * @param next
 */
exports.find = function (req, res, next) {
  Category.find({'name': new RegExp('^' + req.query.value, 'i'), active: true}, '_id name', function (err, categories) {
    if (err) {
      return next(err);
    }
    return res.status(200).json(categories);
  });
};

/**
 * Get details for one category, finding by Id.
 * CastError is thrown by Mongoose (and sent to next()) if id string does not represent a valid ObjectId.
 * In case of success returns http code 200 with found category. If no category matches with the given Id,
 * 404 is returned.
 * @param req
 * @param res
 * @param next
 */
exports.show = function (req, res, next) {
  Category.findById(req.params.id, function (err, category) {
    if (err) {
      return next(err);
    }
    if (!category) {
      return res.status(404).send('Not Found');
    }
    return res.status(200).json(category);
  });
};

/**
 * Update a category by its Id.
 * CastError is thrown by Mongoose (and sent to next()) if id string does not represent a valid ObjectId.
 * In case of success returns http code 200 with the updated category. If no category matches with the given Id,
 * 404 is returned.
 * @param req
 * @param res
 * @param next
 */
exports.update = function (req, res, next) {
  if (req.body._id) {
    delete req.body._id;
  }
  Category.findById(req.params.id, function (err, category) {
    if (err) {
      return next(err);
    }
    if (!category) {
      return res.status(404).send('Not Found');
    }

    // array properties are replaced with new ones
    var updated = _.merge(category, req.body, function (from, to) {
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
 * Deletes from DB a Category, finding it by its Id.
 * CastError is thrown by Mongoose (and sent to next()) if id string does not represent a valid ObjectId.
 * In case of success returns http code 204. If no category matches with the given Id, 404 is returned.
 * @param req
 * @param res
 * @param next
 */
exports.destroy = function (req, res, next) {
  Category.findById(req.params.id, function (err, category) {
    if (err) {
      return next(err);
    }
    if (!category) {
      return res.status(404).send('Not Found');
    }
    category.remove(function (err) {
      if (err) {
        return next(err);
      }
      return res.status(204).send('No Content');
    });
  });
};
