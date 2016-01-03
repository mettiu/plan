'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamp');

var CategorySchema = new Schema({

  name: {
    type: String,
    minlength:  5,
    maxlength: 100,
    required: true
  },
  description: {
    type: String,
    minlength: 0,
    maxlength: 100
  },
  _company: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  purchaseUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
});

CategorySchema.plugin(timestamps, {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = mongoose.model('Category', CategorySchema);
