'use strict';

var express = require('express');
var router = express.Router();
var controller = require('./team.controller');
var auth = require('../../auth/auth.service');
var errorMiddleware = require('../../components/error-middleware');

router.param('Id', controller.attachCompanyFromParam);

var mdwAdminArray = [
  auth.getTokenFromQuery,
  auth.jwtMiddleware,
  auth.attachUserToRequest,
  controller.attachCompanyFromBody,
  auth.isAdminForTargetCompany,
];
var mdwUserArray = [
  auth.getTokenFromQuery,
  auth.jwtMiddleware,
  auth.attachUserToRequest,
];

router.post('/', mdwAdminArray, controller.create);

router.delete('/:Id', mdwAdminArray, controller.destroy);

router.put('/:Id', mdwAdminArray, controller.update);

router.get('/', mdwUserArray, controller.optionsMdw, controller.index);

router.get('/:Id', mdwUserArray, auth.isAllowedForTargetCompany, controller.show);

errorMiddleware(router);

module.exports = router;
