'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamp');
var fileSchema = require('./ticket.file.schema');
var eventSchema = require('./ticket.event.schema');

var TicketSchema = new Schema({
  title: {
    type: String,
    minlength: 10,
    maxlength: 200,
    required: true
  },
  description: {
    type: String,
    maxlength: 5000
  },
  _author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  _lockingAgent:{
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  _company: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  _category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  attachemnts: [fileSchema],
  _queue: {
    type: Schema.Types.ObjectId,
    ref: 'Queue',
    required: true
  },
  state: {
    type: String,
    enum: 'draft requested closed'.split(' '),
    required: true
  },
  history: [eventSchema]
});

TicketSchema.plugin(timestamps, {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});


// TODO: validation rule for user's company === ticket company


module.exports = mongoose.model('Ticket', TicketSchema);
