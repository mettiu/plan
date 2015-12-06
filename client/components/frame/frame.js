/**
 * Created by matteo on 21/11/2015.
 */
'use strict';

angular.module('planApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('frame', {
        views: {
          "": {
            templateUrl: 'components/frame/frame.html',
          },
          "navbar@": {
            controller: 'NavbarCtrl',
            controllerAs: 'NavbarCtrl',
            templateUrl: 'components/navbar/navbar.html'
          }
        }
      });
  });
