/**
 * CORS middleware
 */

'use strict';

module.exports = function (app) {

  app.use(allowCrossDomain);

  function allowCrossDomain(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    //res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
  }

};
