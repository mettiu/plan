'use strict';

var inherits = require('util').inherits;
var conditional = require('express-conditional-middleware');
var BaseController = require('../base-controller');
var Company = require('../../../api/company/company.model');

function OrganizationController(model) {
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

  /**
   * Attaches the company to req.
   * Returns a function to user in router.param for those
   * routes that accept model Id (Category or Test) as a param.
   * The param function sets the company corresponding to
   * _company for the model into a 'company' field in req.
   * @param model
   * @returns {Function} to be used in router.param call
   */
  OrganizationController.prototype.attachCompanyFromParam = function(req, res, next, param) {
    // TODO: this function gats called before user auth validation. Check user before sending any info, including a 404 if id is 'fake id'!
    // with a unexistant objectId id, !found is fired;
    // with a string id, we get a Mongoose CastError, which becones a 404

    //// if mandatory model parameter is not set returns a middleware that crashes!
    //if (!model) return function (res, req, next) {
    //  return next(new Error("Missing model from function call!"))
    //};
    //return function (req, res, next, param) {
      model
        .findById(param)
        .populate('_company')
        .exec(function (err, found) {
          if (err) return next(err);
          if (!found) return res.status(400).send("Bad Request");
          req.company = found._company;
          next();
        });
    //}
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
  OrganizationController.prototype.attachCompanyFromBody = function() {

    // if parameter req.company is not already present,
    // then middleware is returned and tries to set company from body request
    return conditional(
      function (req, res, next) {
        return !!req.body && !req.company;
      },
      function (req, res, next) {
        if (!req.body._company) return res.status(400).send("Bad Request");
        Company.findById(req.body._company, function (err, company) {
          if (err) return next(err);
          if (!company) return res.status(400).send("Bad Request");
          req.company = company;
          next();
        })
      }
    );
  }();

};

inherits(OrganizationController, BaseController);

module.exports = OrganizationController;
