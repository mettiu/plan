'use strict';

var express = require('express');
var router = express.Router();
var controller = require('./category.controller');
var auth = require('../../auth/auth.service');
var errorMiddleware = require('../../components/error-middleware');

router.param('Id', controller.attachCompanyFromParam);

var mdwCategoryAdminArray = [
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

router.post('/', mdwCategoryAdminArray, controller.create);

router.delete('/:Id', mdwCategoryAdminArray, controller.destroy);

router.put('/:Id', mdwCategoryAdminArray, controller.update);

router.get('/', mdwUserArray, controller.optionsMdw, controller.index);

router.get('/:Id', mdwUserArray, auth.isAllowedForTargetCompany, controller.show);

errorMiddleware(router);

module.exports = router;
