'use strict';

var Team = require('./team.model');
var OrganizationController = require('../../components/controllers/organization-controller');

module.exports = new OrganizationController(Team);


//
//
//'use strict';
//
//var Team = require('./team.model');
//var Controller = require('../../components/controllers/organization-controller');
//var controller = new Controller(Team);
//
///**
// * Creates new team in DB.
// * In case of success returns http code 201 with the team created.
// * @param req
// * @param res
// * @param next
// */
//exports.create = controller.create;
//
///**
// * List teams belonging to companies user has access to (as a purchaseUser,
// * as a TeamUser or as an adminUser).
// * Accepts optional parameter req.query.onlyActive <boolean> to match only active
// * or inactive companies.
// * In case of success returns http code 200 with the array of teams found.
// * @param req
// * @param res
// * @param next
// */
//exports.index = controller.index;
//
///**
// * Get details for one team, finding by Id.
// * CastError is thrown by Mongoose (and sent to next()) if id string does not represent a valid ObjectId.
// * In case of success returns http code 200 with found team. If no team matches with the given Id,
// * 404 is returned.
// * @param req
// * @param res
// * @param next
// */
//exports.show = controller.show;
//
///**
// * Update a team by its Id.
// * CastError is thrown by Mongoose (and sent to next()) if id string does not represent a valid ObjectId.
// * In case of success returns http code 200 with the updated team. If no team matches with the given Id,
// * 404 is returned.
// * @param req
// * @param res
// * @param next
// */
//exports.update = controller.update;
//
///**
// * Deletes from DB a Team, finding it by its Id.
// * CastError is thrown by Mongoose (and sent to next()) if id string does not represent a valid ObjectId.
// * In case of success returns http code 204. If no team matches with the given Id, 404 is returned.
// * @param req
// * @param res
// * @param next
// */
//exports.destroy = controller.destroy;
//
///**
// * Gets some options parameters from querystring and brings to a
// * req.options object.
// * Options is an object with those booleans:
// * - admin: (default true) look into company's adminUsers array
// * - team: (default true) look into company's teamUsers array
// * - purchase: (default true) look into company's purchaseUsers array
// * - onlyActive: (default true) include even non active companies
// * @param req
// * @param res
// * @param next
// */
//exports.optionsMdw = controller.optionsMdw;
