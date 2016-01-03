'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var CompanySchema = new Schema({
  name: {
    type: String,
    minlength: 5,
    maxlength: 100,
    required: true
  },
  info: {
    type: String,
    minlength: 0,
    maxlength: 100
  },
  active: {
    type: Boolean,
    default: true
  },
  purchaseUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  teamUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  adminUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }]
});

/**
 * Define a simple virtual 'profile' for company.
 */
CompanySchema
  .virtual('profile')
  .get(function () {
    return {
      '_id': this._id,
      'name': this.name,
      'info': this.info,
      'active': this.active
    };
  });

module.exports = mongoose.model('Company', CompanySchema);
