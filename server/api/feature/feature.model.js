'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var FeatureSchema = new Schema({
  tId: String,
  name: String,
  info: String,
  url: String,
  allowedRole: String,
  active: Boolean
});

module.exports = mongoose.model('Feature', FeatureSchema);
