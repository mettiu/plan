'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamp');

var CategorySchema = new Schema({

  name: {
    type: String,
    //minlength:  [5, 'The value of path `{PATH}` (`{VALUE}`) is shorter than the minimum allowed length ({MINLENGTH}).'],
    //maxlength: [50, 'The value of path `{PATH}` (`{VALUE}`) is longer than the maximum allowed length ({MAXLENGTH}).'],
    //required: '{PATH} is required!'
  },
  description: {
    type: String,
    //maxlength: 5000
  },
  _company: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    //required: 'is required!'
  }
});

CategorySchema.plugin(timestamps, {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});


/**
 * Statics
 */
CategorySchema
  .statics = {

  createNew: function (model, callback) {
    (new this(model)).save(callback);
  }

};




module.exports = mongoose.model('Category', CategorySchema);
