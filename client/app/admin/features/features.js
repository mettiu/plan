'use strict';

angular.module('planApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('features', {
        parent: 'master-app-layout-frame',
        url: '/features',
        authenticate: true,
        views: {
          'main-content@master-app-layout': {
            templateUrl: 'app/admin/features/features.html',
            controller: 'FeaturesCtrl',
            controllerAs: 'FeaturesCtrl',
            resolve: FeaturesResolver
          }
        }
      });
  });
