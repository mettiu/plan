'use strict';

var express = require('express');
var controller = require('./category.controller');

var router = express.Router();

router.param('id', auth.attachCompanyFromParam(Category));

var mdwArray = [
  auth.getTokenFromQuery,
  auth.jwtMiddleware,
  auth.attachUserToRequest,
  auth.attachCompanyFromBody,
  auth.isAdminForTargetCompany
];

router.post('/',
  mdwArray,
  controller.create);

router.put('/:id',
  mdwArray,
  controller.update);

router.delete('/:id',
  mdwArray,
  controller.destroy);

router.get('/',
  mdwArray,
  controller.index);
//TODO: Qui questa chain di middleware non è adatta: non devo essere amministratore per fare index

//router.post('/issue', controller.issue);
//router.get('/check', controller.check);
//router.post('/passwordChange', controller.passwordChange);

errorMiddleware(router);

module.exports = router;
