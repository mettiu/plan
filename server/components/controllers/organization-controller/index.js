'use strict';

var inherits = require('util').inherits;
var BaseController = require('../base-controller');

function OrganizationController(model) {
  BaseController.call(this, model);

  BaseController.call(this, model);

  OrganizationController.prototype.index = function(req, res, next) {
    req.user.findCompanies(req.options, function(err, companyList) {
      if (err) return next(err);
      if (companyList.length === 0) return res.status(200).json([]);
      model.findByCompanies(companyList, req.options, function(err, foundList) {
        if (err) return next(err);
        return res.status(200).json(foundList);
      });
    });
  };

};

inherits(OrganizationController, BaseController);

module.exports = OrganizationController;
