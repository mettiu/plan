'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
var allowsSchema = require('./allows.schema');

var actions = 'view edit admin'.split(' ');

var QueueSchema = new Schema({

  title: {
    type: String,
    minlength:  [5, 'The value of path `{PATH}` (`{VALUE}`) is shorter than the minimum allowed length ({MINLENGTH}).'],
    maxlength: [50, 'The value of path `{PATH}` (`{VALUE}`) is longer than the maximum allowed length ({MAXLENGTH}).'],
    required: '{PATH} is required!'
  },
  description: {
    type: String,
    maxlength: 5000
  },
  _company: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: 'is required!'
  },
  allows: [allowsSchema]
  //membership: {
  //  TODO: trovare un modo intelligente per definire gruppi/ruoli/accessi
  //}

});


/**
 * Statics
 */
QueueSchema
  .statics = {

  createNew: function (model, callback) {
    var newQueue = new this(model);

    newQueue.save(callback);
  },

  getQueuesForUser: function (userId) {

  }

};


// TODO: lista code per un utente
// TODO: Lista ticket di una coda
// TODO: modifica coda


module.exports = mongoose.model('Queue', QueueSchema);
