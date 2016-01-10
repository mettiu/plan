'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamp');

var schema = new Schema({
  originalFileName: {
    type: String,
    maxlength: 1024,
    required: true
  },
  mime: {
    type: String,
    maxlength: 256
  },
  size: {
    type: Number,
    max: 10 * 1000 * 1000 // 10 MiB
  },
  serverFilePath: {
    type: String,
    maxlength: 2048,
    required: true
  }
});

schema.plugin(timestamps, {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = schema;
