'use strict';

var express = require('express');
var router = express.Router();
var controller = require('./ticket.controller');
var auth = require('../../auth/auth.service');
var errorMiddleware = require('../../components/error-middleware');

router.param('Id', controller.attachCompanyFromParam);

var mdwUserArray = [
  auth.getTokenFromQuery,
  auth.jwtMiddleware,
  auth.attachUserToRequest,
];

router.post('/', mdwUserArray, controller.attachCompanyFromBody, auth.isAllowedForTargetCompany, controller.create);

router.delete('/:Id', mdwUserArray, auth.isAllowedForTargetCompany, controller.destroy);

router.put('/:Id', mdwUserArray, auth.isAllowedForTargetCompany, controller.update);

router.get('/', mdwUserArray, controller.optionsMdw, controller.index);

router.get('/:Id', mdwUserArray, auth.isAllowedForTargetCompany, controller.show);

errorMiddleware(router);

module.exports = router;
