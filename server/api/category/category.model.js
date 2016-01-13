'use strict';

var mongoose   = require('mongoose');
var Schema     = mongoose.Schema;
var Company    = require('../company/company.model');
var timestamps = require('mongoose-timestamp');

var CategorySchema = new Schema({

  name: {
    type: String,
    minlength: 5,
    maxlength: 100,
    required: true,
  },
  description: {
    type: String,
    minlength: 0,
    maxlength: 100,
  },
  _company: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
});

CategorySchema.plugin(timestamps, {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
});

/**
 * Statics
 */
CategorySchema
  .statics = {

    /**
     * Find the array of categories which belong to companiesIdList.
     * Options is an object with those booleans:
     * - onlyActive: (default true) include even non active companies
     * @param companiesIdList {array} companies ids to look for
     * @param options {object} options
     * @param cb {function} to call with (err, resultList) parameters
     */
    findByCompanies: function(companiesIdList, options, cb) {

      //TODO: check if companiesIdList is a valid Array
      var query            = { _company: { $in: companiesIdList } };
      var searchOnlyActive = true;
      if (typeof options.onlyActive === 'boolean' && !options.onlyActive) searchOnlyActive = false;
      if (searchOnlyActive) query.active = true;
      this.find(query, cb);
    },

  };

module.exports = mongoose.model('Category', CategorySchema);
