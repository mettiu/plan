'use strict';

angular.module('planApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('main', {
        parent: 'master-app-layout-frame',
        url: '/',
        authenticate: true,
        views: {
          'main-content@master-app-layout': {
            templateUrl: 'app/main/main.html',
            controller: 'MainCtrl',
            controllerAs: 'MainCtrl',
            resolve: MainResolver
          }
        }
      });
  });
