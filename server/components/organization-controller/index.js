'use strict';

var _ = require('lodash');
var mongoose   = require('mongoose');
var Category = require('../../api/category/category.model');

/**
 * Abstracts Category and Team main models.
 * @param {(Category|Team)} model
 * @constructor
 */
var OrganizationController = function(model) {

  // Check if received 'model' is Category or Team
  if (['Category', 'Team'].indexOf(model.modelName) === -1)
    throw Error('OrganizationController should receive a valid Mongoose Model!');

  var m = model;

  OrganizationController.prototype.getModel = function() {
    return m;
  };

  OrganizationController.prototype.create = function(req, res, next) {
    m.create(req.body, function(err, created) {
      if (err) {
        return next(err);
      }

      return res.status(201).json(created);
    });
  };

  OrganizationController.prototype.index = function(req, res, next) {
    req.user.findCompanies(req.options, function(err, companyList) {
      if (err) return next(err);
      if (companyList.length === 0) return res.status(200).json([]);
      m.findByCompanies(companyList, req.options, function(err, foundList) {
        if (err) return next(err);
        return res.status(200).json(foundList);
      });
    });
  };

  OrganizationController.prototype.show = function(req, res, next) {
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

  OrganizationController.prototype.update = function(req, res, next) {
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

      // array properties are replaced with new ones
      var updated = _.merge(found, req.body, function(from, to) {
        if (_.isArray(from)) {
          return to;
        }
      });

      updated.save(function(err) {
        if (err) {
          return next(err);
        }

        return res.status(200).json(updated);
      });
    });
  };

  OrganizationController.prototype.destroy = function(req, res, next) {
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

  OrganizationController.prototype.optionsMdw = function(req, res, next) {
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

module.exports = OrganizationController;
