'use strict';

angular.module('planApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('frame.main', {
        url: '/',
        views: {
          "main-content": {
            templateUrl: 'app/main/main.html',
            controller: 'MainCtrl',
            controllerAs: 'MainCtrl',
            authenticate: true,
            resolve: MainResolver
          }
        }
      });
  });
