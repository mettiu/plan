'use strict';

angular.module('planApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('main', {
        parent: 'master-app-layout-frame',
        url: '/',
        views: {
          'main-content@master-app-layout': {
            templateUrl: 'app/main/main.html',
            controller: 'MainCtrl',
            controllerAs: 'MainCtrl',
            authenticate: true,
            resolve: MainResolver
          }
        }
      });
  });
