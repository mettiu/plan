/**
 * Created by matteo on 22/11/2015.
 */
'use strict';

angular.module('planApp')
  .factory('Company', Company);

function Company($resource) {
  var _Company = $resource('./api/companies/:id', {id: '@_id'}, {
      update: {
        method: 'PUT'
      }
    }
  );

  return _Company;
}
