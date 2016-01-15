'use strict';

var Ticket = require('./ticket.model');
var OrganizationController = require('../../components/organization-controller');
var orgController = new OrganizationController(Ticket);

// TODO: list tickets
// TODO: lock a ticket
// TODO: unLock a ticket
// TODO: create a new ticket
// TODO: add attachment to ticket
// TODO: delete attachment from ticket
// TODO: add article to ticket
// TODO: change queue to ticket
// TODO: change state to ticket


/**
 * Creates new ticket in DB.
 * In case of success returns http code 201 with the ticket created.
 * @param req
 * @param res
 * @param next
 */
exports.create = orgController.create;

/**
 * List tickets belonging to companies user has access to (as a purchaseUser,
 * as a TeamUser or as an adminUser).
 * Accepts optional parameter req.query.onlyActive <boolean> to match only active
 * or inactive companies.
 * In case of success returns http code 200 with the array of categories found.
 * @param req
 * @param res
 * @param next
 */
exports.index = orgController.index;

/**
 * Get details for one category, finding by Id.
 * CastError is thrown by Mongoose (and sent to next()) if id string does not represent a valid ObjectId.
 * In case of success returns http code 200 with found category. If no category matches with the given Id,
 * 404 is returned.
 * @param req
 * @param res
 * @param next
 */
exports.show = orgController.show;

/**
 * Update a category by its Id.
 * CastError is thrown by Mongoose (and sent to next()) if id string does not represent a valid ObjectId.
 * In case of success returns http code 200 with the updated category. If no category matches with the given Id,
 * 404 is returned.
 * @param req
 * @param res
 * @param next
 */
exports.update = orgController.update;

/**
 * Deletes from DB a Category, finding it by its Id.
 * CastError is thrown by Mongoose (and sent to next()) if id string does not represent a valid ObjectId.
 * In case of success returns http code 204. If no category matches with the given Id, 404 is returned.
 * @param req
 * @param res
 * @param next
 */
exports.destroy = orgController.destroy;

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
exports.optionsMdw = orgController.optionsMdw;
