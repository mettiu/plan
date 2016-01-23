'use strict';

var Ticket = require('./ticket.model');
var TicketController = require('../../components/controllers/ticket-controller');

module.exports = new TicketController(Ticket);
