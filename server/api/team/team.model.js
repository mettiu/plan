'use strict';

var
  mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  timestamps = require('mongoose-timestamp');

var TeamSchema = new Schema({

  name: {
    type: String,
    minlength: 5,
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
  active: {
    type: Boolean,
    default: true
  },
  teamUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }]
});

TeamSchema.plugin(timestamps, {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = mongoose.model('Team', TeamSchema);
