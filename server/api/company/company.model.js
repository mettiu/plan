'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var CompanySchema = new Schema({
  name: String,
  info: String,
  active: Boolean
});


/**
 * Statics
 */
CompanySchema
  .statics = {

  createNew: function (model, callback) {
    (new this(model)).save(callback);
  }

};


module.exports = mongoose.model('Company', CompanySchema);
