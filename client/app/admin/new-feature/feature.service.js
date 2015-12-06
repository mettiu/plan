/**
 * Created by matteo on 22/11/2015.
 */
'use strict';

angular.module('planApp')
  .factory('Feature', Feature);

function Feature($resource) {
  var _Feature = $resource('./api/features/:id', {id: '@_id'}, {
      update: {
        method: 'PUT'
      }
    }
  );

  return _Feature;
}
