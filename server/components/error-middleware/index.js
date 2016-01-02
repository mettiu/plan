/**
 * Error middleware
 */

'use strict';

/**
 * Catches the Mongoose Validation Errors and sends 403 (Forbidden) http response to the client.
 * Json representation of error is also sent to the client.
 * @param err
 * @param req
 * @param res
 * @param next
 */
exports.validationError = function(err, req, res, next) {
  if (err.name !== 'ValidationError') return next(err);
  //TODO: check if something less than the whole error should be sent to client
  return res.status(403).json(err);
};

/**
 * Catches any before untrapped error and sends an http 500 (Internale Serve Error) to the client.
 * Json representation of error is NOT sent to the client.
 * Express server is crashed immediately returning -500 to the operating system
 * @param err
 * @param req
 * @param res
 * @param next
 */
exports.fatalError = function(err, req, res) {
  console.error("Fatal error!", err.stack);
  process.exit(-500);
  res.status(500).send('Internal Server Error');
};

