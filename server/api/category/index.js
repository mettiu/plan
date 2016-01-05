'use strict';

var express = require('express');
var controller = require('./category.controller');

var router = express.Router();

router.post('/',
  auth.getTokenFromQuery,
  auth.jwtMiddleware,
  auth.attachUserToRequest,
  auth.attachTargetCompanyToRequest,
  auth.isAdminForTargetCompany,
  controller.create);

router.put('/:id',
  auth.getTokenFromQuery,
  auth.jwtMiddleware,
  auth.attachUserToRequest,
  auth.attachTargetCompanyToRequest,
  auth.isAdminForTargetCompany,
  controller.update);

router.delete('/:id',
  auth.getTokenFromQuery,
  auth.jwtMiddleware,
  auth.attachUserToRequest,
  auth.attachTargetCompanyToRequest,
  auth.isAdminForTargetCompany,
  controller.destroy);

router.get('/',
  auth.getTokenFromQuery,
  auth.jwtMiddleware,
  auth.attachUserToRequest,
  auth.attachTargetCompanyToRequest,
  auth.isAdminForTargetCompany,
  controller.index);

//router.post('/issue', controller.issue);
//router.get('/check', controller.check);
//router.post('/passwordChange', controller.passwordChange);

module.exports = router;
