'use strict';

var
  _ = require('lodash'),
  Team = require('./team.model'),
  errors = require('../../components/errors');


/**
 * Creates new team in DB.
 * In case of success returns http code 201 with the team created.
 * @param req
 * @param res
 * @param next
 */
exports.create = function (req, res, next) {
  Team.create(req.body, function (err, team) {
    if (err) {
      return next(err);
    }
    return res.status(201).json(team);
  });
};

/**
 * List teams. Accepts optional parameter req.body.active <boolean> to match only active
 * or inactive companies.
 * In case of success returns http code 200 with the array of companies found.
 * @param req
 * @param res
 * @param next
 */
exports.index = function (req, res, next) {
  var query = {};
  if (req.body.active !== undefined && typeof(req.body.active) === "boolean") query = {active: req.body.active};
  Team.find(query, function (err, teams) {
    if (err) {
      return next(err);
    }
    return res.status(200).json(teams);
  });
};

/**
 * List active teams, filtering by team name. Team name is got from query 'value' parameter.
 * Every team whose name starts with 'value' id found.
 * In case of success returns http code 200 with the array of teams found.
 * @param req
 * @param res
 * @param next
 */
exports.find = function (req, res, next) {
  Team.find({'name': new RegExp('^' + req.query.value, 'i'), active: true}, '_id name', function (err, teams) {
    if (err) {
      return next(err);
    }
    return res.status(200).json(teams);
  });
};

/**
 * Get details for one team, finding by Id.
 * CastError is thrown by Mongoose (and sent to next()) if id string does not represent a valid ObjectId.
 * In case of success returns http code 200 with found team. If no team matches with the given Id,
 * 404 is returned.
 * @param req
 * @param res
 * @param next
 */
exports.show = function (req, res, next) {
  Team.findById(req.params.id, function (err, team) {
    if (err) {
      return next(err);
    }
    if (!team) {
      return res.status(404).send('Not Found');
    }
    return res.status(200).json(team);
  });
};

/**
 * Update a team by its Id.
 * CastError is thrown by Mongoose (and sent to next()) if id string does not represent a valid ObjectId.
 * In case of success returns http code 200 with the updated team. If no team matches with the given Id,
 * 404 is returned.
 * @param req
 * @param res
 * @param next
 */
exports.update = function (req, res, next) {
  if (req.body._id) {
    delete req.body._id;
  }
  Team.findById(req.params.id, function (err, team) {
    if (err) {
      return next(err);
    }
    if (!team) {
      return res.status(404).send('Not Found');
    }

    // array properties are replaced with new ones
    var updated = _.merge(team, req.body, function (from, to) {
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
 * Deletes from DB a Team, finding it by its Id.
 * CastError is thrown by Mongoose (and sent to next()) if id string does not represent a valid ObjectId.
 * In case of success returns http code 204. If no team matches with the given Id, 404 is returned.
 * @param req
 * @param res
 * @param next
 */
exports.destroy = function (req, res, next) {
  Team.findById(req.params.id, function (err, team) {
    if (err) {
      return next(err);
    }
    if (!team) {
      return res.status(404).send('Not Found');
    }
    team.remove(function (err) {
      if (err) {
        return next(err);
      }
      return res.status(204).send('No Content');
    });
  });
};
