'use strict';

var express = require('express');
var controller = require('./category.controller');

var router = express.Router();

router.param('CategoryId', auth.attachCompanyFromParam(Category));

var mdwCategoryAdminArray = [
  auth.getTokenFromQuery,
  auth.jwtMiddleware,
  auth.attachUserToRequest,
  auth.attachCompanyFromBody,
  auth.isAdminForTargetCompany
];

router.post('/',
  mdwCategoryAdminArray,
  controller.create);

router.put('/:CategoryId',
  mdwCategoryAdminArray,
  controller.update);

router.delete('/:CategoryId',
  mdwCategoryAdminArray,
  controller.destroy);

router.get('/',
  mdwCategoryAdminArray,
  controller.index);
//TODO: Qui questa chain di middleware non è adatta: non devo essere amministratore per fare index

//router.post('/issue', controller.issue);
//router.get('/check', controller.check);
//router.post('/passwordChange', controller.passwordChange);

errorMiddleware(router);

module.exports = router;
