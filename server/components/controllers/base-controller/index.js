'use strict';

var _ = require('lodash');

/**
 * Abstracts Category and Team main models.
 * @param {(Category|Team)} model
 * @constructor
 */
function BaseController(model) {

  // Check if received 'model' is Category or Team
  if (['Category', 'Team', 'Ticket'].indexOf(model.modelName) === -1)
    throw Error('BaseController should receive a valid Category, Team or Ticket Mongoose Model!');

  var m = model;

  /**
   * Retrieves the model passed to the constructor of this object.
   * @returns {Category|Team}
   */
  BaseController.prototype.getModel = function() {
    return m;
  };

  /**
   * Creates new element in DB.
   * In case of success returns http code 201 with the element created.
   * @param req
   * @param res
   * @param next
   */
  BaseController.prototype.create = function(req, res, next) {
    m.create(req.body, function(err, created) {
      if (err) {
        return next(err);
      }

      return res.status(201).json(created);
    });
  };

  /**
   * Get details for one element, finding by Id.
   * CastError is thrown by Mongoose (and sent to next()) if id string does not represent a valid ObjectId.
   * In case of success returns http code 200 with found element. If no element matches with the given Id,
   * 404 is returned.
   * @param req
   * @param res
   * @param next
   */
  BaseController.prototype.show = function(req, res, next) {
    m.findById(req.params.Id, function(err, found) {
      if (err) {
        return next(err);
      }

      if (!found) {
        return res.status(404).send('Not Found');
      }

      return res.status(200).json(found);
    });
  };

  /**
   * Update an element by its Id.
   * CastError is thrown by Mongoose (and sent to next()) if id string does not represent a valid ObjectId.
   * In case of success returns http code 200 with the updated element. If no element matches with the given Id,
   * 404 is returned.
   * @param req
   * @param res
   * @param next
   */
  BaseController.prototype.update = function(req, res, next) {
    if (req.body._id) {
      delete req.body._id;
    }

    m.findById(req.params.Id, function(err, found) {
      if (err) {
        return next(err);
      }

      if (!found) {
        return res.status(404).send('Not Found');
      }

      var updated = _.merge(found, req.body);

      updated.save(function(err) {
        if (err) {
          return next(err);
        }

        return res.status(200).json(updated);
      });
    });
  };

  /**
   * Deletes an element from DB, finding it by its Id.
   * CastError is thrown by Mongoose (and sent to next()) if id string does not represent a valid ObjectId.
   * In case of success returns http code 204. If no element matches with the given Id, 404 is returned.
   * @param req
   * @param res
   * @param next
   */
  BaseController.prototype.destroy = function(req, res, next) {
    m.findById(req.params.Id, function(err, found) {
      if (err) {
        return next(err);
      }

      if (!found) {
        return res.status(404).send('Not Found');
      }

      found.remove(function(err) {
        if (err) {
          return next(err);
        }

        return res.status(204).send('No Content');
      });
    });
  };

  /**
   * Gets some options parameters from querystring and brings to a
   * req.options object.
   * Options is an object with those booleans:
   * - admin: (default true) look into company's adminUsers array
   * - team: (default true) look into company's teamUsers array
   * - purchase: (default true) look into company's purchaseUsers array
   * - onlyActive: (default true) include even non active companies
   * @param req
   * @param res
   * @param next
   */
  BaseController.prototype.optionsMdw = function(req, res, next) {
    var options = {};

    options.onlyActive = !(req.query.onlyActive === 'false');
    options.team = !(req.query.team === 'false');
    options.purchase = !(req.query.purchase === 'false');
    options.admin = !(req.query.admin === 'false');

    req.options = options;
    next();
  };

};

module.exports = BaseController;
