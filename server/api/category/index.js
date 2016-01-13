'use strict';

var express = require('express');
var controller = require('./category.controller');
var Category = require('./category.model');
var auth = require('../../auth/auth.service');
var errorMiddleware = require('../../components/error-middleware');

var router = express.Router();

router.param('Id', auth.attachCompanyFromParam(Category));

var mdwCategoryAdminArray = [
    auth.getTokenFromQuery,
    auth.jwtMiddleware,
    auth.attachUserToRequest,
    auth.attachCompanyFromBody,
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
