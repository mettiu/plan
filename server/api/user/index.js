'use strict';

var express = require('express');
var controller = require('./user.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');
var config = require('../../config/environment');

var jwt = require('express-jwt');
var jwtCheck = jwt({secret: config.secrets.session});

var router = express.Router();

router.get('/', auth.hasRole('admin'), controller.index);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);
router.get('/me', auth.isAuthenticated(), controller.me);
//router.put('/me', controller.updateMe);  // api for edit user own profile
router.put('/:id/password', auth.isAuthenticated(), controller.changePassword);
router.put('/:id', auth.hasRole('admin'), controller.update);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/', controller.create);

//router.post('/setSupplyCategories',
//  auth.isAuthenticated(), //...
//  //auth.syntaxCheck(), // check if json message is compliant to schema given for this transaction
//  auth.isAdminForCompany, // check if user is allowed to admin the addressed company
//  auth.isAddressedUserEnabledForAddressedCompany, // check if addressedUser is enabled for the addressedCompany
//  controller.setSupplyCategory // finally, remove all company/category pair (only for that company!!) from user and insert new pairs
//);
//
//router.post('/setTeams',
//  auth.isAuthenticated(), //...
//  //auth.syntaxCheck(), // check if json message is compliant to schema given for this transaction
//  auth.isAdminForCompany, // check if user is allowed to admin the addressed company
//  auth.isAddressedUserEnabledForAddressedCompany, // check if addressedUser is enabled for the addressedCompany
//  controller.setTeam // finally, remove all company/category pair (only for that company!!) from user and insert new pairs
//);

module.exports = router;
