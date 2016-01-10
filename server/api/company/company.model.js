'use strict';

// develop comment

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamp');

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

CompanySchema.plugin(timestamps, {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

/**
 * Statics
 */
CompanySchema
  .statics = {

  /**
   * Find the array of companies _user can access to.
   * Options is an object with those booleans:
   * - admin: (default true) look into company's adminUsers array
   * - team: (default true) look into company's teamUsers array
   * - purchase: (default true) look into company's purchaseUsers array
   * - onlyActive: (default true) include even non active companies
   * @param _user {object} user id to look for
   * @param options {object} options
   * @param cb {function} to call with (err, resultList) parameters
   */
  findByUser: function (_user, options, cb) {
    var defaultOptions = {
      admin: true,
      team: true,
      purchase: true,
      onlyActive: null
    };

    if (!options) options = defaultOptions;
    if(!options.admin && !options.team && !options.purchase)
      return cb(null, []);
    if (options.admin) options.admin = !!options.admin;
    if (options.team) options.team = !!options.team;
    if (options.purcase) options.purcase = !!options.purcase;

    var query = { $or: [] };
    if (options.admin) query.$or.push({'adminUsers': _user});
    if (options.team) query.$or.push({'teamUsers': _user});
    if (options.purchase) query.$or.push({'purchaseUsers': _user});

    var searchOnlyActive = true;
    if (typeof options.onlyActive === 'boolean' && !options.onlyActive) searchOnlyActive = false;
    if (searchOnlyActive) query.active = true;
    this.find(query, cb);
  }
};

module.exports = mongoose.model('Company', CompanySchema);
