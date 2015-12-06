/**
 * Created by matteo on 22/11/2015.
 */
'use strict';

angular.module('planApp')
  .factory('User', User);

function User($resource) {
  var _User = $resource('./api/users/:id', {id: '@_id'}, { // /:controller
    changePassword: {
      method: 'PUT',
      params: {
        controller:'password'
      }
    },
    get: {
      method: 'GET',
      params: {
        id:'me'
      }
    },
    update: {
        method: 'PUT'
      }
    }
  );

  return _User;
}
