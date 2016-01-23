'use strict';

var inherits = require('util').inherits;
var conditional = require('express-conditional-middleware');
var async = require('async');
var BaseController = require('../base-controller');
var Category = require('../../../api/category/category.model');
var Company = require('../../../api/company/company.model');

function TicketController(model) {
  BaseController.call(this, model);

  /**
   * List elements belonging to companies user has access to (as a purchaseUser,
   * as a TeamUser or as an adminUser).
   * Accepts optional parameter req.query.onlyActive <boolean> to match only active
   * or inactive companies.
   * In case of success returns http code 200 with the array of elements found.
   * @param req
   * @param res
   * @param next
   */
  TicketController.prototype.index = function(req, res, next) {

    async.waterfall([
      findCompaniesByUser,
      findCategoriesByCompanies,
      findTicketsByCategories,
    ], function(err, foundList) {
      if (err) return next(err);
      return res.status(200).json(foundList);
    });
    function findCompaniesByUser(callback) {
      req.user.findCompanies(req.options,callback);
    }
    function findCategoriesByCompanies(companyList, callback) {
      Category.findByCompanies(companyList, req.options, callback);
    }
    function findTicketsByCategories(categoryList, callback) {
      model.findByCategories(categoryList, callback);
    }
  };

  /**
   * Attaches the company to req.
   * Returns a function to user in router.param for those
   * routes that accept model Id (Category or Test) as a param.
   * The param function sets the company corresponding to
   * _company for the model into a 'company' field in req.
   * @param model
   * @returns {Function} to be used in router.param call
   */
  TicketController.prototype.attachCompanyFromParam = function(req, res, next, param) {

    async.waterfall([
      findModelByIdAndPopulateCategory,
      findCompanyById,
    ], function(err, result) {
      if (err) return next(err);
      req.company = result;
      next();
    });
    function findModelByIdAndPopulateCategory(callback) {
      model
        .findById(param)
        .populate('_category')
        .exec(callback);
    };
    function findCompanyById(foundCategory, callback) {
      if (!foundCategory) return res.status(400).send("Bad Request");
      Company.findById(foundCategory._category._company, callback);
    };
  };

  /**
   * Attaches company data to req.
   * When an API related to something which has a _company (id) field
   * is called (i.e.: category or Team) you may want to extract the company
   * data, in order to allow further checks based on company data.
   * For example, you may want to check is the user requesting the
   * operation is an administrator for the category he is trying to
   * operate on (i.e.: creation, update, ecc.).
   * If company data is already present in req.body this middleware is skipped.
   * This middleware just expands company data from the req body _company field,
   * setting req.company with the data retrieved from DB.
   * Http 400 code is returned if:
   * - no _company field found;
   * - no company with the required _id found.
   * Any errors returned by Mongoose should be managed by following middlewares
   * (i.e.: CastError on _id).
   * @param req
   * @param res
   * @param next
   */
  TicketController.prototype.attachCompanyFromBody = function() {

    // if parameter req.company is not already present,
    // then middleware is returned and tries to set company from body request
    return conditional(
      function (req, res, next) {
        return !!req.body && !req.company;
      },
      function (req, res, next) {
        if (!req.body._category) return res.status(400).send("Bad Request");

        Category
          .findById(req.body._category)
          .populate('_company')
          .exec(function(err, foundCategory) {
            if (err) return next(err);
            req.company = foundCategory._company;
            next();
          });
      }
    );
  }();
};

inherits(TicketController, BaseController);

module.exports = TicketController;
