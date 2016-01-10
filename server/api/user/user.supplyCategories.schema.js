'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamp');

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

// this is an object containing a company and an array of all the categories allowed for the user in that company

var schema = new Schema({
  _company: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  categories: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    }
  ]
});

schema.pre('save', function (next) {
  return next(new Error('#sadpanda'));
  next();
});

/**
 * Methods
 */
schema.methods = {

  addCategoryForCompany: function (_category, _company) {
    console.log("Esatto");
    return true;

    //return this.encryptPassword(plainText) === this.hashedPassword;
  }
};


schema.plugin(timestamps, {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

exports = schema;
