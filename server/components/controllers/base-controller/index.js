'use strict';

var _ = require('lodash');

/**
 * Abstracts Category and Team main models.
 * @param {(Category|Team)} model
 * @constructor
 */
var BaseController = function(model) {

  // Check if received 'model' is Category or Team
  if (['Category', 'Team', 'Ticket'].indexOf(model.modelName) === -1)
    throw Error('BaseController should receive a valid Mongoose Model!');

  var m = model;

  BaseController.prototype.getModel = function() {
    return m;
  };

  BaseController.prototype.create = function(req, res, next) {
    m.create(req.body, function(err, created) {
      if (err) {
        return next(err);
      }

      return res.status(201).json(created);
    });
  };

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

  BaseController.prototype.optionsMdw = function(req, res, next) {
    var options = {};
    req.query.onlyActive === 'true' ? options.onlyActive = true : options.onlyActive = false;

    options.onlyActive = !(req.query.onlyActive === 'false');
    options.team = !(req.query.team === 'false');
    options.purchase = !(req.query.purchase === 'false');
    options.admin = !(req.query.admin === 'false');

    req.options = options;
    next();
  };

};

module.exports = BaseController;
