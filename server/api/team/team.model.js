'use strict';

var  mongoose = require('mongoose');
var  Schema = mongoose.Schema;
var  timestamps = require('mongoose-timestamp');

var TeamSchema = new Schema({

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

TeamSchema.plugin(timestamps, {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
});

/**
 * Statics
 */
TeamSchema
  .statics = {

    /**
     * Find the array of teams which belong to companiesIdList.
     * Options is an object with those booleans:
     * - onlyActive: (default true) include even non active teams
     * @param companiesIdList {array} companies ids to look for (accepts also
     * one only individual item)
     * @param options {object} options
     * @param cb {function} to call with (err, resultList) parameters
     */
    findByCompanies: function(companiesIdList, options, cb) {
    var elements = [].concat(companiesIdList);
    var query = { _company: { $in: elements } };
    var searchOnlyActive = true;
    if (typeof options.onlyActive === 'boolean' && !options.onlyActive) searchOnlyActive = false;
    if (searchOnlyActive) query.active = true;
    this.find(query, cb);
  },

  };

module.exports = mongoose.model('Team', TeamSchema);
