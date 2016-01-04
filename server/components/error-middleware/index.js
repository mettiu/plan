/**
 * Error middleware
 */

'use strict';

module.exports = function (app) {

  app.use(
    unauthorizedError,
    validationError,
    castError,
    fatalError
  );

  /**
   * Catches the Unauthorized error, coming from JWT check middleware.
   * @param err
   * @param req
   * @param res
   * @param next
   */
  function unauthorizedError(err, req, res, next) {
    if (err.name !== 'UnauthorizedError') return next(err);
    //TODO: check if something less than the whole error should be sent to client
    return res.status(401).json(err);
  }

  /**
   * Catches the Mongoose Validation Errors and sends 422 (Unprocessable Entity) http response to the client.
   * Json representation of error is also sent to the client.
   * @param err
   * @param req
   * @param res
   * @param next
   */
  function validationError(err, req, res, next) {
    if (err.name !== 'ValidationError') return next(err);
    //TODO: check if something less than the whole error should be sent to client
    return res.status(422).json(err);
  }

  /**
   * Catches the Mongoose Cast Errors and sends 404 (Not Found) http response to the client.
   * Json representation of error is NOT sent to the client.
   * @param err
   * @param req
   * @param res
   * @param next
   */
  function castError(err, req, res, next) {
    if (err.name !== 'CastError') return next(err);
    //TODO: check if something less than the whole error should be sent to client
    return res.status(404).send("Not Found");
  }

  /**
   * Catches any before untrapped error and sends an http 500 (Internale Serve Error) to the client.
   * Json representation of error is NOT sent to the client.
   * Express server is crashed immediately returning -500 to the operating system
   * @param err
   * @param req
   * @param res
   */
  function fatalError(err, req, res, next) {
    console.error("Fatal error!", err, err.stack);
    process.exit(-500);
    res.status(505).send('Internal Server Error');
  }

};
