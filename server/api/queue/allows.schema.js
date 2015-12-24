'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamp');

var schema = new Schema({
  action:{
    type: String,
    minlength:  [5, 'The value of path `{PATH}` (`{VALUE}`) is shorter than the minimum allowed length ({MINLENGTH}).'],
    maxlength: [200, 'The value of path `{PATH}` (`{VALUE}`) is longer than the maximum allowed length ({MAXLENGTH}).'],
    required: true
  },
  requiredRole: {
    type: String,
    minlength:  [5, 'The value of path `{PATH}` (`{VALUE}`) is shorter than the minimum allowed length ({MINLENGTH}).'],
    maxlength: [200, 'The value of path `{PATH}` (`{VALUE}`) is longer than the maximum allowed length ({MAXLENGTH}).'],
    required: true
  },

});

schema.plugin(timestamps, {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = schema;
