'use strict';

// Development specific configuration
// ==================================
module.exports = {
  // MongoDB connection options
  mongo: {
    //uri: 'mongodb://localhost/plan-dev'
    uri: 'mongodb://plan_user:plan_secret@192.168.2.13/plan'

  },

  seedDB: false //true
};
