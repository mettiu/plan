'use strict';

var express = require('express'),
  controller = require('./category.controller'),
  Category = require('./category.model'),
  auth = require('../../auth/auth.service'),
  errorMiddleware = require('../../components/error-middleware');

var router = express.Router();

router.param('CategoryId', auth.attachCompanyFromParam(Category));

var mdwCategoryAdminArray = [
  auth.getTokenFromQuery,
  auth.jwtMiddleware,
  auth.attachUserToRequest,
  auth.attachCompanyFromBody,
  auth.isAdminForTargetCompany
];

var mdwUserArray = [
  auth.getTokenFromQuery,
  auth.jwtMiddleware,
  auth.attachUserToRequest
];

router.post('/',
  mdwCategoryAdminArray,
  controller.create);

router.delete('/:CategoryId',
  mdwCategoryAdminArray,
  controller.destroy);

router.put('/:CategoryId',
  mdwCategoryAdminArray,
  controller.update);

router.get('/',
  mdwUserArray,
  controller.optionsMdw,
  controller.index);
//TODO: index dovrebbe restituire solo le category delle mie company

//router.post('/issue', controller.issue);
//router.get('/check', controller.check);
//router.post('/passwordChange', controller.passwordChange);

errorMiddleware(router);

module.exports = router;
