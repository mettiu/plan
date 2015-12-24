'use strict';

var chai = require('chai');
var expect = chai.expect;
chai.use(require('chai-datetime'));
chai.use(require('chai-interface'));
var faker = require('faker');
var _ = require('lodash');
faker.locale = "it";
var ms = require('ms');
var request = require('supertest');
var app = require('../../app');
var User = require('../user/user.model');
var Ticket = require('./ticket.model');

