'use strict';

angular.module('planApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('frame.features', {
        url: '/features',
        views: {
          "main-content": {
            templateUrl: 'app/admin/features/features.html',
            controller: 'FeaturesCtrl',
            controllerAs: 'FeaturesCtrl',
            authenticate: true,
            resolve: FeaturesResolver
          }
        }
      });
  });
