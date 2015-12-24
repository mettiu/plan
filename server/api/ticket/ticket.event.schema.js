'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamp');

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var schema = new Schema({
  name: {
    type: String,
    enum: 'creation edit xxx'.split(' '), //TODO: define event types
    required: true
  },
  _author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    maxlength: 500,
    required: true
  }
});

schema.plugin(timestamps, {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

exports = schema;
