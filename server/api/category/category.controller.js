'use strict';

var Category = require('./category.model');
var OrganizationController = require('../../components/controllers/organization-controller');

module.exports = new OrganizationController(Category);
