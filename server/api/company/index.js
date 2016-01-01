'use strict';

var express = require('express');
var controller = require('./company.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/',
  auth.isAuthenticated(), // check if user is authenticate and set user in req
  auth.isPlatformAdmin, // check if user is allowed to create companies
  // check received JSON message is compliat to schema for this method
  controller.create // create the company
);


// default routes for Company
router.get('/', controller.index);
router.get('/find', controller.find); // per la ricerca per nome
router.get('/:id', controller.show);
//router.post('/', auth.isAuthenticated(), controller.create);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);



module.exports = router;
